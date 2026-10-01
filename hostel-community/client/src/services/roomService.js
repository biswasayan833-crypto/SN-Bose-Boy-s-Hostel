import api from './api';

export const getRooms = async () => {
  const response = await api.get('/rooms');
  return response.data;
};

export const getRoom = async (slug) => {
  const response = await api.get(`/rooms/${slug}`);
  return response.data;
};

export const getMessages = async (roomId, { page = 1, limit = 50 } = {}) => {
  const response = await api.get(`/rooms/${roomId}/messages`, {
    params: { page, limit },
  });
  return response.data;
};

export const sendMessage = async (roomId, content) => {
  const response = await api.post(`/rooms/${roomId}/messages`, { content });
  return response.data;
};

export default {
  getRooms,
  getRoom,
  getMessages,
  sendMessage,
};
