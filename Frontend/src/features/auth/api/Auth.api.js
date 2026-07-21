/**
 * Auth API
 * Maps 1:1 to backend /api/v1/auth routes.
 */

import api from "../../../shared/api/axios.js";

export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
};

export const authAPI = authApi;