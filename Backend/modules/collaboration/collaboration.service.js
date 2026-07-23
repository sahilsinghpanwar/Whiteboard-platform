import { boardService } from "../board/index.js";
import { logger } from "../../core/logger/logger.js";

const rooms = new Map();

// ─── Room Registry ─────────────────────────────────────────────────────────

export const addToRoom = (boardId, socketId, user) => {
  if (!rooms.has(boardId)) rooms.set(boardId, new Map());
  const userObj = {
    userId: (user._id || user.userId)?.toString(),
    fullName: user.fullName || "Collaborator",
    profileImageUrl: user.profileImageUrl || "",
    email: user.email || "",
    socketId,
    cursor: null,
  };
  rooms.get(boardId).set(socketId, userObj);
};

export const removeFromRoom = (boardId, socketId) => {
  const room = rooms.get(boardId);
  if (!room) return;
  room.delete(socketId);
  if (room.size === 0) rooms.delete(boardId);
};

export const getRoomUsers = (boardId) => {
  const room = rooms.get(boardId);
  if (!room) return [];
  return Array.from(room.values());
};

export const updateCursor = (boardId, socketId, cursor) => {
  const room = rooms.get(boardId);
  if (!room || !room.has(socketId)) return;
  const user = room.get(socketId);
  room.set(socketId, { ...user, cursor });
};

export const getUserFromRoom = (boardId, socketId) => rooms.get(boardId)?.get(socketId) ?? null;

export const validateBoardAccess = async (boardId, userId) => {
  try {
    return await boardService.getBoardById(boardId, userId);
  } catch {
    throw new Error("Access denied or board not found");
  }
};

export const canUserEdit = async (boardId, userId) => {
  try {
    const board = await boardService.getBoardById(boardId, userId);
    const toIdStr = (v) => {
      if (!v) return '';
      if (typeof v === 'string') return v;
      
      let idVal = v;
      if (v._id) {
        idVal = v._id;
      } else if (v.id && typeof v.id === 'string') {
        idVal = v.id;
      } else if (v.userId) {
        idVal = v.userId;
      } else if (v.user) {
        idVal = v.user;
      }

      if (typeof idVal === 'string') return idVal;
      
      if (idVal && typeof idVal.toString === 'function') {
        const str = idVal.toString();
        if (str && str !== '[object Object]') return str;
      }
      
      return String(idVal);
    };
    const uIdStr = toIdStr(userId);
    const ownerIdStr = toIdStr(board.owner);

    if (ownerIdStr && uIdStr && ownerIdStr === uIdStr) return true;

    const member = board.members?.find((m) => toIdStr(m.userId || m.user || m) === uIdStr);
    return member?.role === 'editor' || member?.role === 'owner';
  } catch {
    return false;
  }
};

// ─── Canvas Persistence ───────────────────────────────────────────────────

export const persistElementUpsert = async (boardId, userId, element) => {
  try {
    await boardService.upsertElement(boardId, userId, element);
  } catch (err) {
    logger.error("Failed to persist element upsert", {
      boardId,
      elementId: element?.id,
      error: err.message,
    });
  }
};

export const persistElementDelete = async (boardId, userId, elementIds) => {
  try {
    await boardService.deleteElements(boardId, userId, elementIds);
  } catch (err) {
    logger.error("Failed to persist element delete", {
      boardId,
      elementIds,
      error: err.message,
    });
  }
};

export const persistCanvasSave = async (boardId, userId, canvas) => {
  try {
    await boardService.saveCanvas(boardId, userId, canvas);
  } catch (err) {
    logger.error("Failed to persist canvas save", {
      boardId,
      error: err.message,
    });
  }
};