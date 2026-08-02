import axios from "axios";
import { API_BASE_URL } from "../constants/index.js";
import { useAuthStore } from "../../features/auth/store/useAuthStore.js";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, 
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/logout')) {
      useAuthStore.getState().clearAuth();
    }
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";
    const customErr = new Error(message);
    customErr.response = error.response;
    return Promise.reject(customErr);
  }
);

export default api;