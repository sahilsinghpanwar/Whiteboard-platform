import api from "@/shared/api/axios.js";

export const boardApi = {
  // Board CRUD
  getAll: () => api.get("/boards"),
  getById: (boardId) => api.get(`/boards/${boardId}`),
  create: (data) => api.post("/boards", data),
  update: (boardId, data) => api.put(`/boards/${boardId}`, data),
  delete: (boardId) => api.delete(`/boards/${boardId}`),

  // Members
  addMember: (boardId, data) => api.post(`/boards/${boardId}/members`, data),
  updateMemberRole: (boardId, memberId, data) =>
    api.patch(`/boards/${boardId}/members/${memberId}`, data),
  removeMember: (boardId, memberId) =>
    api.delete(`/boards/${boardId}/members/${memberId}`),
  acceptInvitation: (boardId) =>
    api.post(`/boards/${boardId}/members/accept`),
  declineInvitation: (boardId) =>
    api.post(`/boards/${boardId}/members/decline`),

  // Canvas
  saveCanvas: (boardId, elements) =>
    api.put(`/boards/${boardId}/canvas`, { elements }),

  // Export
  exportJSON: (boardId) =>
    api.get(`/boards/${boardId}/export/json`, { responseType: "blob" }),
  exportCSV: (boardId) =>
    api.get(`/boards/${boardId}/export/csv`, { responseType: "blob" }),
};