/**
 * useBoard
 *
 * Joins a board socket room and wires all collaboration events
 * to the board store. Used by the BoardPage.
 */

import { useEffect, useCallback } from "react";
import { useSocketStore } from "@/features/socket/store/Socketstore.js";
import { useBoardStore } from "../store/Boardstore.js";

const CURSOR_COLORS = ["#f43f5e", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];

const getUserColor = (userId) => {
  if (!userId) return CURSOR_COLORS[0];
  const hash = String(userId).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
};

export const useBoard = (boardId) => {
  const socket = useSocketStore((s) => s.socket);
  const {
    setActiveUsers,
    applyRemoteElementUpdate,
    applyRemoteElementDelete,
    applyRemoteCanvasSave,
    addActiveUser,
    removeActiveUser,
    updateCursor,
    clearBoard,
    setBoard,
  } = useBoardStore();

  // ─── Join / Leave room on mount / unmount ─────────────────────────────────
  useEffect(() => {
    if (!socket || !boardId) return;

    const joinRoom = () => {
      socket.emit("join-board", { boardId });
    };

    joinRoom();

    socket.on("connect", joinRoom);

    return () => {
      socket.off("connect", joinRoom);
      socket.emit("leave-board", { boardId });
      clearBoard();
    };
  }, [socket, boardId]);

  // ─── Subscribe to collaboration socket events ─────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Room active users snapshot
    const onRoomUsers = ({ users }) => {
      if (Array.isArray(users)) {
        setActiveUsers(
          users.map((u) => {
            const uId = u.userId || u._id;
            return { ...u, userId: uId, color: getUserColor(uId) };
          })
        );
      }
    };

    // Broadcast when another user joins
    const onUserJoined = ({ user }) => {
      if (user) {
        const uId = user.userId || user._id;
        addActiveUser({
          userId: uId,
          fullName: user.fullName,
          profileImageUrl: user.profileImageUrl,
          color: getUserColor(uId),
        });
      }
    };

    // Broadcast when another user leaves
    const onUserLeft = ({ userId, users }) => {
      if (users && Array.isArray(users)) {
        setActiveUsers(
          users.map((u) => {
            const uId = u.userId || u._id;
            return { ...u, userId: uId, color: getUserColor(uId) };
          })
        );
      } else if (userId) {
        removeActiveUser(userId);
      }
    };

    // Real-time element updates
    const onElementUpdated = ({ element }) => {
      if (element) {
        applyRemoteElementUpdate(element);
      }
    };

    // Real-time element deletions
    const onElementDeleted = ({ elementIds }) => {
      if (Array.isArray(elementIds)) {
        applyRemoteElementDelete(elementIds);
      }
    };

    // Real-time canvas full updates (e.g. bulk clear, restored states)
    const onCanvasUpdated = ({ canvas }) => {
      if (canvas && Array.isArray(canvas.elements)) {
        applyRemoteCanvasSave(canvas.elements);
      }
    };

    // Real-time live cursor movement
    const onCursorMoved = ({ userId, fullName, x, y }) => {
      if (userId) {
        updateCursor(userId, {
          x,
          y,
          fullName,
          color: getUserColor(userId),
        });
      }
    };

    socket.on("room:users", onRoomUsers);
    socket.on("user:joined", onUserJoined);
    socket.on("user:left", onUserLeft);
    socket.on("element:updated", onElementUpdated);
    socket.on("element:deleted", onElementDeleted);
    socket.on("canvas:updated", onCanvasUpdated);
    socket.on("cursor:moved", onCursorMoved);

    // Dynamic Board State Update (Roles, Title, etc.)
    const onBoardUpdated = ({ board }) => {
      if (board) {
        setBoard(board);
      }
    };
    socket.on("board:updated", onBoardUpdated);

    return () => {
      socket.off("room:users", onRoomUsers);
      socket.off("user:joined", onUserJoined);
      socket.off("user:left", onUserLeft);
      socket.off("element:updated", onElementUpdated);
      socket.off("element:deleted", onElementDeleted);
      socket.off("canvas:updated", onCanvasUpdated);
      socket.off("cursor:moved", onCursorMoved);
      socket.off("board:updated", onBoardUpdated);
    };
  }, [socket]);

  // ─── Event Emission Helpers ────────────────────────────────────────────────
  const emitElementUpdate = useCallback(
    (element) => {
      if (!socket || !boardId || !element) return;
      socket.emit("element:update", { boardId, element });
    },
    [socket, boardId]
  );

  const emitElementDelete = useCallback(
    (elementIds) => {
      if (!socket || !boardId || !elementIds) return;
      socket.emit("element:delete", { boardId, elementIds });
    },
    [socket, boardId]
  );

  const emitCursorMove = useCallback(
    (x, y) => {
      if (!socket || !boardId) return;
      socket.emit("cursor:move", { boardId, x, y });
    },
    [socket, boardId]
  );

  const emitCanvasSave = useCallback(
    (elements) => {
      if (!socket || !boardId) return;
      socket.emit("canvas:save", { boardId, canvas: { elements } });
    },
    [socket, boardId]
  );

  return { emitElementUpdate, emitElementDelete, emitCursorMove, emitCanvasSave };
};