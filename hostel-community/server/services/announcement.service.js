import Announcement, { ALLOWED_ANNOUNCEMENT_PRIORITIES } from '../models/Announcement.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import { getRoomById, getAccessibleRooms } from './room.service.js';
import { createNotification } from './notification.service.js';
import { getIO } from '../socket/chat.socket.js';
import { logger } from '../utils/logger.js';

export { ALLOWED_ANNOUNCEMENT_PRIORITIES };

/**
 * Retrieve active announcements accessible to the requesting user.
 * Supports filtering by roomId.
 * Expired announcements are automatically filtered out.
 */
export const getAnnouncements = async (user, { roomId } = {}) => {
  const now = new Date();
  const notExpiredQuery = {
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  };

  let roomFilter = {};

  if (roomId) {
    // Enforce authorization for the specified room
    await getRoomById(roomId, user);
    roomFilter = { targetRoom: roomId };
  } else {
    // Find all accessible rooms for user
    const accessible = await getAccessibleRooms(user);
    const roomIds = accessible.map((r) => r._id);
    roomFilter = { targetRoom: { $in: roomIds } };
  }

  const query = {
    ...roomFilter,
    ...notExpiredQuery,
  };

  const announcements = await Announcement.find(query)
    .populate('targetRoom', 'name slug type allowedYear icon')
    .sort({ isPinned: -1, createdAt: -1 });

  return announcements.map((a) => a.toSafeObject());
};

/**
 * Retrieve single announcement with room authorization check.
 */
export const getAnnouncementById = async (announcementId, user) => {
  const announcement = await Announcement.findById(announcementId).populate(
    'targetRoom',
    'name slug type allowedYear icon'
  );

  if (!announcement) {
    const error = new Error('Announcement not found.');
    error.statusCode = 404;
    throw error;
  }

  // Verify access to the announcement's target room
  await getRoomById(announcement.targetRoom._id, user);

  return announcement.toSafeObject();
};

/**
 * Admin: Create an announcement.
 * Triggers Socket.IO broadcast and creates in-app notifications for urgent/important priorities.
 */
export const createAnnouncement = async (
  adminUser,
  { title, content, targetRoom, priority = 'normal', isPinned = false, expiresAt = null }
) => {
  if (adminUser.role !== 'admin') {
    const error = new Error('Access denied: Administrator privileges required.');
    error.statusCode = 403;
    throw error;
  }

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    const error = new Error('Title is required and must contain at least 3 characters.');
    error.statusCode = 400;
    throw error;
  }

  const trimmedTitle = title.trim();
  if (trimmedTitle.length > 120) {
    const error = new Error('Title cannot exceed 120 characters.');
    error.statusCode = 400;
    throw error;
  }

  if (!content || typeof content !== 'string' || content.trim().length < 5) {
    const error = new Error('Content is required and must contain at least 5 characters.');
    error.statusCode = 400;
    throw error;
  }

  const trimmedContent = content.trim();
  if (trimmedContent.length > 2000) {
    const error = new Error('Content cannot exceed 2000 characters.');
    error.statusCode = 400;
    throw error;
  }

  if (!ALLOWED_ANNOUNCEMENT_PRIORITIES.includes(priority)) {
    const error = new Error(
      `Invalid priority '${priority}'. Allowed: ${ALLOWED_ANNOUNCEMENT_PRIORITIES.join(', ')}`
    );
    error.statusCode = 400;
    throw error;
  }

  if (!targetRoom) {
    const error = new Error('Target room is required.');
    error.statusCode = 400;
    throw error;
  }

  const room = await Room.findById(targetRoom);
  if (!room || !room.isActive) {
    const error = new Error('Target room does not exist or is inactive.');
    error.statusCode = 404;
    throw error;
  }

  let parsedExpiresAt = null;
  if (expiresAt) {
    parsedExpiresAt = new Date(expiresAt);
    if (isNaN(parsedExpiresAt.getTime())) {
      const error = new Error('Invalid expiration date format.');
      error.statusCode = 400;
      throw error;
    }
    if (parsedExpiresAt <= new Date()) {
      const error = new Error('Expiration date must be in the future.');
      error.statusCode = 400;
      throw error;
    }
  }

  const announcement = new Announcement({
    title: trimmedTitle,
    content: trimmedContent,
    createdBy: adminUser._id,
    targetRoom: room._id,
    priority,
    isPinned: Boolean(isPinned),
    expiresAt: parsedExpiresAt,
  });

  await announcement.save();
  await announcement.populate('targetRoom', 'name slug type allowedYear icon');

  const safeAnnouncement = announcement.toSafeObject();

  // Socket.IO real-time emission
  try {
    const io = getIO();
    if (io) {
      const roomChannel = room._id.toString();
      io.to(roomChannel).emit('announcement:new', safeAnnouncement);

      // If global room, broadcast to all or if year room, emit to year room channel
      if (room.type === 'global') {
        io.emit('announcement:new', safeAnnouncement);
      } else if (room.allowedYear) {
        io.to(`year:${room.allowedYear}`).emit('announcement:new', safeAnnouncement);
      }
    }
  } catch (err) {
    logger.debug(`[Socket] Could not emit announcement:new: ${err.message}`);
  }

  // Create notifications for affected users on urgent or important announcements
  if (priority === 'important' || priority === 'urgent') {
    try {
      let recipientQuery = { isActive: true, role: 'student' };
      if (room.type === 'year' && room.allowedYear) {
        recipientQuery.year = room.allowedYear;
      }

      const eligibleStudents = await User.find(recipientQuery).select('_id');

      for (const student of eligibleStudents) {
        try {
          await createNotification({
            recipient: student._id,
            type: 'announcement',
            actor: null, // Strictly conceal admin personal identity
            room: room._id,
            title:
              priority === 'urgent'
                ? `🚨 Urgent: ${trimmedTitle}`
                : `📢 Important: ${trimmedTitle}`,
            content: trimmedContent.substring(0, 160),
            metadata: {
              announcementId: announcement._id.toString(),
              priority,
            },
          });
        } catch (notifErr) {
          // Continue to next student
        }
      }
    } catch (notifQueryErr) {
      logger.error('[Announcement] Error sending notifications:', notifQueryErr.message);
    }
  }

  return safeAnnouncement;
};

