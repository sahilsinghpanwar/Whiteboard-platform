/**
 * Chat API
 */

import api from "@/shared/api/axios.js";

export const chatApi = {
  getMessages: (boardId, params) =>
    api.get(`/boards/${boardId}/chat`, { params }),
  deleteMessage: (boardId, messageId) =>
    api.delete(`/boards/${boardId}/chat/${messageId}`),
};