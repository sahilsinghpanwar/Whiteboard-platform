import { boardService } from "../board/index.js";
import { logger } from "../../core/logger/logger.js";

// ─────────────────────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────────────────────

const toIdStr = (v) => {
  if (!v) return "";
  if (v._id) return v._id.toString();
  return v.toString();
};

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Stores
// ─────────────────────────────────────────────────────────────────────────────

// Board rooms — boardId → Map(socketId → userObj)
const rooms = new Map();

// Permission cache — "boardId:userId" → { canEdit, expiresAt }
// Har element event pe DB hit hoti thi, ab 5 min cache hai
const permissionCache = new Map();

// LWW version map — "boardId:elementId" → timestamp (ms)
// Stale/purane updates ko reject karne ke liye
const elementVersionMap = new Map();

// Element locks — "boardId:elementId" → userId
// Ek hi element pe ek saath multiple users ka conflict rokne ke liye
const elementLocks = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// Room Registry
// ─────────────────────────────────────────────────────────────────────────────

export const addToRoom = (boardId, socketId, user) => {
  if (!rooms.has(boardId)) rooms.set(boardId, new Map());

  const userObj = {
    userId: toIdStr(user._id || user.userId),
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

  // Room empty ho gayi toh memory free karo
  if (room.size === 0) rooms.delete(boardId);
};

export const getRoomUsers = (boardId) => {
  const room = rooms.get(boardId);
  if (!room) return [];

  // Ek user ke multiple tabs hone par duplicate aa sakta hai
  // userId se deduplicate karo
  const uniqueMap = new Map();
  for (const u of room.values()) {
    const key = String(u.userId || u.socketId);
    if (!uniqueMap.has(key)) uniqueMap.set(key, u);
  }

  return Array.from(uniqueMap.values());
};

export const updateCursor = (boardId, socketId, cursor) => {
  const room = rooms.get(boardId);
  if (!room || !room.has(socketId)) return;

  const user = room.get(socketId);
  room.set(socketId, { ...user, cursor });
};

export const getUserFromRoom = (boardId, socketId) =>
  rooms.get(boardId)?.get(socketId) ?? null;

// ─────────────────────────────────────────────────────────────────────────────
// Board Access & Permissions
// ─────────────────────────────────────────────────────────────────────────────

export const validateBoardAccess = async (boardId, userId) => {
  try {
    return await boardService.getBoardById(boardId, userId);
  } catch {
    throw new Error("Access denied or board not found");
  }
};

// Permission result 5 min ke liye cache karo
// Pehle: element:update → DB call, element:delete → DB call (100 elements = 100 DB hits)
// Ab: Pehli baar → DB call + cache, Baaki baar → cache se return (0 DB hits)
export const canUserEdit = async (boardId, userId) => {
  const cacheKey = `${boardId}:${toIdStr(userId)}`;
  const cached = permissionCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.canEdit;
  }

  try {
    const board = await boardService.getBoardById(boardId, userId);
    const uIdStr = toIdStr(userId);
    const ownerIdStr = toIdStr(board.owner);

    let canEdit = false;

    if (ownerIdStr && uIdStr && ownerIdStr === uIdStr) {
      canEdit = true;
    } else {
      const member = board.members?.find(
        (m) => toIdStr(m.userId || m.user || m) === uIdStr
      );
      canEdit = member?.role === "editor" || member?.role === "owner";
    }

    // 5 minute ke liye cache karo
    permissionCache.set(cacheKey, {
      canEdit,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return canEdit;
  } catch {
    return false;
  }
};

// Board ke members change hone pe cache clear karo
// Apne board update route mein yeh call karna
export const invalidatePermissionCache = (boardId) => {
  for (const key of permissionCache.keys()) {
    if (key.startsWith(`${boardId}:`)) permissionCache.delete(key);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Conflict Resolution — Last Write Wins (LWW)
// ─────────────────────────────────────────────────────────────────────────────

// Problem pehle:
//   User A → shape x:100 (timestamp 999ms)
//   User B → shape x:200 (timestamp 1000ms)
//   Server dono broadcast karta → kisi ko 100 dikhta, kisi ko 200 → INCONSISTENT
// Ab:
//   Incoming timestamp purane se zyada → true (broadcast karo)
//   Incoming timestamp purana → false (reject karo)
export const isNewerUpdate = (boardId, elementId, incomingTimestamp) => {
  const key = `${boardId}:${elementId}`;
  const lastTimestamp = elementVersionMap.get(key) || 0;

  if (incomingTimestamp <= lastTimestamp) return false;

  elementVersionMap.set(key, incomingTimestamp);
  return true;
};

// Element delete hone pe uski version entry bhi hata do
export const clearElementVersion = (boardId, elementIds) => {
  for (const id of elementIds) {
    elementVersionMap.delete(`${boardId}:${id}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Conflict Resolution — Element Locking
// ─────────────────────────────────────────────────────────────────────────────

// Jab User A shape select/drag kare toh lock karo
// Tab tak User B us shape ko touch nahi kar sakta
// User A drag end kare ya disconnect ho → lock release
export const lockElement = (boardId, elementId, userId) => {
  const key = `${boardId}:${elementId}`;
  const currentLock = elementLocks.get(key);

  // Koi aur pehle se lock kar chuka hai
  if (currentLock && currentLock !== userId) return false;

  elementLocks.set(key, userId);
  return true;
};

export const unlockElement = (boardId, elementId, userId) => {
  const key = `${boardId}:${elementId}`;
  if (elementLocks.get(key) === userId) elementLocks.delete(key);
};

export const getElementLock = (boardId, elementId) =>
  elementLocks.get(`${boardId}:${elementId}`) || null;

// User disconnect / leave karne pe uske saare locks release karo
// Warna board ke elements permanently locked reh sakte hain
export const releaseAllLocks = (boardId, userId) => {
  for (const [key, lockedBy] of elementLocks.entries()) {
    if (key.startsWith(`${boardId}:`) && lockedBy === userId) {
      elementLocks.delete(key);
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Canvas Persistence
// ─────────────────────────────────────────────────────────────────────────────

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