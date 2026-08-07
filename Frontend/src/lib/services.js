import api, { unwrap, API_BASE } from "./api";

const getGoogleUrl = () => {
  // Strip /api/v1 to get the root URL
  const base = API_BASE.replace(/\/api\/v1$/, "");
  return `${base}/api/v1/auth/google`;
};

// AUTH
export const authApi = {
  register: (payload) => api.post("/auth/register", payload).then(unwrap),
  login: (payload) => api.post("/auth/login", payload).then(unwrap),
  me: () => api.get("/auth/me").then(unwrap),
  refresh: () => api.post("/auth/refresh").then(unwrap),
  logout: () => api.post("/auth/logout").then(unwrap),
  googleUrl: () => getGoogleUrl(),
};

// USERS
export const userApi = {
  getMe: () => api.get("/users/me").then(unwrap),
  updateProfile: (payload) => api.put("/users/me", payload).then(unwrap),
  changePassword: (payload) => api.post("/users/me/change-password", payload).then(unwrap),
  deactivate: (password) => api.delete("/users/me", { data: { password } }).then(unwrap),
  search: (q) => api.get("/users/search", { params: { q } }).then(unwrap),
  getById: (id) => api.get(`/users/${id}`).then(unwrap),
};

// BOARDS
export const boardApi = {
  list: () => api.get("/boards").then(unwrap),
  create: (payload) => api.post("/boards", payload).then(unwrap),
  get: (id) => api.get(`/boards/${id}`).then(unwrap),
  update: (id, payload) => api.put(`/boards/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/boards/${id}`).then(unwrap),
  invite: (id, payload) => api.post(`/boards/${id}/members`, payload).then(unwrap),
  accept: (id) => api.post(`/boards/${id}/members/accept`).then(unwrap),
  decline: (id) => api.post(`/boards/${id}/members/decline`).then(unwrap),
  updateRole: (id, memberId, role) => api.patch(`/boards/${id}/members/${memberId}`, { role }).then(unwrap),
  removeMember: (id, memberId) => api.delete(`/boards/${id}/members/${memberId}`).then(unwrap),
  saveCanvas: (id, canvas) => api.put(`/boards/${id}/canvas`, { canvas }).then(unwrap),
  upsertElement: (id, element) => api.post(`/boards/${id}/canvas/elements`, { element }).then(unwrap),
  deleteElements: (id, elementIds) => api.delete(`/boards/${id}/canvas/elements`, { data: { elementIds } }).then(unwrap),
};

// CHAT
export const chatApi = {
  history: (boardId) => api.get(`/boards/${boardId}/chat`).then(unwrap),
  remove: (boardId, messageId) => api.delete(`/boards/${boardId}/chat/${messageId}`).then(unwrap),
};

// AI
export const aiApi = {
  agent: (boardId, payload) => api.post(`/boards/${boardId}/ai/agent`, payload).then(unwrap),
  vision: (boardId, payload) => api.post(`/boards/${boardId}/ai/vision`, payload).then(unwrap),
  brainstorm: (boardId, topic) => api.post(`/boards/${boardId}/ai/brainstorm`, { topic }).then(unwrap),
  diagram: (boardId, description) => api.post(`/boards/${boardId}/ai/diagram`, { description }).then(unwrap),
  summary: (boardId) => api.get(`/boards/${boardId}/ai/summary`).then(unwrap),
  improve: (boardId, payload) => api.post(`/boards/${boardId}/ai/improve`, payload).then(unwrap),
};

// EXPORT
export const exportApi = {
  run: (boardId, payload) => api.post(`/boards/${boardId}/export`, payload).then(unwrap),
};

// UPLOAD
export const uploadApi = {
  boardImage: (file, boardId) => {
    const form = new FormData();
    form.append("image", file);
    const url = boardId ? `/upload/board-image/${boardId}` : `/upload/board-asset`;
    return api.post(url, form, { headers: { "Content-Type": "multipart/form-data" } }).then(unwrap);
  },
  avatar: (file) => {
    const form = new FormData();
    form.append("avatar", file);
    return api.post("/upload/avatar", form, { headers: { "Content-Type": "multipart/form-data" } }).then(unwrap);
  },
};
