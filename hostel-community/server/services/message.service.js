import mongoose from 'mongoose';
import Message, { ALLOWED_REACTION_TYPES } from '../models/Message.js';
import { getRoomById } from './room.service.js';
import { createNotification } from './notification.service.js';
import { getIO } from '../socket/chat.socket.js';
import { saveAttachment } from './storage.service.js';
import { validateUploadFile } from '../utils/fileValidator.js';

export { ALLOWED_REACTION_TYPES };

export const POPULATE_REPLY_TO = {
  path: 'replyTo',
  select: 'content isDeleted attachment anonymousName anonymousAvatar sender',
  populate: {
    path: 'sender',
    select: 'anonymousName anonymousAvatar',
  },
};

/**
 * Format replyTo message into a safe quoted-message response.
 * Strictly guarantees that sender's real fullName, email, and internal MongoDB user ID are never returned.
 * If the original message was deleted or is unavailable, returns a safe fallback.
 */
export const formatSafeReplyTo = (replyMsg) => {
  if (!replyMsg) return null;

  // Handle unpopulated ObjectId or string (e.g. original message was permanently deleted or not populated)
  if (typeof replyMsg !== 'object' || replyMsg instanceof mongoose.Types.ObjectId) {
    return {
      id: replyMsg.toString(),
      content: 'Original message unavailable',
      isDeleted: true,
      sender: {
        anonymousName: 'Anonymous Student',
        anonymousAvatar: '🎭',
      },
      attachment: null,
    };
  }

  const id = replyMsg._id ? replyMsg._id.toString() : (replyMsg.id || String(replyMsg));
  const isDeleted = Boolean(replyMsg.isDeleted);
  const sender = replyMsg.sender || {};
  const senderName = replyMsg.anonymousName || sender.anonymousName || 'Anonymous Student';
  const senderAvatar = replyMsg.anonymousAvatar || sender.anonymousAvatar || '🎭';

  if (isDeleted) {
    return {
      id,
      content: 'Original message unavailable',
      isDeleted: true,
      sender: {
        anonymousName: senderName,
        anonymousAvatar: senderAvatar,
      },
      attachment: null,
    };
  }

  let attachmentSummary = null;
  if (
    replyMsg.attachment &&
    (replyMsg.attachment.originalName || replyMsg.attachment.storedName || replyMsg.attachment.url)
  ) {
    attachmentSummary = {
      originalName: replyMsg.attachment.originalName || 'Attachment',
      mimeType: replyMsg.attachment.mimeType || 'application/octet-stream',
    };
  }

  return {
    id,
    content: typeof replyMsg.content === 'string' ? replyMsg.content : '',
    isDeleted: false,
    sender: {
      anonymousName: senderName,
      anonymousAvatar: senderAvatar,
    },
    attachment: attachmentSummary,
  };
};

/**
 * Format message into a safe community response.
 * Guarantees that sender's real fullName and email are never returned.
 * Replaces content with "Message deleted" if soft-deleted.
 */
