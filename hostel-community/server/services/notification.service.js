import Notification, { ALLOWED_NOTIFICATION_TYPES } from '../models/Notification.js';
import { getIO } from '../socket/chat.socket.js';
import { logger } from '../utils/logger.js';

export { ALLOWED_NOTIFICATION_TYPES };

/**
 * Format notification to safe public payload.
 * STRICT PRIVACY: Actor's fullName, email, password, and private auth details are NEVER returned.
 * If actor exists, only anonymousName, anonymousAvatar, and year are exposed.
 * If moderation/system notification, actor is null or anonymized.
 */
export const formatSafeNotification = (notif) => {
  const actor = notif.actor;
  let safeActor = null;

  if (actor && (actor.anonymousName || actor._id)) {
    safeActor = {
      id: actor._id ? actor._id.toString() : actor.id || String(actor),
      anonymousName: actor.anonymousName || 'Anonymous Student',
      anonymousAvatar: actor.anonymousAvatar || '🎭',
      year: actor.year || 'Hostel Resident',
    };
  }

  const room = notif.room;
  let safeRoom = null;
  if (room && typeof room === 'object' && room.name) {
    safeRoom = {
      id: room._id ? room._id.toString() : room.id || String(room),
      name: room.name,
      slug: room.slug || '',
      type: room.type || 'year',
    };
  } else if (room) {
    safeRoom = {
      id: room._id ? room._id.toString() : room.toString(),
    };
  }

  const messageId = notif.message?._id
    ? notif.message._id.toString()
    : notif.message?.toString?.() || (notif.message ? String(notif.message) : null);

  return {
    id: notif._id.toString(),
    recipient: notif.recipient?._id
      ? notif.recipient._id.toString()
      : notif.recipient?.toString?.() || String(notif.recipient),
    type: notif.type,
    actor: safeActor,
    room: safeRoom,
    message: messageId,
    title: notif.title,
    content: notif.content,
    metadata: notif.metadata || {},
    readAt: notif.readAt || null,
    isRead: Boolean(notif.readAt),
    createdAt: notif.createdAt,
    updatedAt: notif.updatedAt,
  };
};

/**
 * Safely emit private notification event to a user via Socket.IO
 */
const emitPrivateNotification = (recipientId, safeNotification) => {
  try {
    const io = getIO();
    if (io && recipientId) {
      io.to(`user:${recipientId.toString()}`).emit('notification:new', safeNotification);
    }
  } catch (err) {
    // Socket might not be initialized in some test environments
    logger.debug(`[Socket] Could not emit notification:new: ${err.message}`);
  }
};

/**
 * Create a new notification and emit it in real time to the recipient.
 * Enforces privacy, notification types, and prevents self/duplicate spam.
 */
export const createNotification = async ({
  recipient,
  type,
  actor = null,
  room = null,
  message = null,
  title,
  content,
  metadata = {},
}) => {
  if (!recipient) {
    throw new Error('Notification recipient is required.');
  }

  if (!ALLOWED_NOTIFICATION_TYPES.includes(type)) {
    throw new Error(`Invalid notification type '${type}'. Allowed: ${ALLOWED_NOTIFICATION_TYPES.join(', ')}`);
  }

  // Prevent self-notification
  const recipientIdStr = recipient._id ? recipient._id.toString() : recipient.toString();
  const actorIdStr = actor ? (actor._id ? actor._id.toString() : actor.toString()) : null;

  if (actorIdStr && recipientIdStr === actorIdStr) {
    return null;
  }

  // Duplicate mitigation for reactions:
  // If an unread reaction notification already exists from this actor for this message, update it instead of creating duplicates
  if (type === 'reaction' && actor && message) {
    const existing = await Notification.findOne({
      recipient: recipientIdStr,
      actor: actorIdStr,
      message,
      type: 'reaction',
      readAt: null,
    });

    if (existing) {
      existing.title = title || existing.title;
      existing.content = content || existing.content;
      existing.metadata = { ...existing.metadata, ...metadata };
      await existing.save();

      await existing.populate([
        { path: 'actor', select: 'anonymousName anonymousAvatar year' },
        { path: 'room', select: 'name slug type allowedYear' },
      ]);

      const safeNotif = formatSafeNotification(existing);
      emitPrivateNotification(recipientIdStr, safeNotif);
      return safeNotif;
    }
  }

  const notification = new Notification({
    recipient: recipientIdStr,
    type,
    actor: actorIdStr,
    room: room?._id || room || null,
    message: message?._id || message || null,
    title: title.trim(),
    content: content.trim(),
    metadata,
  });

  await notification.save();

  await notification.populate([
    { path: 'actor', select: 'anonymousName anonymousAvatar year' },
    { path: 'room', select: 'name slug type allowedYear' },
  ]);

  const safeNotification = formatSafeNotification(notification);
  emitPrivateNotification(recipientIdStr, safeNotification);

  return safeNotification;
};

/**
 * Get paginated notifications for the authenticated user.
 */
export const getUserNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const query = { recipient: userId };
  if (unreadOnly) {
    query.readAt = null;
  }

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ recipient: userId, readAt: null });

  const rawNotifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit)
    .populate('actor', 'anonymousName anonymousAvatar year')
    .populate('room', 'name slug type allowedYear')
    .lean();

  const notifications = rawNotifications.map(formatSafeNotification);

  return {
    notifications,
    unreadCount,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
      hasMore: skip + rawNotifications.length < total,
    },
  };
};

/**
 * Get unread notification count for the authenticated user.
 */
export const getUnreadNotificationCount = async (userId) => {
  const count = await Notification.countDocuments({ recipient: userId, readAt: null });
  return { unreadCount: count };
};

/**
 * Mark a single notification as read.
 * Enforces ownership: a user CANNOT mark another user's notification as read.
 */
export const markNotificationRead = async ({ notificationId, userId }) => {
  const notification = await Notification.findById(notificationId)
    .populate('actor', 'anonymousName anonymousAvatar year')
    .populate('room', 'name slug type allowedYear');

  if (!notification) {
    const error = new Error('Notification not found.');
    error.statusCode = 404;
    throw error;
  }

  const recipientIdStr = notification.recipient._id
    ? notification.recipient._id.toString()
    : notification.recipient.toString();

  if (recipientIdStr !== userId.toString()) {
    const error = new Error('Access denied: You cannot modify another user\'s notification.');
    error.statusCode = 403;
    throw error;
  }

  if (!notification.readAt) {
    notification.readAt = new Date();
    await notification.save();
  }

  return formatSafeNotification(notification);
};

/**
 * Mark all notifications belonging to the authenticated user as read.
 */
export const markAllNotificationsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipient: userId, readAt: null },
    { $set: { readAt: new Date() } }
  );

  return {
    markedCount: result.modifiedCount || 0,
    unreadCount: 0,
  };
};

export default {
  ALLOWED_NOTIFICATION_TYPES,
  formatSafeNotification,
  createNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
};
