import axios from "axios";

const rawUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:5000";

const normalizedUrl = rawUrl.replace(/\/+$/, "");

export const API_BASE = normalizedUrl.endsWith("/api/v1") ? normalizedUrl : `${normalizedUrl}/api/v1`;

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

let inMemoryToken = null;

export const setAccessToken = (token) => {
  inMemoryToken = token;
};

export const getAccessToken = () => inMemoryToken;

api.interceptors.request.use((config) => {
  if (inMemoryToken) {
    config.headers.Authorization = `Bearer ${inMemoryToken}`;
  }
  return config;
});

let refreshTokenPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err?.config;
    const status = err?.response?.status;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      if (!refreshTokenPromise) {
        refreshTokenPromise = api
          .post("/auth/refresh")
          .then((res) => {
            const data = unwrap(res);
            const token = data?.accessToken || res?.data?.accessToken;
            if (token) {
              setAccessToken(token);
              return token;
            }
            throw new Error("No token returned from refresh");
          })
          .catch((refreshErr) => {
            setAccessToken(null);
            throw refreshErr;
          })
          .finally(() => {
            refreshTokenPromise = null;
          });
      }

      try {
        const token = await refreshTokenPromise;
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

export const unwrap = (res) => res?.data?.data ?? res?.data;

export default api;