export const formatSafeMessage = (msg, requestingUser = null) => {
  const sender = msg.sender || {};
  const isDeleted = Boolean(msg.isDeleted);

  const reactionCounts = {
    like: 0,
    love: 0,
    laugh: 0,
    fire: 0,
    clap: 0,
  };

  const rawSenderId = sender._id
    ? sender._id.toString()
    : (sender.id || (msg.sender?._id ? msg.sender._id.toString() : (msg.sender ? msg.sender.toString() : undefined)));

  const reqUserId = requestingUser?._id
    ? requestingUser._id.toString()
    : (requestingUser?.id ? requestingUser.id.toString() : (requestingUser ? requestingUser.toString() : null));

  const isOwn = Boolean(reqUserId && rawSenderId && reqUserId === rawSenderId);

  const safeReactions = [];
  const userReactions = [];

  if (!isDeleted && Array.isArray(msg.reactions)) {
    for (const r of msg.reactions) {
      if (reactionCounts[r.type] !== undefined) {
        reactionCounts[r.type] += 1;
      }
      const rUserId = r.user?._id
        ? r.user._id.toString()
        : (r.user?.id ? r.user.id.toString() : (r.user ? r.user.toString() : null));
      const isMyReaction = Boolean(reqUserId && rUserId && reqUserId === rUserId);
      if (isMyReaction && !userReactions.includes(r.type)) {
        userReactions.push(r.type);
      }
      safeReactions.push({
        type: r.type,
        ...(isMyReaction ? { reactedByMe: true } : {}),
      });
    }
  }

  const senderName = msg.anonymousName || sender.anonymousName || 'Anonymous Student';
  const senderAvatar = msg.anonymousAvatar || sender.anonymousAvatar || '🎭';
  const senderYear = msg.senderYear || sender.year || 'Hostel Resident';

  return {
    id: msg._id.toString(),
    room: msg.room?._id ? msg.room._id.toString() : msg.room?.toString?.() || String(msg.room),
    content: isDeleted ? 'Message deleted' : msg.content,
    isDeleted,
    deletedAt: msg.deletedAt || null,
    isPinned: Boolean(msg.isPinned),
    pinnedAt: msg.pinnedAt || null,
    sender: {
      ...(isOwn ? { id: rawSenderId } : {}),
      anonymousName: senderName,
      anonymousAvatar: senderAvatar,
      year: senderYear,
    },
    isOwn,
    reactions: safeReactions,
    reactionCounts,
    userReactions,
    replyTo: msg.replyTo ? formatSafeReplyTo(msg.replyTo) : null,
    attachment:
      !isDeleted && msg.attachment && (msg.attachment.url || msg.attachment.originalName)
        ? {
            originalName: msg.attachment.originalName,
            mimeType: msg.attachment.mimeType,
            size: msg.attachment.size,
            url: msg.attachment.url || `/api/messages/${msg._id}/attachment`,
          }
        : null,
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
    .populate(POPULATE_REPLY_TO)
    .lean();

  // Reverse so the oldest in this slice appears first (chronological order)
  const chronologicalMessages = rawMessages.reverse();

  const formattedMessages = chronologicalMessages.map((m) => formatSafeMessage(m, user));

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
 * Validate and resolve replyTo reference.
 * Ensures the target message exists and belongs to the exact same room.
 * Throws 400 for malformed IDs or cross-room references, and 404 if message does not exist.
 */
export const validateAndResolveReplyTo = async (replyTo, room) => {
  if (replyTo === undefined || replyTo === null || replyTo === '') {
    return null;
  }

  const rawId = typeof replyTo === 'object' && replyTo !== null ? (replyTo.id || replyTo._id) : replyTo;
  if (!rawId) return null;

  if (typeof rawId !== 'string' && !(rawId instanceof mongoose.Types.ObjectId)) {
    const error = new Error('Invalid replyTo message identifier.');
    error.statusCode = 400;
    throw error;
  }

  const idString = rawId.toString();
  if (!mongoose.Types.ObjectId.isValid(idString)) {
    const error = new Error('Invalid replyTo message identifier.');
    error.statusCode = 400;
    throw error;
  }

  const originalMessage = await Message.findById(idString);
  if (!originalMessage) {
    const error = new Error('The message being replied to does not exist.');
    error.statusCode = 404;
    throw error;
  }

  const originalRoomId = originalMessage.room?.toString?.() || String(originalMessage.room);
  const currentRoomId = room._id?.toString?.() || String(room._id || room);

  if (originalRoomId !== currentRoomId) {
    const error = new Error('Cross-room replies are not permitted.');
    error.statusCode = 400;
    throw error;
  }

  return originalMessage._id;
};

/**
 * Create a message in a room with validation and authorization checks.
 */
export const createMessage = async ({ roomId, user, content, replyTo = null }) => {
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

  // Validate optional replyTo
  const validatedReplyTo = await validateAndResolveReplyTo(replyTo, room);

  const message = new Message({
    room: room._id,
    sender: user._id,
    replyTo: validatedReplyTo,
    content: trimmedContent,
    anonymousName: user.anonymousName,
    anonymousAvatar: user.anonymousAvatar,
    senderYear: user.year,
  });

  await message.save();

  // Populate sender with ONLY anonymous fields
  await message.populate('sender', 'anonymousName anonymousAvatar year');

  if (message.replyTo) {
    await message.populate(POPULATE_REPLY_TO);
  }

  return formatSafeMessage(message, user);
};

/**
 * Create a message with a file attachment in an authorized room.
 */
export const createMessageWithAttachment = async ({ roomId, user, content, file, replyTo = null }) => {
  // 1. Verify user authorization for the room
  const room = await getRoomById(roomId, user);

  // Validate optional replyTo
  const validatedReplyTo = await validateAndResolveReplyTo(replyTo, room);

  // 2. Validate file presence and contents
  if (!file) {
    const error = new Error('No file attachment provided.');
    error.statusCode = 400;
    throw error;
  }

  // Validate file against size, extension, MIME type, and magic bytes
  validateUploadFile(file);

  // Validate optional content length
  const trimmedContent = typeof content === 'string' ? content.trim() : '';
  if (trimmedContent.length > 1000) {
    const error = new Error('Message caption cannot exceed 1000 characters.');
    error.statusCode = 400;
    throw error;
  }

  // 3. Save file using isolated storage service
  const savedFile = await saveAttachment({
    buffer: file.buffer,
    originalName: file.originalname,
    mimeType: file.mimetype,
  });

  // 4. Create and save message
  const message = new Message({
    room: room._id,
    sender: user._id,
    replyTo: validatedReplyTo,
    content: trimmedContent,
    anonymousName: user.anonymousName,
    anonymousAvatar: user.anonymousAvatar,
    senderYear: user.year,
    attachment: {
      originalName: savedFile.originalName,
      storedName: savedFile.storedName,
      mimeType: savedFile.mimeType,
      size: savedFile.size,
      url: '',
    },
  });

  // Assign clean REST URL
  message.attachment.url = `/api/messages/${message._id}/attachment`;
  await message.save();

  // Populate sender with ONLY anonymous fields
  await message.populate('sender', 'anonymousName anonymousAvatar year');

  if (message.replyTo) {
    await message.populate(POPULATE_REPLY_TO);
  }

  return formatSafeMessage(message, user);
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
  if (message.replyTo) {
    await message.populate(POPULATE_REPLY_TO);
  }

  // Trigger notification for message owner (if not a self-reaction)
  const isMessageOwner = message.sender._id
    ? message.sender._id.toString() === user._id.toString()
    : message.sender.toString() === user._id.toString();

  if (!isMessageOwner) {
    try {
      const emojiMap = {
        like: '👍',
        love: '❤️',
        laugh: '😂',
        fire: '🔥',
        clap: '👏',
      };
      const emoji = emojiMap[type] || type;

      await createNotification({
        recipient: message.sender._id || message.sender,
        type: 'reaction',
        actor: user._id,
        room: message.room,
        message: message._id,
        title: 'New Reaction',
        content: `Someone reacted ${emoji} to your message.`,
        metadata: { reactionType: type, emoji },
      });
    } catch (err) {
      // Don't fail the reaction request if notification fails
    }
  }

  return formatSafeMessage(message, user);
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
  if (message.replyTo) {
    await message.populate(POPULATE_REPLY_TO);
  }

  return formatSafeMessage(message, user);
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
  if (message.replyTo) {
    await message.populate(POPULATE_REPLY_TO);
  }

  // If an administrator removed another student's message, notify the affected student
  if (isAdmin && !isOwner) {
    try {
      await createNotification({
        recipient: message.sender._id || message.sender,
        type: 'moderation',
        actor: null, // Strictly conceal admin identity
        room: message.room,
        message: message._id,
        title: 'Message Moderation',
        content: 'Your message was removed by a moderator.',
        metadata: { action: 'message_removed' },
      });
    } catch (err) {
      // Don't fail the deletion if notification fails
    }
  }

  return formatSafeMessage(message);
};

/**
 * Admin: Pin a message in a room.
 * Enforces admin role, room access, and message validity.
 */
export const pinMessage = async ({ messageId, user }) => {
  if (user.role !== 'admin') {
    const error = new Error('Access denied: Administrator privileges required to pin messages.');
    error.statusCode = 403;
    throw error;
  }

  const message = await Message.findById(messageId);
  if (!message) {
    const error = new Error('Message not found.');
    error.statusCode = 404;
    throw error;
  }

  if (message.isDeleted) {
    const error = new Error('Cannot pin a deleted message.');
    error.statusCode = 400;
    throw error;
  }

  // Verify room authorization
  await getRoomById(message.room, user);

  message.isPinned = true;
  message.pinnedAt = new Date();
  message.pinnedBy = user._id;

  await message.save();
  await message.populate('sender', 'anonymousName anonymousAvatar year');
  if (message.replyTo) {
    await message.populate(POPULATE_REPLY_TO);
  }

  const safeMsg = formatSafeMessage(message, user);

  // Real-time broadcast
  try {
    const io = getIO();
    if (io) {
      const peerMsg = {
        ...safeMsg,
        isOwn: false,
        sender: {
          anonymousName: safeMsg.sender.anonymousName,
          anonymousAvatar: safeMsg.sender.anonymousAvatar,
          year: safeMsg.sender.year,
        },
      };
      io.to(safeMsg.room).emit('message:pinned', peerMsg);
    }
  } catch (err) {
    // Socket might not be available in test harness
  }

  return safeMsg;
};

/**
 * Admin: Unpin a message.
 */
export const unpinMessage = async ({ messageId, user }) => {
  if (user.role !== 'admin') {
    const error = new Error('Access denied: Administrator privileges required to unpin messages.');
    error.statusCode = 403;
    throw error;
  }

  const message = await Message.findById(messageId);
  if (!message) {
    const error = new Error('Message not found.');
    error.statusCode = 404;
    throw error;
  }

  await getRoomById(message.room, user);

  message.isPinned = false;
  message.pinnedAt = null;
  message.pinnedBy = null;

  await message.save();
  await message.populate('sender', 'anonymousName anonymousAvatar year');
  if (message.replyTo) {
    await message.populate(POPULATE_REPLY_TO);
  }

  const safeMsg = formatSafeMessage(message, user);

  try {
    const io = getIO();
    if (io) {
      io.to(safeMsg.room).emit('message:unpinned', {
        messageId: safeMsg.id,
        roomId: safeMsg.room,
      });
    }
  } catch (err) {
    // Socket might not be available in test harness
  }

  return safeMsg;
};

/**
 * Retrieve all pinned messages for a room with authorization check.
 */
export const getPinnedMessages = async (roomId, user) => {
  await getRoomById(roomId, user);

  const pinned = await Message.find({
    room: roomId,
    isPinned: true,
    isDeleted: false,
  })
    .sort({ pinnedAt: -1, createdAt: -1 })
    .populate('sender', 'anonymousName anonymousAvatar year')
    .populate(POPULATE_REPLY_TO)
    .lean();

  return pinned.map((m) => formatSafeMessage(m, user));
};

export default {
  ALLOWED_REACTION_TYPES,
  POPULATE_REPLY_TO,
  formatSafeReplyTo,
  validateAndResolveReplyTo,
  formatSafeMessage,
  getRoomMessages,
  createMessage,
  createMessageWithAttachment,
  addReaction,
  removeReaction,
  deleteMessage,
  pinMessage,
  unpinMessage,
  getPinnedMessages,
};
