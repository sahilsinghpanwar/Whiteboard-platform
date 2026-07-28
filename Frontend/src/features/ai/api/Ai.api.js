import api from "@/shared/api/axios.js";

export const aiApi = {
  agent: (boardId, { prompt, selectedElementIds = [], conversationHistory = [] }) =>
    api.post(`/boards/${boardId}/ai/agent`, { prompt, selectedElementIds, conversationHistory }),
  brainstorm: (boardId, topic) =>
    api.post(`/boards/${boardId}/ai/brainstorm`, { topic }),
  generateDiagram: (boardId, description) =>
    api.post(`/boards/${boardId}/ai/diagram`, { description }),
  summarize: (boardId) =>
    api.post(`/boards/${boardId}/ai/summary`),
  improve: (boardId, selectedElements, instruction) =>
    api.post(`/boards/${boardId}/ai/improve`, { selectedElements, instruction }),
};