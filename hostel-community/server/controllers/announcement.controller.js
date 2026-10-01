import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../services/announcement.service.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

/**
 * GET /api/announcements
 * Retrieve active announcements for authorized rooms.
 */
export const getAnnouncementsHandler = async (req, res) => {
  try {
    const { roomId } = req.query;
    const announcements = await getAnnouncements(req.user, { roomId });
    return successResponse(res, 'Announcements retrieved successfully.', { announcements });
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to retrieve announcements.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * GET /api/announcements/:announcementId
 * Retrieve specific announcement.
 */
export const getAnnouncementByIdHandler = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const announcement = await getAnnouncementById(announcementId, req.user);
    return successResponse(res, 'Announcement retrieved successfully.', { announcement });
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to retrieve announcement.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * POST /api/announcements
 * Admin creates a new announcement.
 */
export const createAnnouncementHandler = async (req, res) => {
  try {
    const { title, content, targetRoom, priority, isPinned, expiresAt } = req.body;
    const announcement = await createAnnouncement(req.user, {
      title,
      content,
      targetRoom,
      priority,
      isPinned,
      expiresAt,
    });
    return successResponse(res, 'Announcement created successfully.', { announcement }, 201);
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to create announcement.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * PATCH /api/announcements/:announcementId
 * Admin updates an announcement.
 */
export const updateAnnouncementHandler = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const announcement = await updateAnnouncement(req.user, announcementId, req.body);
    return successResponse(res, 'Announcement updated successfully.', { announcement });
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to update announcement.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * DELETE /api/announcements/:announcementId
 * Admin deletes an announcement.
 */
export const deleteAnnouncementHandler = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const result = await deleteAnnouncement(req.user, announcementId);
    return successResponse(res, result.message, null);
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to delete announcement.',
      null,
      error.statusCode || 500
    );
  }
};
