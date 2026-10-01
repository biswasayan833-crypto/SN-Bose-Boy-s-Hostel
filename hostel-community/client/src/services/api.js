import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('snbose_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error handling and 401 token invalidation
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Network request failed';

    // If unauthorized and token was present, clear it unless it was a login attempt
    if (status === 401 && !error.config.url?.includes('/auth/login')) {
      localStorage.removeItem('snbose_auth_token');
    }

    const customError = {
      message,
      status,
      data: error.response?.data,
    };
    return Promise.reject(customError);
  }
);

export default api;
