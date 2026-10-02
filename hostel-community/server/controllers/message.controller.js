import fs from 'fs';
import {
  addReaction,
  removeReaction,
  deleteMessage,
  pinMessage,
  unpinMessage,
  createMessageWithAttachment,
} from '../services/message.service.js';
import { getRoomById } from '../services/room.service.js';
import { getAttachmentPath } from '../services/storage.service.js';
import Message from '../models/Message.js';
import Room from '../models/Room.js';
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

/**
 * POST /api/messages/:roomId/attachments (and POST /api/rooms/:roomId/attachments)
 * Upload file attachment and create message in an authorized room.
 */
export const postAttachmentMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const file = req.file;

    if (!file) {
      return errorResponse(res, 'No file attachment provided in request.', null, 400);
    }

    const message = await createMessageWithAttachment({
      roomId,
      user: req.user,
      content,
      file,
    });

    // Broadcast new message with attachment to all participants in the room
    safeBroadcast(message.room, 'new_message', message);

    // Broadcast unread notification to authorized clients
    try {
      const io = getIO();
      if (io) {
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
    } catch (unreadErr) {
      // Non-blocking
    }

    return successResponse(res, 'Attachment uploaded and message sent successfully', { message }, 201);
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to upload attachment.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * GET /api/messages/:messageId/attachment
 * Securely stream attachment file to authorized room members.
 */
export const getAttachment = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      return errorResponse(res, 'Message not found.', null, 404);
    }

    // Deleted messages no longer expose their attachments
    if (message.isDeleted) {
      return errorResponse(
        res,
        'Attachment is no longer available because this message was deleted.',
        null,
        404
      );
    }

    if (!message.attachment || !message.attachment.storedName) {
      return errorResponse(res, 'This message does not contain any attachment.', null, 404);
    }

    // Verify user authorization for this room
    await getRoomById(message.room, req.user);

    // Get validated safe path
    const filePath = getAttachmentPath(message.attachment.storedName);

    // Set strict security headers
    res.setHeader('Content-Type', message.attachment.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', message.attachment.size);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");

    const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${encodeURIComponent(message.attachment.originalName)}"`
    );

    // Stream file
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      if (!res.headersSent) {
        return errorResponse(res, 'Error reading attachment file.', null, 500);
      }
    });
    return stream.pipe(res);
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to retrieve attachment.',
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
  postAttachmentMessage,
  getAttachment,
};
