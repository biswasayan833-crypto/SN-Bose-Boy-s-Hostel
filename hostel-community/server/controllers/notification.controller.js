import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notification.service.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

/**
 * GET /api/notifications
 * Get paginated notifications for the authenticated user
 */
export const getNotifications = async (req, res) => {
  try {
    const { page, limit, unreadOnly } = req.query;
    const result = await getUserNotifications(req.user._id, {
      page,
      limit,
      unreadOnly: unreadOnly === 'true',
    });
    return successResponse(res, 'Notifications retrieved successfully', result);
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to retrieve notifications.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for the authenticated user
 */
export const getUnreadCount = async (req, res) => {
  try {
    const result = await getUnreadNotificationCount(req.user._id);
    return successResponse(res, 'Unread notification count retrieved successfully', result);
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to retrieve unread notification count.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * PATCH /api/notifications/:notificationId/read
 * Mark a single notification as read
 */
export const markRead = async (req, res) => {
  try {
    const notification = await markNotificationRead({
      notificationId: req.params.notificationId,
      userId: req.user._id,
    });
    return successResponse(res, 'Notification marked as read', { notification });
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to mark notification as read.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications belonging to the authenticated user as read
 */
export const markAllRead = async (req, res) => {
  try {
    const result = await markAllNotificationsRead(req.user._id);
    return successResponse(res, 'All notifications marked as read', result);
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to mark all notifications as read.',
      null,
      error.statusCode || 500
    );
  }
};

export default {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
};
