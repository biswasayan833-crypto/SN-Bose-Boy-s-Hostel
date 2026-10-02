import User from '../models/User.js';
import Message from '../models/Message.js';
import {
  computeIdentityKey,
  canonicalizeAvatar,
} from './identityHelper.js';
import { generateUniqueAnonymousIdentity } from '../services/identity.service.js';
import { logger } from './logger.js';

/**
 * Migration helper for anonymous community identities.
 *
 * Actions performed safely:
 * 1. Safe historical message snapshot: Backfills anonymousName, anonymousAvatar, and senderYear
 *    on any historical messages that currently lack them, locking in their sender persona.
 * 2. Identity key backfill: Computes normalized anonymousIdentityKey for all existing users.
 * 3. Duplicate detection & non-destructive resolution:
 *    - Detects any duplicate anonymous identity combinations among active users.
 *    - Preserves the earliest active user's identity intact.
 *    - Automatically reassigns any subsequent duplicate active users to an unused identity combination.
 *    - Strictly preserves all fullNames, emails, passwords, roles, and historical messages.
 * 4. Index synchronization: Ensures the partial unique index on active anonymousIdentityKey is created.
 */
export const migrateIdentities = async () => {
  logger.info('[Identity Migration] Starting anonymous identity integrity check and migration...');

  // 1. Backfill historical messages snapshot from author user records
  try {
    const unSnapshottedMessages = await Message.find({
      $or: [
        { anonymousName: { $exists: false } },
        { anonymousName: null },
        { anonymousName: '' },
      ],
    }).populate('sender', 'anonymousName anonymousAvatar year');

    let backfilledCount = 0;
    for (const msg of unSnapshottedMessages) {
      if (msg.sender) {
        msg.anonymousName = msg.sender.anonymousName || 'Anonymous Student';
        msg.anonymousAvatar = msg.sender.anonymousAvatar || '🎭';
        msg.senderYear = msg.sender.year || 'Hostel Resident';
        await msg.save();
        backfilledCount++;
      }
    }
    if (backfilledCount > 0) {
      logger.info(`[Identity Migration] Backfilled historical identity snapshots on ${backfilledCount} messages.`);
    }
  } catch (err) {
    logger.warn(`[Identity Migration] Message snapshot backfill notice: ${err.message}`);
  }

  // 2. Process all users: compute keys and resolve any active duplicates
  const users = await User.find({}).sort({ createdAt: 1 });
  const activeKeyMap = new Map(); // key -> Array<User>
  let updatedUsersCount = 0;
  let resolvedDuplicatesCount = 0;

  for (const user of users) {
    const key = computeIdentityKey(user.anonymousName, user.anonymousAvatar);

    if (user.anonymousIdentityKey !== key) {
      user.anonymousIdentityKey = key;
      await user.save();
      updatedUsersCount++;
    }

    if (user.isActive) {
      if (!activeKeyMap.has(key)) {
        activeKeyMap.set(key, []);
      }
      activeKeyMap.get(key).push(user);
    }
  }

  // 3. Resolve active duplicates
  for (const [key, matchingUsers] of activeKeyMap.entries()) {
    if (matchingUsers.length > 1) {
      logger.warn(
        `[Identity Migration] Detected ${matchingUsers.length} active users sharing identity key '${key}'. Resolving...`
      );

      // Earliest created user keeps their existing identity
      const [firstUser, ...duplicateUsers] = matchingUsers;
      logger.info(
        `[Identity Migration] Preserving original identity for resident ID: ${firstUser._id}`
      );

      // Reassign duplicates to new unique identities
      for (const dupUser of duplicateUsers) {
        const newPersona = await generateUniqueAnonymousIdentity();
        dupUser.anonymousName = newPersona.anonymousName;
        dupUser.anonymousAvatar = newPersona.anonymousAvatar;
        dupUser.anonymousIdentityKey = computeIdentityKey(
          newPersona.anonymousName,
          newPersona.anonymousAvatar
        );

        await dupUser.save();
        resolvedDuplicatesCount++;

        logger.info(
          `[Identity Migration] Assigned new unique identity to resident ID ${dupUser._id}: ` +
          `'${newPersona.anonymousName}' with avatar '${newPersona.anonymousAvatar}'`
        );
      }
    }
  }

  // 4. Synchronize indexes on User collection
  try {
    await User.syncIndexes();
    logger.info('[Identity Migration] User collection indexes successfully synchronized.');
  } catch (err) {
    logger.warn(`[Identity Migration] Index synchronization notice: ${err.message}`);
  }

  logger.info(
    `[Identity Migration] Completed. Checked ${users.length} users, updated ${updatedUsersCount} keys, resolved ${resolvedDuplicatesCount} duplicates.`
  );

  return {
    totalUsers: users.length,
    updatedKeys: updatedUsersCount,
    resolvedDuplicates: resolvedDuplicatesCount,
  };
};

export default {
  migrateIdentities,
};
