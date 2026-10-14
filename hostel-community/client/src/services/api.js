import axios from 'axios';

// Base API URL configuration:
// Uses import.meta.env.VITE_API_URL with fallback to http://localhost:5000 for local development.
const rawApiUrl = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000'
).replace(/\/$/, '');

// Ensure backend endpoints routed via /api are correctly targeted
const baseURL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const api = axios.create({
  baseURL,
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
