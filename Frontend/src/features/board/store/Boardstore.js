/**
 * Board Store
 *
 * Holds the active board session state:
 * - Current board metadata
 * - Canvas elements (source of truth for rendering)
 * - Undo / Redo history stack
 * - Active tool selection
 * - Active users (multiplayer presence)
 * - Canvas viewport
 */

import { create } from "zustand";
import { useAuthStore } from "@/features/auth/store/useAuthStore.js";

export const CANVAS_TOOLS = {
  SELECT: "select",
  HAND: "hand",
  SHAPE: "shape",
  TEXT: "text",
  DRAW: "draw",
  ERASER: "eraser",
  STICKY: "sticky",
  IMAGE: "image",
  AI: "ai",
};

export const useBoardStore = create((set, get) => ({
  // Board
  board: null,
  role: null,

  // Canvas & History
  elements: [],
  selectedElementIds: [],
  history: [[]],
  historyIndex: 0,
  activeTool: CANVAS_TOOLS.SELECT,
  activeShape: "rect",
  viewport: { x: 0, y: 0, zoom: 1 },

  // Presence
  activeUsers: [],
  cursors: {},

  // UI state
  showChat: false,
  showAI: false,
  showMembers: false,

  // ─── Board ─────────────────────────────────────────────────────────────
  setBoard: (board, role) => {
    if (role !== undefined) {
      set({ board, role });
      return;
    }
    if (!board) {
      set({ board: null, role: null });
      return;
    }
    const currentUser = useAuthStore.getState().user;
    const currentUserId = currentUser?._id?.toString() || currentUser?.id?.toString();
    const ownerId = board.owner?._id?.toString() || board.owner?.toString();
    let calculatedRole = "viewer";
    if (ownerId && currentUserId && ownerId === currentUserId) {
      calculatedRole = "owner";
    } else if (board.members) {
      const member = board.members.find((m) => {
        const mId = m.userId?._id?.toString() || m.userId?.toString() || m.userId;
        return String(mId) === String(currentUserId);
      });
      if (member) calculatedRole = member.role;
    }
    set({ board, role: calculatedRole });
  },
  clearBoard: () =>
    set({
      board: null, role: null, elements: [], history: [[]], historyIndex: 0,
      activeUsers: [], cursors: {}, selectedElementIds: [],
    }),

  // ─── Elements ──────────────────────────────────────────────────────────
  setElements: (elements) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(elements);
    set({ elements, history: newHistory, historyIndex: newHistory.length - 1 });
  },

  upsertElement: (element) => {
    const { elements, history, historyIndex } = get();
    const exists = elements.some((el) => el.id === element.id);
    const newElements = exists
      ? elements.map((el) => (el.id === element.id ? element : el))
      : [...elements, element];

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    set({ elements: newElements, history: newHistory, historyIndex: newHistory.length - 1 });
  },

  deleteElements: (elementIds) => {
    const { elements, selectedElementIds, history, historyIndex } = get();
    const newElements = elements.filter((el) => !elementIds.includes(el.id));
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    set({
      elements: newElements,
      selectedElementIds: selectedElementIds.filter((id) => !elementIds.includes(id)),
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  // ─── Remote Socket Updates (Does not break local undo history) ───────────
  applyRemoteElementUpdate: (element) =>
    set((state) => {
      const exists = state.elements.some((el) => el.id === element.id);
      return {
        elements: exists
          ? state.elements.map((el) => (el.id === element.id ? element : el))
          : [...state.elements, element],
      };
    }),

  applyRemoteElementDelete: (elementIds) =>
    set((state) => ({
      elements: state.elements.filter((el) => !elementIds.includes(el.id)),
      selectedElementIds: state.selectedElementIds.filter((id) => !elementIds.includes(id)),
    })),

  applyRemoteCanvasSave: (elements) => set({ elements }),

  // ─── Undo / Redo ───────────────────────────────────────────────────────
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      set({ elements: history[prevIndex], historyIndex: prevIndex });
      return history[prevIndex];
    }
    return null;
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      set({ elements: history[nextIndex], historyIndex: nextIndex });
      return history[nextIndex];
    }
    return null;
  },

  // ─── Selection ─────────────────────────────────────────────────────────
  setSelectedElementIds: (ids) => set({ selectedElementIds: ids }),
  clearSelection: () => set({ selectedElementIds: [] }),

  // ─── Tool ──────────────────────────────────────────────────────────────
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveShape: (shape) => set({ activeShape: shape }),

  // ─── Presence ──────────────────────────────────────────────────────────
  setActiveUsers: (users) => set({ activeUsers: users }),

  addActiveUser: (user) =>
    set((state) => ({
      activeUsers: state.activeUsers.some((u) => u.userId === user.userId)
        ? state.activeUsers
        : [...state.activeUsers, user],
    })),

  removeActiveUser: (userId) =>
    set((state) => ({
      activeUsers: state.activeUsers.filter((u) => u.userId !== userId),
      cursors: Object.fromEntries(
        Object.entries(state.cursors).filter(([id]) => id !== userId)
      ),
    })),

  updateCursor: (userId, data) =>
    set((state) => ({
      cursors: { ...state.cursors, [userId]: data },
    })),

  // ─── Viewport ──────────────────────────────────────────────────────────
  setViewport: (viewport) => set({ viewport }),

  // ─── UI Panels ─────────────────────────────────────────────────────────
  toggleChat: () => set((s) => ({ showChat: !s.showChat, showAI: false, showMembers: false })),
  toggleAI: () => set((s) => ({ showAI: !s.showAI, showChat: false, showMembers: false })),
  toggleMembers: () => set((s) => ({ showMembers: !s.showMembers, showChat: false, showAI: false })),
  closeAllPanels: () => set({ showChat: false, showAI: false, showMembers: false }),
}));