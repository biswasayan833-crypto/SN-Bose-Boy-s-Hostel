import api from './api';

export const getMyProfile = async () => {
  const response = await api.get('/profile/me');
  return response.data;
};

export const updateMyProfile = async (payload) => {
  const response = await api.patch('/profile/me', payload);
  return response.data;
};

export const changeMyPassword = async (payload) => {
  const response = await api.patch('/profile/me/password', payload);
  return response.data;
};

export default {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
};
