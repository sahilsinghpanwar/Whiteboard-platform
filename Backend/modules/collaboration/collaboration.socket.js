import * as collabService from "./collaboration.service.js";
import { logger } from "../../core/logger/logger.js";

export const registerCollaborationHandlers = (io) => {
  const collab = io.of("/collaboration");

  collab.on("connection", (socket) => {
    const { user } = socket; // JWT middleware se attach hota hai
    logger.info("Collaboration socket connected", { userId: user._id });

    // cursor:move throttle karne ke liye per-socket timestamp track karo
    // Bina throttle ke mouse move = ~60 events/sec per user
    // 10 users = 600 events/sec → server flood
    // 50ms throttle = max 20 updates/sec, UX bilkul affect nahi hoti
    const cursorThrottleMap = new Map();

    // ─── join-board ───────────────────────────────────────────────────────────

    socket.on("join-board", async ({ boardId }) => {
      try {
        if (!boardId)
          return socket.emit("error", { message: "boardId is required" });

        await collabService.validateBoardAccess(boardId, user._id);

        const roomName = `board:${boardId}`;
        await socket.join(roomName);
        collabService.addToRoom(boardId, socket.id, user);

        // Naye user ko current active users ki list aur board lock snapshot bhejo
        socket.emit("room:users", {
          users: collabService.getRoomUsers(boardId),
          locks: collabService.getBoardLocks(boardId),
        });

        // Baaki sabko batao ki koi join hua
        socket.to(roomName).emit("user:joined", {
          user: {
            userId: user._id.toString(),
            _id: user._id.toString(),
            fullName: user.fullName,
            profileImageUrl: user.profileImageUrl,
          },
        });

        logger.info("User joined board", { userId: user._id, boardId });
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ─── leave-board ──────────────────────────────────────────────────────────

    socket.on("leave-board", ({ boardId }) => {
      handleLeave(socket, collab, boardId, user);
    });

    // ─── element:update ───────────────────────────────────────────────────────

    socket.on("element:update", async ({ boardId, element }) => {
      try {
        if (!boardId || !element?.id) return;

        // canUserEdit cached hai — pehli call ke baad DB hit nahi hogi
        const canEdit = await collabService.canUserEdit(boardId, user._id);
        if (!canEdit) {
          socket.emit("error", {
            message: "Viewers do not have edit permission on this board",
          });
          return;
        }

        // Lock Check — agar element kisi aur user ne lock kar rakha hai toh update reject karo
        const currentLock = collabService.getElementLock(boardId, element.id);
        const lockUserId = typeof currentLock === "object" && currentLock !== null ? currentLock.userId : currentLock;
        if (lockUserId && String(lockUserId) !== String(user._id)) {
          const lastKnownState = await collabService.getElementById(boardId, element.id);
          socket.emit("element:rejected", {
            elementId: element.id,
            reason: "element_locked",
            lastKnownState,
          });
          return;
        }

        // LWW Check — purana update hai toh reject karo
        const timestamp = element.updatedAt || Date.now();
        const isNewer = collabService.isNewerUpdate(
          boardId,
          element.id,
          timestamp
        );

        if (!isNewer) {
          const lastKnownState = await collabService.getElementById(boardId, element.id);
          // Sender ko bata do — apna local state server ke saath sync kare
          socket.emit("element:rejected", {
            elementId: element.id,
            reason: "stale_update",
            lastKnownState,
          });
          return;
        }

        socket.to(`board:${boardId}`).emit("element:updated", {
          element,
          updatedBy: user._id.toString(),
        });

        await collabService.persistElementUpsert(boardId, user._id, element);
      } catch (err) {
        logger.error("element:update error", { error: err.message });
      }
    });

    // ─── element:delete ───────────────────────────────────────────────────────

    socket.on("element:delete", async ({ boardId, elementIds }) => {
      try {
        if (
          !boardId ||
          !Array.isArray(elementIds) ||
          elementIds.length === 0
        )
          return;

        const canEdit = await collabService.canUserEdit(boardId, user._id);
        if (!canEdit) {
          socket.emit("error", {
            message: "Viewers do not have edit permission on this board",
          });
          return;
        }

        socket.to(`board:${boardId}`).emit("element:deleted", {
          elementIds,
          deletedBy: user._id.toString(),
        });

        // Delete hue elements ka version map entry bhi hata do
        // Warna same ID se naya element create hone pe reject ho jaayega
        collabService.clearElementVersion(boardId, elementIds);

        await collabService.persistElementDelete(
          boardId,
          user._id,
          elementIds
        );
      } catch (err) {
        logger.error("element:delete error", { error: err.message });
      }
    });

    // ─── canvas:save ──────────────────────────────────────────────────────────

    socket.on("canvas:save", async ({ boardId, canvas }) => {
      try {
        if (!boardId || !canvas) return;

        const canEdit = await collabService.canUserEdit(boardId, user._id);
        if (!canEdit) {
          socket.emit("error", {
            message: "Viewers do not have edit permission on this board",
          });
          return;
        }

        // Poora canvas broadcast NAHI karo
        // element:update aur element:delete already real-time sync kar rahe hain
        // canvas:save sirf DB snapshot ke liye hai — sirf sender ko confirm karo
        await collabService.persistCanvasSave(boardId, user._id, canvas);
        socket.emit("canvas:saved", { boardId });
      } catch (err) {
        socket.emit("error", { message: "Canvas save failed" });
        logger.error("canvas:save error", { error: err.message });
      }
    });

    // ─── cursor:move ──────────────────────────────────────────────────────────

    socket.on("cursor:move", ({ boardId, x, y }) => {
      if (!boardId) return;

      // 50ms throttle — sirf 20 updates/sec allow karo
      const now = Date.now();
      const lastSent = cursorThrottleMap.get(socket.id) || 0;
      if (now - lastSent < 50) return;

      cursorThrottleMap.set(socket.id, now);
      collabService.updateCursor(boardId, socket.id, { x, y });

      socket.to(`board:${boardId}`).emit("cursor:moved", {
        userId: user._id.toString(),
        fullName: user.fullName,
        x,
        y,
      });
    });

    // ─── element:lock ─────────────────────────────────────────────────────────

    socket.on("element:lock", ({ boardId, elementId }) => {
      if (!boardId || !elementId) return;

      const lockData = {
        userId: user._id.toString(),
        socketId: socket.id,
        fullName: user.fullName,
      };

      const locked = collabService.lockElement(
        boardId,
        elementId,
        lockData
      );

      if (!locked) {
        // Koi aur already lock kar chuka hai
        socket.emit("element:lock:failed", {
          elementId,
          lockedBy: collabService.getElementLock(boardId, elementId),
        });
        return;
      }

      // Baaki sabko batao — yeh element ab locked hai
      socket.to(`board:${boardId}`).emit("element:locked", {
        elementId,
        lockedBy: lockData,
      });
    });

    // ─── element:unlock ───────────────────────────────────────────────────────

    socket.on("element:unlock", ({ boardId, elementId }) => {
      if (!boardId || !elementId) return;

      collabService.unlockElement(
        boardId,
        elementId,
        user._id.toString(),
        socket.id
      );

      socket.to(`board:${boardId}`).emit("element:unlocked", { elementId });
    });

    // ─── disconnecting ────────────────────────────────────────────────────────
    socket.on("disconnecting", (reason) => {
      logger.info("Collaboration socket disconnecting", {
        userId: user._id,
        reason,
      });

      // Throttle map se is socket ki entry hata do — memory leak rokne ke liye
      cursorThrottleMap.delete(socket.id);

      // Jo bhi board rooms mein tha, sabse leave karo
      socket.rooms.forEach((room) => {
        if (!room.startsWith("board:")) return;
        const boardId = room.replace("board:", "");
        handleLeave(socket, collab, boardId, user);
      });
    });
  });
};

// ─── Shared Leave Handler ─────────────────────────────────────────────────────

const handleLeave = (socket, io, boardId, user) => {
  if (!boardId) return;

  const roomName = `board:${boardId}`;

  collabService.removeFromRoom(boardId, socket.id);

  // Is socket ke element locks release karo
  const releasedCount = collabService.releaseAllLocks(
    boardId,
    user._id.toString(),
    socket.id
  );

  // Tabhi broadcast karo jab locks release hue ho
  if (releasedCount > 0) {
    io.to(roomName).emit("elements:unlocked:all", {
      userId: user._id.toString(),
    });
  }

  socket.leave(roomName);

  // Check karo agar user ka abhi bhi koi aur socket room mein active hai
  const remainingUsers = collabService.getRoomUsers(boardId);
  const stillPresent = remainingUsers.some(
    (u) => String(u.userId || u._id) === String(user._id)
  );

  if (!stillPresent) {
    io.to(roomName).emit("user:left", {
      userId: user._id.toString(),
      fullName: user.fullName,
      users: remainingUsers,
    });
  }
};