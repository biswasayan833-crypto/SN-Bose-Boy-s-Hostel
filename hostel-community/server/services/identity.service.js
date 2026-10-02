import User from '../models/User.js';
import {
  ALLOWED_AVATARS,
  canonicalizeAvatar,
  computeIdentityKey,
} from '../utils/identityHelper.js';

export { ALLOWED_AVATARS, canonicalizeAvatar, computeIdentityKey };

const ADJECTIVES = [
  'Anonymous',
  'Midnight',
  'Silent',
  'Hidden',
  'Quiet',
  'Mystery',
  'Cosmic',
  'Shadow',
  'Ghost',
  'Silver',
  'Solar',
  'Lunar',
  'Echo',
  'Cyber',
  'Phantom',
  'Swift',
  'Brave',
  'Zen',
  'Frost',
  'Astral',
  'Nebula',
  'Velvet',
  'Iron',
  'Crimson',
  'Storm',
];

const NOUN_AVATARS = [
  { noun: 'Panda', avatar: '🐼', id: 'avatar-06' },
  { noun: 'Owl', avatar: '🦉', id: 'avatar-05' },
  { noun: 'Rider', avatar: '🏍️', id: 'avatar-01' },
  { noun: 'Fox', avatar: '🦊', id: 'avatar-04' },
  { noun: 'Wolf', avatar: '🐺', id: 'avatar-02' },
  { noun: 'Tiger', avatar: '🐯', id: 'avatar-03' },
  { noun: 'Falcon', avatar: '🦅', id: 'avatar-01' },
  { noun: 'Lynx', avatar: '🐆', id: 'avatar-07' },
  { noun: 'Hawk', avatar: '🦅', id: 'avatar-01' },
  { noun: 'Nomad', avatar: '🧭', id: 'avatar-04' },
  { noun: 'Bear', avatar: '🐻', id: 'avatar-08' },
  { noun: 'Panther', avatar: '🐆', id: 'avatar-07' },
  { noun: 'Raven', avatar: '🐦‍⬛', id: 'avatar-01' },
  { noun: 'Stag', avatar: '🦌', id: 'avatar-02' },
  { noun: 'Phoenix', avatar: '🦅', id: 'avatar-01' },
  { noun: 'Badger', avatar: '🦡', id: 'avatar-08' },
  { noun: 'Otter', avatar: '🦦', id: 'avatar-06' },
  { noun: 'Koala', avatar: '🐨', id: 'avatar-06' },
];

/**
 * Checks whether an anonymous identity combination (name + avatar) is available among active students.
 * Comparison is case-insensitive for the name and canonical for the avatar.
 *
 * @param {string} anonymousName - Candidate pseudonym
 * @param {string} anonymousAvatar - Candidate avatar (id or emoji)
 * @param {string|mongoose.Types.ObjectId} [excludeUserId] - Optional user ID to exclude (e.g. current user)
 * @returns {Promise<boolean>} - true if available, false if already taken by another active user
 */
export const isIdentityAvailable = async (anonymousName, anonymousAvatar, excludeUserId = null) => {
  if (!anonymousName || !anonymousAvatar) return false;

  const key = computeIdentityKey(anonymousName, anonymousAvatar);
  const trimmedName = anonymousName.trim();
  const canonicalAvatar = canonicalizeAvatar(anonymousAvatar);

  // Escaped regex for case-insensitive exact name comparison
  const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nameRegex = new RegExp(`^${escapedName}$`, 'i');

  const query = {
    isActive: true,
    $or: [
      { anonymousIdentityKey: key },
      {
        anonymousName: { $regex: nameRegex },
        anonymousAvatar: { $in: [anonymousAvatar.trim(), canonicalAvatar] },
      },
    ],
  };

  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }

  const existing = await User.findOne(query).select('_id');
  return !existing;
};

/**
 * Validates identity availability and throws 409 Conflict if already occupied by another active student.
 * Never reveals who owns the conflicting identity.
 *
 * @param {string} anonymousName
 * @param {string} anonymousAvatar
 * @param {string|mongoose.Types.ObjectId} [excludeUserId]
 */
export const validateIdentityAvailability = async (anonymousName, anonymousAvatar, excludeUserId = null) => {
  const available = await isIdentityAvailable(anonymousName, anonymousAvatar, excludeUserId);
  if (!available) {
    const error = new Error('This anonymous identity is already in use. Please choose another.');
    error.statusCode = 409;
    throw error;
  }
};

/**
 * Generate a unique anonymous pseudonym and avatar combination for a student.
 * Checks against existing active users in MongoDB to ensure availability before returning.
 */
export const generateUniqueAnonymousIdentity = async () => {
  const maxRandomAttempts = 50;

  for (let attempt = 0; attempt < maxRandomAttempts; attempt++) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const item = NOUN_AVATARS[Math.floor(Math.random() * NOUN_AVATARS.length)];
    const candidateName = `${adj} ${item.noun}`;
    const candidateAvatar = item.avatar;

    const available = await isIdentityAvailable(candidateName, candidateAvatar);
    if (available) {
      return {
        anonymousName: candidateName,
        anonymousAvatar: candidateAvatar,
      };
    }
  }

  // Systematically search combinations if random sampling hits collisions
  for (const adj of ADJECTIVES) {
    for (const item of NOUN_AVATARS) {
      const candidateName = `${adj} ${item.noun}`;
      const candidateAvatar = item.avatar;
      const available = await isIdentityAvailable(candidateName, candidateAvatar);
      if (available) {
        return {
          anonymousName: candidateName,
          anonymousAvatar: candidateAvatar,
        };
      }
    }
  }

  // Fallback with numeric suffix if standard combination space is completely occupied
  let suffix = 2;
  while (true) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const item = NOUN_AVATARS[Math.floor(Math.random() * NOUN_AVATARS.length)];
    const candidateName = `${adj} ${item.noun} ${suffix}`;
    const candidateAvatar = item.avatar;

    const available = await isIdentityAvailable(candidateName, candidateAvatar);
    if (available) {
      return {
        anonymousName: candidateName,
        anonymousAvatar: candidateAvatar,
      };
    }
    suffix++;
  }
};

export default {
  ALLOWED_AVATARS,
  canonicalizeAvatar,
  computeIdentityKey,
  isIdentityAvailable,
  validateIdentityAvailability,
  generateUniqueAnonymousIdentity,
};
