import api from './api';

export const register = async ({ fullName, email, password, year }) => {
  const response = await api.post('/auth/register', {
    fullName,
    email,
    password,
    year,
  });
  return response.data;
};

export const login = async ({ email, password }) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const logout = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error) {
    // Gracefully handle network disconnect during logout
    return { success: true };
  }
};

export default {
  register,
  login,
  getMe,
  logout,
};
