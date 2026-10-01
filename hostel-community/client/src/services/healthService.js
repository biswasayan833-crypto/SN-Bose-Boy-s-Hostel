import api from './api';

export const getHealthStatus = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default {
  getHealthStatus,
};
