import { create } from 'zustand';
import { authAPI } from '../api/Auth.api.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('accessToken') || null,
  isAuthenticated: false,
  isLoading: false,
  isChecking: true, // true until checkAuth resolves on first load

  // Called once on app mount to validate the stored token
  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ isChecking: false, isAuthenticated: false });
      return;
    }
    try {
      const { data } = await authAPI.getMe();
      set({ user: data.data, isAuthenticated: true, isChecking: false });
    } catch {
      get().clearAuth();
    }
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.login(credentials);
      const { accessToken, user } = data.data;
      localStorage.setItem('accessToken', accessToken);
      set({ user, token: accessToken, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  },

  register: async (userData) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.register(userData);
      const { accessToken, user } = data.data;
      localStorage.setItem('accessToken', accessToken);
      set({ user, token: accessToken, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    }
  },

  clearAuth: () => {
    localStorage.removeItem('accessToken');
    set({ user: null, token: null, isAuthenticated: false, isChecking: false });
  },

  logout: async () => {
    const token = get().token;
    localStorage.removeItem('accessToken');
    set({ user: null, token: null, isAuthenticated: false });
    if (token) {
      try { await authAPI.logout(); } catch { /* ignore 401/network errors on logout */ }
    }
  },

  // Called after Google OAuth callback sets token in URL
  setTokenFromGoogle: (token, user) => {
    localStorage.setItem('accessToken', token);
    set({ user, token, isAuthenticated: true });
  },
}));
