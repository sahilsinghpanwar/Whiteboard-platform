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

// Board permission epoch tracker — race conditions prevent karne ke liye
const boardEpochs = new Map();
const getBoardEpoch = (boardId) => boardEpochs.get(boardId) || 0;

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

  const startEpoch = getBoardEpoch(boardId);

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

    // Sirf tab cache karo jab epoch change NAHI hua ho async lookup ke dauran
    if (startEpoch === getBoardEpoch(boardId)) {
      permissionCache.set(cacheKey, {
        canEdit,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
    }

    return canEdit;
  } catch {
    return false;
  }
};

// Board ke members change hone pe epoch advance karo aur cache clear karo
export const invalidatePermissionCache = (boardId) => {
  boardEpochs.set(boardId, getBoardEpoch(boardId) + 1);
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

  const now = Date.now();
  const parsed = Number(incomingTimestamp);
  const validTs = isNaN(parsed) || parsed <= 0 ? now : parsed;
  const clampedTs = Math.min(validTs, now);

  if (clampedTs <= lastTimestamp) return false;

  elementVersionMap.set(key, clampedTs);
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
export const lockElement = (boardId, elementId, lockData) => {
  const key = `${boardId}:${elementId}`;
  const currentLock = elementLocks.get(key);

  const incomingUserId = typeof lockData === "object" && lockData !== null ? lockData.userId : lockData;
  const currentUserId = typeof currentLock === "object" && currentLock !== null ? currentLock.userId : currentLock;

  // Koi aur pehle se lock kar chuka hai
  if (currentLock && currentUserId !== incomingUserId) return false;

  elementLocks.set(key, lockData);
  return true;
};

export const unlockElement = (boardId, elementId, userId, socketId) => {
  const key = `${boardId}:${elementId}`;
  const currentLock = elementLocks.get(key);
  if (!currentLock) return;

  const currentSocketId = typeof currentLock === "object" && currentLock !== null ? currentLock.socketId : null;
  const currentUserId = typeof currentLock === "object" && currentLock !== null ? currentLock.userId : currentLock;

  if (socketId && currentSocketId) {
    if (currentSocketId === socketId) elementLocks.delete(key);
  } else if (currentUserId === userId) {
    elementLocks.delete(key);
  }
};

export const getElementLock = (boardId, elementId) =>
  elementLocks.get(`${boardId}:${elementId}`) || null;

export const getBoardLocks = (boardId) => {
  const prefix = `${boardId}:`;
  const locks = {};
  for (const [key, lockData] of elementLocks.entries()) {
    if (key.startsWith(prefix)) {
      const elementId = key.slice(prefix.length);
      locks[elementId] = typeof lockData === "object" && lockData !== null ? lockData : { userId: lockData };
    }
  }
  return locks;
};

// User disconnect / leave karne pe us socket ke locks release karo
export const releaseAllLocks = (boardId, userId, socketId) => {
  let count = 0;
  for (const [key, lockData] of elementLocks.entries()) {
    if (!key.startsWith(`${boardId}:`)) continue;
    const currentSocketId = typeof lockData === "object" && lockData !== null ? lockData.socketId : null;
    const currentUserId = typeof lockData === "object" && lockData !== null ? lockData.userId : lockData;

    if (socketId && currentSocketId) {
      if (currentSocketId === socketId) {
        elementLocks.delete(key);
        count++;
      }
    } else if (currentUserId === userId) {
      elementLocks.delete(key);
      count++;
    }
  }
  return count;
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

export const getElementById = async (boardId, elementId) => {
  try {
    const board = await boardService.getBoardById(boardId);
    return board?.canvas?.elements?.find((e) => e.id === elementId) || null;
  } catch {
    return null;
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