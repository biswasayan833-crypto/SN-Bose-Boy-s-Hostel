import {
  addReaction,
  removeReaction,
  deleteMessage,
  pinMessage,
  unpinMessage,
} from '../services/message.service.js';
import { createReport } from '../services/report.service.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import { getIO } from '../socket/chat.socket.js';

/**
 * Safely broadcast socket event to room without crashing if socket is not ready.
 */
const safeBroadcast = (roomId, event, payload) => {
  try {
    const io = getIO();
    if (io && roomId) {
      io.to(roomId).emit(event, payload);
    }
  } catch (err) {
    // Socket might not be initialized in some test environments
  }
};

/**
 * POST /api/messages/:messageId/reactions
 * Add reaction to a message
 */
export const postReaction = async (req, res) => {
  try {
    const { type } = req.body;
    if (!type) {
      return errorResponse(res, 'Reaction type is required in request body.', null, 400);
    }

    const updatedMessage = await addReaction({
      messageId: req.params.messageId,
      user: req.user,
      type,
    });

    safeBroadcast(updatedMessage.room, 'reaction_updated', {
      messageId: updatedMessage.id,
      roomId: updatedMessage.room,
      reactions: updatedMessage.reactions,
      reactionCounts: updatedMessage.reactionCounts,
    });

    return successResponse(res, 'Reaction added successfully', { message: updatedMessage });
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to add reaction.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * DELETE /api/messages/:messageId/reactions/:type
 * Remove reaction from a message
 */
export const deleteReaction = async (req, res) => {
  try {
    const { type } = req.params;
    const updatedMessage = await removeReaction({
      messageId: req.params.messageId,
      user: req.user,
      type,
    });

    safeBroadcast(updatedMessage.room, 'reaction_updated', {
      messageId: updatedMessage.id,
      roomId: updatedMessage.room,
      reactions: updatedMessage.reactions,
      reactionCounts: updatedMessage.reactionCounts,
    });

    return successResponse(res, 'Reaction removed successfully', { message: updatedMessage });
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to remove reaction.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * DELETE /api/messages/:messageId
 * Soft-delete own message
 */
export const deleteUserMessage = async (req, res) => {
  try {
    const deletedMessage = await deleteMessage({
      messageId: req.params.messageId,
      user: req.user,
    });

    safeBroadcast(deletedMessage.room, 'message_deleted', {
      messageId: deletedMessage.id,
      roomId: deletedMessage.room,
      isDeleted: true,
      content: 'Message deleted',
      deletedAt: deletedMessage.deletedAt,
    });

    return successResponse(res, 'Message deleted successfully', { message: deletedMessage });
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to delete message.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * POST /api/messages/:messageId/report
 * Report an inappropriate message
 */
export const reportUserMessage = async (req, res) => {
  try {
    const { reason, notes } = req.body;
    const report = await createReport({
      messageId: req.params.messageId,
      user: req.user,
      reason,
      notes,
    });

    return successResponse(
      res,
      'Message reported successfully. Our moderation team will review it.',
      { report },
      201
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to report message.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * PATCH /api/messages/:messageId/pin
 * Admin: Pin message
 */
export const pinUserMessage = async (req, res) => {
  try {
    const pinnedMessage = await pinMessage({
      messageId: req.params.messageId,
      user: req.user,
    });
    return successResponse(res, 'Message pinned successfully', { message: pinnedMessage });
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to pin message.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * PATCH /api/messages/:messageId/unpin
 * Admin: Unpin message
 */
export const unpinUserMessage = async (req, res) => {
  try {
    const unpinnedMessage = await unpinMessage({
      messageId: req.params.messageId,
      user: req.user,
    });
    return successResponse(res, 'Message unpinned successfully', { message: unpinnedMessage });
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to unpin message.',
      null,
      error.statusCode || 500
    );
  }
};

export default {
  postReaction,
  deleteReaction,
  deleteUserMessage,
  reportUserMessage,
  pinUserMessage,
  unpinUserMessage,
};
