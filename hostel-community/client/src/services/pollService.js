import api from './api';

export const getPolls = async (params = {}) => {
  const response = await api.get('/polls', { params });
  return response.data;
};

export const getPollById = async (pollId) => {
  const response = await api.get(`/polls/${pollId}`);
  return response.data;
};

export const createPoll = async (payload) => {
  const response = await api.post('/polls', payload);
  return response.data;
};

export const votePoll = async (pollId, optionId) => {
  const response = await api.post(`/polls/${pollId}/vote`, { optionId });
  return response.data;
};

export const retractVote = async (pollId) => {
  const response = await api.delete(`/polls/${pollId}/vote`);
  return response.data;
};

export const closePoll = async (pollId) => {
  const response = await api.patch(`/polls/${pollId}/close`);
  return response.data;
};

export const deletePoll = async (pollId) => {
  const response = await api.delete(`/polls/${pollId}`);
  return response.data;
};

export default {
  getPolls,
  getPollById,
  createPoll,
  votePoll,
  retractVote,
  closePoll,
  deletePoll,
};
