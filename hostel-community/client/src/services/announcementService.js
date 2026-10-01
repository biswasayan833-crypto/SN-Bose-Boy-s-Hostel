import api from './api';

export const getAnnouncements = async (params = {}) => {
  const response = await api.get('/announcements', { params });
  return response.data;
};

export const getAnnouncementById = async (announcementId) => {
  const response = await api.get(`/announcements/${announcementId}`);
  return response.data;
};

export const createAnnouncement = async (payload) => {
  const response = await api.post('/announcements', payload);
  return response.data;
};

export const updateAnnouncement = async (announcementId, payload) => {
  const response = await api.patch(`/announcements/${announcementId}`, payload);
  return response.data;
};

export const deleteAnnouncement = async (announcementId) => {
  const response = await api.delete(`/announcements/${announcementId}`);
  return response.data;
};

export default {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
