/**
 * Axios Instance
 *
 * Single configured HTTP client used by all API modules.
 * Intercepts requests to attach the access token.
 * Intercepts 401 responses to clear stale auth state.
 */

import axios from "axios";
import { API_BASE_URL } from "../constants/index.js";
import { useAuthStore } from "../../features/auth/store/useAuthStore.js";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // sends the HTTP-only refresh token cookie
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor ─────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  // Always prefer fresh token from localStorage to prevent stale in-memory tokens
  const token = localStorage.getItem('accessToken') || useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor ────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 Unauthorized occurs on a non-logout route, clear local auth state
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/logout')) {
      useAuthStore.getState().clearAuth();
    }
    // Normalize error: always throw the server's message if available
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export default api;