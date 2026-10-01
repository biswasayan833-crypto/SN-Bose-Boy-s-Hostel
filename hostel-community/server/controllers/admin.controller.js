import { getAdminReports, updateReport } from '../services/report.service.js';
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
    // Socket might not be initialized in test environments
  }
};

/**
 * GET /api/admin/reports
 * Fetch all reports for administrators
 */
export const getReports = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const result = await getAdminReports({ status, page, limit });
    return successResponse(res, 'Reports retrieved successfully.', result);
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to retrieve reports.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * PATCH /api/admin/reports/:reportId
 * Update report status and perform moderation actions (e.g. remove message)
 */
export const patchReport = async (req, res) => {
  try {
    const { status, notes, action } = req.body;
    const result = await updateReport({
      reportId: req.params.reportId,
      status,
      notes,
      action,
      adminUser: req.user,
    });

    // If message was moderated / deleted, broadcast real-time update to the room
    if (result.messageModerated && result.deletedMessage) {
      safeBroadcast(result.deletedMessage.room, 'message_deleted', {
        messageId: result.deletedMessage.id,
        roomId: result.deletedMessage.room,
        isDeleted: true,
        content: 'Message deleted',
        deletedAt: result.deletedMessage.deletedAt,
      });
    }

    return successResponse(res, 'Report updated successfully.', result);
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to update report.',
      null,
      error.statusCode || 500
    );
  }
};

export default {
  getReports,
  patchReport,
};
