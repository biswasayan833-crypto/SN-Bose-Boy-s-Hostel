import api from './api';

export const getNotifications = async ({ page = 1, limit = 20, unreadOnly = false } = {}) => {
  const response = await api.get('/notifications', {
    params: { page, limit, unreadOnly },
  });
  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

export const markNotificationRead = async (notificationId) => {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

export default {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
};
