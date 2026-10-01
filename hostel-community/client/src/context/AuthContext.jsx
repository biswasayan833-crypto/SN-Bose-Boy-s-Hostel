import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const TOKEN_KEY = 'snbose_auth_token';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify authentication on app boot
  const initializeAuth = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authService.getMe();
      if (res?.data?.user) {
        setUser(res.data.user);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      }
    } catch (err) {
      console.warn('[Auth] Token verification failed:', err.message);
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Login handler
  const login = async (credentials) => {
    const res = await authService.login(credentials);
    if (res?.data?.token && res?.data?.user) {
      localStorage.setItem(TOKEN_KEY, res.data.token);
      setUser(res.data.user);
    }
    return res;
  };

  // Register handler
  const register = async (studentData) => {
    const res = await authService.register(studentData);
    if (res?.data?.token && res?.data?.user) {
      localStorage.setItem(TOKEN_KEY, res.data.token);
      setUser(res.data.user);
    }
    return res;
  };

  // Logout handler
  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }
  };

  // Update user data handler (for immediate profile identity updates)
  const updateUser = (updatedData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : updatedData));
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    checkAuth: initializeAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