/**
 * Admin: Update an announcement.
 */
export const updateAnnouncement = async (adminUser, announcementId, updates = {}) => {
  if (adminUser.role !== 'admin') {
    const error = new Error('Access denied: Administrator privileges required.');
    error.statusCode = 403;
    throw error;
  }

  const announcement = await Announcement.findById(announcementId);
  if (!announcement) {
    const error = new Error('Announcement not found.');
    error.statusCode = 404;
    throw error;
  }

  if (updates.title !== undefined) {
    if (typeof updates.title !== 'string' || updates.title.trim().length < 3) {
      const error = new Error('Title must contain at least 3 characters.');
      error.statusCode = 400;
      throw error;
    }
    if (updates.title.trim().length > 120) {
      const error = new Error('Title cannot exceed 120 characters.');
      error.statusCode = 400;
      throw error;
    }
    announcement.title = updates.title.trim();
  }

  if (updates.content !== undefined) {
    if (typeof updates.content !== 'string' || updates.content.trim().length < 5) {
      const error = new Error('Content must contain at least 5 characters.');
      error.statusCode = 400;
      throw error;
    }
    if (updates.content.trim().length > 2000) {
      const error = new Error('Content cannot exceed 2000 characters.');
      error.statusCode = 400;
      throw error;
    }
    announcement.content = updates.content.trim();
  }

  if (updates.priority !== undefined) {
    if (!ALLOWED_ANNOUNCEMENT_PRIORITIES.includes(updates.priority)) {
      const error = new Error(
        `Invalid priority '${updates.priority}'. Allowed: ${ALLOWED_ANNOUNCEMENT_PRIORITIES.join(', ')}`
      );
      error.statusCode = 400;
      throw error;
    }
    announcement.priority = updates.priority;
  }

  if (updates.isPinned !== undefined) {
    announcement.isPinned = Boolean(updates.isPinned);
  }

  if (updates.expiresAt !== undefined) {
    if (updates.expiresAt === null || updates.expiresAt === '') {
      announcement.expiresAt = null;
    } else {
      const parsedDate = new Date(updates.expiresAt);
      if (isNaN(parsedDate.getTime())) {
        const error = new Error('Invalid expiration date format.');
        error.statusCode = 400;
        throw error;
      }
      announcement.expiresAt = parsedDate;
    }
  }

  if (updates.targetRoom !== undefined) {
    const room = await Room.findById(updates.targetRoom);
    if (!room || !room.isActive) {
      const error = new Error('Target room does not exist or is inactive.');
      error.statusCode = 404;
      throw error;
    }
    announcement.targetRoom = room._id;
  }

  await announcement.save();
  await announcement.populate('targetRoom', 'name slug type allowedYear icon');

  const safeAnnouncement = announcement.toSafeObject();

  // Socket.IO emission
  try {
    const io = getIO();
    if (io) {
      const targetRoomId = announcement.targetRoom._id.toString();
      io.to(targetRoomId).emit('announcement:updated', safeAnnouncement);
    }
  } catch (err) {
    logger.debug(`[Socket] Could not emit announcement:updated: ${err.message}`);
  }

  return safeAnnouncement;
};

/**
 * Admin: Delete an announcement.
 */
export const deleteAnnouncement = async (adminUser, announcementId) => {
  if (adminUser.role !== 'admin') {
    const error = new Error('Access denied: Administrator privileges required.');
    error.statusCode = 403;
    throw error;
  }

  const announcement = await Announcement.findById(announcementId);
  if (!announcement) {
    const error = new Error('Announcement not found.');
    error.statusCode = 404;
    throw error;
  }

  const targetRoomId = announcement.targetRoom.toString();
  await Announcement.deleteOne({ _id: announcement._id });

  // Socket.IO emission
  try {
    const io = getIO();
    if (io) {
      io.to(targetRoomId).emit('announcement:deleted', {
        id: announcementId,
        targetRoom: targetRoomId,
      });
    }
  } catch (err) {
    logger.debug(`[Socket] Could not emit announcement:deleted: ${err.message}`);
  }

  return { success: true, message: 'Announcement deleted successfully.' };
};

export default {
  ALLOWED_ANNOUNCEMENT_PRIORITIES,
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
