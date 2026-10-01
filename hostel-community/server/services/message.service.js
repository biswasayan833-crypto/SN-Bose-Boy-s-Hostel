import Message, { ALLOWED_REACTION_TYPES } from '../models/Message.js';
import { getRoomById } from './room.service.js';

export { ALLOWED_REACTION_TYPES };

/**
 * Format message into a safe community response.
 * Guarantees that sender's real fullName and email are never returned.
 * Replaces content with "Message deleted" if soft-deleted.
 */
export const formatSafeMessage = (msg) => {
  const sender = msg.sender || {};
  const isDeleted = Boolean(msg.isDeleted);

  const reactionCounts = {
    like: 0,
    love: 0,
    laugh: 0,
    fire: 0,
    clap: 0,
  };

  const safeReactions = [];

  if (!isDeleted && Array.isArray(msg.reactions)) {
    for (const r of msg.reactions) {
      if (reactionCounts[r.type] !== undefined) {
        reactionCounts[r.type] += 1;
      }
      safeReactions.push({
        user: r.user?._id ? r.user._id.toString() : r.user?.toString?.() || String(r.user),
        type: r.type,
      });
    }
  }

  return {
    id: msg._id.toString(),
    room: msg.room?._id ? msg.room._id.toString() : msg.room?.toString?.() || String(msg.room),
    content: isDeleted ? 'Message deleted' : msg.content,
    isDeleted,
    deletedAt: msg.deletedAt || null,
    sender: {
      id: sender._id ? sender._id.toString() : sender.id,
      anonymousName: sender.anonymousName || 'Anonymous Student',
      anonymousAvatar: sender.anonymousAvatar || '🎭',
      year: sender.year || 'Hostel Resident',
    },
    reactions: safeReactions,
    reactionCounts,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
  };
};

/**
 * Get paginated messages for a room with authorization check.
 * Chronologically sorted (oldest to newest) for natural chat reading.
 */
export const getRoomMessages = async (roomId, user, { page = 1, limit = 30 } = {}) => {
  // Verify authorization for room
  await getRoomById(roomId, user);

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
  const skip = (parsedPage - 1) * parsedLimit;

  const total = await Message.countDocuments({ room: roomId });

  // Query latest messages first for pagination, then sort chronologically for display
  const rawMessages = await Message.find({ room: roomId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit)
    .populate('sender', 'anonymousName anonymousAvatar year')
    .lean();

  // Reverse so the oldest in this slice appears first (chronological order)
  const chronologicalMessages = rawMessages.reverse();

  const formattedMessages = chronologicalMessages.map(formatSafeMessage);

  return {
    messages: formattedMessages,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
      hasMore: skip + rawMessages.length < total,
    },
  };
};

/**
 * Create a message in a room with validation and authorization checks.
 */
export const createMessage = async ({ roomId, user, content }) => {
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    const error = new Error('Message content cannot be empty.');
    error.statusCode = 400;
    throw error;
  }

  const trimmedContent = content.trim();
  if (trimmedContent.length > 1000) {
    const error = new Error('Message content cannot exceed 1000 characters.');
    error.statusCode = 400;
    throw error;
  }

  // Verify authorization for room
  const room = await getRoomById(roomId, user);

  const message = new Message({
    room: room._id,
    sender: user._id,
    content: trimmedContent,
  });

  await message.save();

  // Populate sender with ONLY anonymous fields
  await message.populate('sender', 'anonymousName anonymousAvatar year');

  return formatSafeMessage(message);
};

/**
 * Add a reaction to a message.
 * Enforces authenticated user, valid reaction type, room authorization,
 * prevents duplicates, and prevents reacting to deleted messages.
 */
export const addReaction = async ({ messageId, user, type }) => {
  if (!ALLOWED_REACTION_TYPES.includes(type)) {
    const error = new Error(`Invalid reaction type '${type}'. Allowed: ${ALLOWED_REACTION_TYPES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const message = await Message.findById(messageId);
  if (!message) {
    const error = new Error('Message not found.');
    error.statusCode = 404;
    throw error;
  }

  if (message.isDeleted) {
    const error = new Error('Cannot react to a deleted message.');
    error.statusCode = 400;
    throw error;
  }

  // Verify that the user has authorization to access the message's room
  await getRoomById(message.room, user);

  const userIdStr = user._id.toString();
  const alreadyReacted = message.reactions.some(
    (r) => r.user.toString() === userIdStr && r.type === type
  );

  if (alreadyReacted) {
    const error = new Error(`You have already reacted with '${type}' to this message.`);
    error.statusCode = 400;
    throw error;
  }

  message.reactions.push({
    user: user._id,
    type,
    createdAt: new Date(),
  });

  await message.save();
  await message.populate('sender', 'anonymousName anonymousAvatar year');

  return formatSafeMessage(message);
};

/**
 * Remove a user's reaction from a message.
 * Enforces authenticated user, room authorization, and prevents modifying other users' reactions.
 */
export const removeReaction = async ({ messageId, user, type }) => {
  if (!ALLOWED_REACTION_TYPES.includes(type)) {
    const error = new Error(`Invalid reaction type '${type}'. Allowed: ${ALLOWED_REACTION_TYPES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const message = await Message.findById(messageId);
  if (!message) {
    const error = new Error('Message not found.');
    error.statusCode = 404;
    throw error;
  }

  if (message.isDeleted) {
    const error = new Error('Cannot modify reactions on a deleted message.');
    error.statusCode = 400;
    throw error;
  }

  // Verify user has authorization for room
  await getRoomById(message.room, user);

  const userIdStr = user._id.toString();
  const reactionIndex = message.reactions.findIndex(
    (r) => r.user.toString() === userIdStr && r.type === type
  );

  if (reactionIndex === -1) {
    const error = new Error(`Reaction '${type}' not found for this user.`);
    error.statusCode = 404;
    throw error;
  }

  message.reactions.splice(reactionIndex, 1);
  await message.save();
  await message.populate('sender', 'anonymousName anonymousAvatar year');

  return formatSafeMessage(message);
};

/**
 * Soft-delete a message.
 * Enforces message ownership (or admin role).
 * Replaces content and marks isDeleted: true.
 */
export const deleteMessage = async ({ messageId, user }) => {
  const message = await Message.findById(messageId);
  if (!message) {
    const error = new Error('Message not found.');
    error.statusCode = 404;
    throw error;
  }

  const isOwner = message.sender.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    const error = new Error('Access denied: You can only delete your own messages.');
    error.statusCode = 403;
    throw error;
  }

  // If student, check room access
  if (!isAdmin) {
    await getRoomById(message.room, user);
  }

  message.isDeleted = true;
  message.deletedAt = new Date();
  message.reactions = []; // clear reactions on deleted message
  await message.save();
  await message.populate('sender', 'anonymousName anonymousAvatar year');

  return formatSafeMessage(message);
};

export default {
  ALLOWED_REACTION_TYPES,
  formatSafeMessage,
  getRoomMessages,
  createMessage,
  addReaction,
  removeReaction,
  deleteMessage,
};
