import {
  getAccessibleRooms,
  getRoomBySlug,
  getUnreadCountsForUser,
  markRoomAsRead,
} from '../services/room.service.js';
import Room from '../models/Room.js';
import { getRoomMessages, createMessage, getPinnedMessages } from '../services/message.service.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import { getIO } from '../socket/chat.socket.js';

/**
 * GET /api/rooms
 * Fetch only the rooms accessible to the authenticated student
 */
export const getRooms = async (req, res) => {
  try {
    const rooms = await getAccessibleRooms(req.user);
    return successResponse(res, 'Accessible rooms fetched successfully', { rooms });
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to fetch rooms.', null, error.statusCode || 500);
  }
};

/**
 * GET /api/rooms/unread
 * Fetch unread message counts for all accessible rooms
 */
export const getUnreadRooms = async (req, res) => {
  try {
    const unreadData = await getUnreadCountsForUser(req.user);
    return successResponse(res, 'Unread message counts fetched successfully', unreadData);
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to fetch unread message counts.', null, error.statusCode || 500);
  }
};

/**
 * GET /api/rooms/:slug
 * Fetch specific room details by slug with authorization check
 */
export const getRoom = async (req, res) => {
  try {
    const room = await getRoomBySlug(req.params.slug, req.user);
    return successResponse(res, 'Room details fetched successfully', { room });
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to fetch room.', null, error.statusCode || 500);
  }
};

/**
 * PATCH /api/rooms/:roomId/read
 * Mark a room as read and reset its unread count
 */
export const markRoomRead = async (req, res) => {
  try {
    const result = await markRoomAsRead({
      roomIdOrSlug: req.params.roomId,
      user: req.user,
    });
    return successResponse(res, 'Room marked as read', result);
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to mark room as read.', null, error.statusCode || 500);
  }
};

/**
 * GET /api/rooms/:roomId/messages
 * Fetch paginated messages for a room with authorization check
 */
export const getMessages = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await getRoomMessages(req.params.roomId, req.user, { page, limit });
    return successResponse(res, 'Messages fetched successfully', result);
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to fetch messages.', null, error.statusCode || 500);
  }
};

/**
 * POST /api/rooms/:roomId/messages
 * Post a new message to a room with validation and authorization checks
 */
export const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const message = await createMessage({
      roomId: req.params.roomId,
      user: req.user,
      content,
    });

    try {
      const io = getIO();
      if (io) {
        io.to(message.room).emit('new_message', message);
        const roomDoc = await Room.findById(message.room);
        if (roomDoc) {
          const unreadPayload = {
            roomId: message.room,
            roomSlug: roomDoc.slug,
            senderId: req.user._id.toString(),
          };
          if (roomDoc.allowedYear) {
            io.to(`year:${roomDoc.allowedYear}`).emit('room:unread_updated', unreadPayload);
          } else {
            io.emit('room:unread_updated', unreadPayload);
          }
        }
      }
    } catch (socketErr) {
      // Ignore socket broadcast errors in test/disconnected environments
    }

    return successResponse(res, 'Message sent successfully', { message }, 201);
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to send message.', null, error.statusCode || 500);
  }
};

/**
 * GET /api/rooms/:roomId/pinned
 * Retrieve pinned messages for an authorized room
 */
export const getPinned = async (req, res) => {
  try {
    const { roomId } = req.params;
    const pinnedMessages = await getPinnedMessages(roomId, req.user);
    return successResponse(res, 'Pinned messages retrieved successfully', { pinnedMessages });
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to retrieve pinned messages.',
      null,
      error.statusCode || 500
    );
  }
};

export default {
  getRooms,
  getUnreadRooms,
  getRoom,
  markRoomRead,
  getMessages,
  sendMessage,
  getPinned,
};
