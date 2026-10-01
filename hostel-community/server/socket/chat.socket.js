import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Room from '../models/Room.js';
import {
  createMessage,
  addReaction,
  removeReaction,
  deleteMessage,
  pinMessage,
  unpinMessage,
} from '../services/message.service.js';
import { markRoomAsRead } from '../services/room.service.js';
import { logger } from '../utils/logger.js';

let ioInstance = null;

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  // Socket.IO JWT Authentication Middleware
  io.use(async (socket, next) => {
    try {
      // Extract token from auth handshake or authorization header
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers?.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      if (!token) {
        return next(new Error('Authentication error: No Bearer token provided in handshake'));
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return next(new Error('Server configuration error: JWT_SECRET missing'));
      }

      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.id).select('-password');

      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User not found or inactive'));
      }

      // Attach authenticated student to socket
      socket.user = user;
      next();
    } catch (err) {
      logger.warn(`[Socket Auth] Failed connection attempt: ${err.message}`);
      next(new Error(`Authentication failed: ${err.message}`));
    }
  });

  // Socket.IO Event Handlers
  io.on('connection', (socket) => {
    const student = socket.user;
    logger.info(
      `[Socket] Student connected: ${student.anonymousName} (${student.year}) [Socket ID: ${socket.id}]`
    );

    // Join private channel for direct individual notifications
    socket.join(`user:${student._id.toString()}`);

    // Join year-specific room for authorized real-time unread broadcasts
    if (student.year) {
      socket.join(`year:${student.year}`);
    }

    /**
     * Join Room Event
     * Client emits: 'join_room', { roomId } or { roomSlug }
     */
    socket.on('join_room', async (data, callback) => {
      try {
        const roomIdOrSlug = data?.roomId || data?.roomSlug;
        if (!roomIdOrSlug) {
          const errPayload = { message: 'Room identifier (roomId or roomSlug) is required.' };
          socket.emit('room_error', errPayload);
          if (callback) callback({ success: false, ...errPayload });
          return;
        }

        // Locate room by _id or slug
        let room;
        if (roomIdOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
          room = await Room.findById(roomIdOrSlug);
        } else {
          room = await Room.findOne({ slug: roomIdOrSlug.toLowerCase(), isActive: true });
        }

        if (!room) {
          const errPayload = { message: 'Room does not exist.' };
          socket.emit('room_error', errPayload);
          if (callback) callback({ success: false, ...errPayload });
          return;
        }

        // Backend authorization enforcement:
        // Global Room -> allowed
        // Year Room -> ONLY allowed if student.year === room.allowedYear
        if (!room.isUserAuthorized(student)) {
          const errPayload = {
            message: `Access denied: You are in ${student.year}, which cannot access the ${room.name} room.`,
          };
          logger.warn(
            `[Socket Auth] Denied ${student.anonymousName} (${student.year}) from joining ${room.name}`
          );
          socket.emit('room_error', errPayload);
          if (callback) callback({ success: false, ...errPayload });
          return;
        }

        const roomChannel = room._id.toString();
        socket.join(roomChannel);

        logger.info(
          `[Socket] ${student.anonymousName} joined room: ${room.name} (${roomChannel})`
        );

        const successPayload = {
          success: true,
          roomId: roomChannel,
          roomName: room.name,
          slug: room.slug,
        };

        socket.emit('room_joined', successPayload);
        if (callback) callback(successPayload);
      } catch (err) {
        logger.error(`[Socket] Error joining room: ${err.message}`);
        const errPayload = { message: err.message || 'Failed to join room.' };
        socket.emit('room_error', errPayload);
        if (callback) callback({ success: false, ...errPayload });
      }
    });

    /**
     * Leave Room Event
     * Client emits: 'leave_room', { roomId }
     */
    socket.on('leave_room', (data, callback) => {
      const roomId = data?.roomId;
      if (roomId) {
        socket.leave(roomId);
        logger.info(`[Socket] ${student.anonymousName} left room: ${roomId}`);
        socket.emit('room_left', { roomId });
        if (callback) callback({ success: true, roomId });
      }
    });

    /**
     * Mark Room as Read Event
     * Client emits: 'mark_room_read', { roomId }
     */
    socket.on('mark_room_read', async (data, callback) => {
      try {
        const roomId = data?.roomId || data?.roomSlug;
        if (roomId) {
          const result = await markRoomAsRead({ roomIdOrSlug: roomId, user: student });
          if (callback) callback({ success: true, ...result });
        }
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    /**
     * Send Message Event
     * Client emits: 'send_message', { roomId, content }
     */
    socket.on('send_message', async (data, callback) => {
      try {
        const { roomId, content } = data || {};

        if (!roomId || !content) {
          const errPayload = { message: 'Both roomId and message content are required.' };
          socket.emit('room_error', errPayload);
          if (callback) callback({ success: false, ...errPayload });
          return;
        }

        // Save and format message (internally verifies room access and populates safe anonymous sender)
        const safeMessage = await createMessage({
          roomId,
          user: student,
          content,
        });

        // Broadcast to all clients in the room (including sender)
        io.to(roomId).emit('new_message', safeMessage);

        // Broadcast unread update to authorized clients
        try {
          const roomDoc = await Room.findById(roomId);
          if (roomDoc) {
            const unreadPayload = {
              roomId: safeMessage.room,
              roomSlug: roomDoc.slug,
              senderId: student._id.toString(),
            };
            if (roomDoc.allowedYear) {
              io.to(`year:${roomDoc.allowedYear}`).emit('room:unread_updated', unreadPayload);
            } else {
              io.emit('room:unread_updated', unreadPayload);
            }
          }
        } catch (unreadErr) {
          logger.debug(`[Socket] Could not broadcast unread update: ${unreadErr.message}`);
        }

        logger.info(
          `[Socket] Message broadcast to room ${roomId} from ${student.anonymousName} (${student.year})`
        );

        if (callback) callback({ success: true, message: safeMessage });
      } catch (err) {
        logger.error(`[Socket] Message sending error: ${err.message}`);
        const errPayload = { message: err.message || 'Failed to send message.' };
        socket.emit('room_error', errPayload);
        if (callback) callback({ success: false, ...errPayload });
      }
    });

    /**
     * Add Reaction Event
     * Client emits: 'add_reaction', { messageId, type }
     */
    socket.on('add_reaction', async (data, callback) => {
      try {
        const { messageId, type } = data || {};

        if (!messageId || !type) {
          const errPayload = { message: 'messageId and reaction type are required.' };
          socket.emit('room_error', errPayload);
          if (callback) callback({ success: false, ...errPayload });
          return;
        }

        const safeMessage = await addReaction({
          messageId,
          user: student,
          type,
        });

        const updatePayload = {
          messageId: safeMessage.id,
          roomId: safeMessage.room,
          reactions: safeMessage.reactions,
          reactionCounts: safeMessage.reactionCounts,
        };

        // Broadcast to all clients in the room
        io.to(safeMessage.room).emit('reaction_updated', updatePayload);

        logger.info(
          `[Socket] Reaction added (${type}) on msg ${messageId} in room ${safeMessage.room} by ${student.anonymousName}`
        );

        if (callback) callback({ success: true, ...updatePayload });
      } catch (err) {
        logger.error(`[Socket] Add reaction error: ${err.message}`);
        const errPayload = { message: err.message || 'Failed to add reaction.' };
        socket.emit('room_error', errPayload);
        if (callback) callback({ success: false, ...errPayload });
      }
    });

    /**
     * Remove Reaction Event
     * Client emits: 'remove_reaction', { messageId, type }
     */
    socket.on('remove_reaction', async (data, callback) => {
      try {
        const { messageId, type } = data || {};

        if (!messageId || !type) {
          const errPayload = { message: 'messageId and reaction type are required.' };
          socket.emit('room_error', errPayload);
          if (callback) callback({ success: false, ...errPayload });
          return;
        }

        const safeMessage = await removeReaction({
          messageId,
          user: student,
          type,
        });

        const updatePayload = {
          messageId: safeMessage.id,
          roomId: safeMessage.room,
          reactions: safeMessage.reactions,
          reactionCounts: safeMessage.reactionCounts,
        };

        // Broadcast to all clients in the room
        io.to(safeMessage.room).emit('reaction_updated', updatePayload);

        logger.info(
          `[Socket] Reaction removed (${type}) on msg ${messageId} in room ${safeMessage.room} by ${student.anonymousName}`
        );

        if (callback) callback({ success: true, ...updatePayload });
      } catch (err) {
        logger.error(`[Socket] Remove reaction error: ${err.message}`);
        const errPayload = { message: err.message || 'Failed to remove reaction.' };
        socket.emit('room_error', errPayload);
        if (callback) callback({ success: false, ...errPayload });
      }
    });

    /**
     * Delete Message Event
     * Client emits: 'delete_message', { messageId }
     */
    socket.on('delete_message', async (data, callback) => {
      try {
        const { messageId } = data || {};

        if (!messageId) {
          const errPayload = { message: 'messageId is required.' };
          socket.emit('room_error', errPayload);
          if (callback) callback({ success: false, ...errPayload });
          return;
        }

        const safeMessage = await deleteMessage({
          messageId,
          user: student,
        });

        const deletePayload = {
          messageId: safeMessage.id,
          roomId: safeMessage.room,
          isDeleted: true,
          content: 'Message deleted',
          deletedAt: safeMessage.deletedAt,
        };

        // Broadcast deletion to all clients in the room
        io.to(safeMessage.room).emit('message_deleted', deletePayload);

        logger.info(
          `[Socket] Message soft-deleted: ${messageId} in room ${safeMessage.room} by ${student.anonymousName}`
        );

        if (callback) callback({ success: true, ...deletePayload });
      } catch (err) {
        logger.error(`[Socket] Delete message error: ${err.message}`);
        const errPayload = { message: err.message || 'Failed to delete message.' };
        socket.emit('room_error', errPayload);
        if (callback) callback({ success: false, ...errPayload });
      }
    });

    /**
     * Pin Message Event
     * Client emits: 'pin_message', { messageId }
     */
    socket.on('pin_message', async (data, callback) => {
      try {
        const { messageId } = data || {};
        if (!messageId) {
          const errPayload = { message: 'messageId is required to pin message.' };
          socket.emit('room_error', errPayload);
          if (callback) callback({ success: false, ...errPayload });
          return;
        }

        const safeMessage = await pinMessage({
          messageId,
          user: student,
        });

        // Broadcast to all clients in the room
        io.to(safeMessage.room).emit('message:pinned', safeMessage);

        logger.info(
          `[Socket] Message pinned: ${messageId} in room ${safeMessage.room} by admin ${student.anonymousName}`
        );

        if (callback) callback({ success: true, message: safeMessage });
      } catch (err) {
        logger.error(`[Socket] Pin message error: ${err.message}`);
        const errPayload = { message: err.message || 'Failed to pin message.' };
        socket.emit('room_error', errPayload);
        if (callback) callback({ success: false, ...errPayload });
      }
    });

    /**
     * Unpin Message Event
     * Client emits: 'unpin_message', { messageId }
     */
    socket.on('unpin_message', async (data, callback) => {
      try {
        const { messageId } = data || {};
        if (!messageId) {
          const errPayload = { message: 'messageId is required to unpin message.' };
          socket.emit('room_error', errPayload);
          if (callback) callback({ success: false, ...errPayload });
          return;
        }

        const safeMessage = await unpinMessage({
          messageId,
          user: student,
        });

        // Broadcast to all clients in the room
        io.to(safeMessage.room).emit('message:unpinned', {
          messageId: safeMessage.id,
          roomId: safeMessage.room,
        });

        logger.info(
          `[Socket] Message unpinned: ${messageId} in room ${safeMessage.room} by admin ${student.anonymousName}`
        );

        if (callback) callback({ success: true, message: safeMessage });
      } catch (err) {
        logger.error(`[Socket] Unpin message error: ${err.message}`);
        const errPayload = { message: err.message || 'Failed to unpin message.' };
        socket.emit('room_error', errPayload);
        if (callback) callback({ success: false, ...errPayload });
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(
        `[Socket] Student disconnected: ${student.anonymousName} (${reason})`
      );
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = () => {
  return ioInstance;
};

export default {
  initSocket,
  getIO,
};
