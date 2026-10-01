import { getAccessibleRooms, getRoomBySlug } from '../services/room.service.js';
import { getRoomMessages, createMessage } from '../services/message.service.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

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
    return successResponse(res, 'Message sent successfully', { message }, 201);
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to send message.', null, error.statusCode || 500);
  }
};

export default {
  getRooms,
  getRoom,
  getMessages,
  sendMessage,
};
