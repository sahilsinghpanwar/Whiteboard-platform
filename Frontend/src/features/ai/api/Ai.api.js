/**
 * AI API
 * Maps to backend /api/v1/boards/:boardId/ai routes.
 */

import api from "@/shared/api/axios.js";

export const aiApi = {
  brainstorm: (boardId, topic) =>
    api.post(`/boards/${boardId}/ai/brainstorm`, { topic }),
  generateDiagram: (boardId, description) =>
    api.post(`/boards/${boardId}/ai/diagram`, { description }),
  summarize: (boardId) =>
    api.get(`/boards/${boardId}/ai/summary`),
  improve: (boardId, focusArea) =>
    api.post(`/boards/${boardId}/ai/improve`, { focusArea }),
};