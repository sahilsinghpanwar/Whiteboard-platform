/**
 * useChat
 *
 * Connects to the /chat namespace, loads message history,
 * handles real-time messages, typing indicators, and message deletion.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "@/shared/constants/index.js";
import { useAuthStore } from "@/features/auth/store/useAuthStore.js";
import { chatApi } from "../api/Chat.api.js";

export const useChat = (boardId) => {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // { userId: fullName }
  const socketRef = useRef(null);

  // 1. Fetch historical messages on mount
  useEffect(() => {
    if (!boardId) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await chatApi.getMessages(boardId);
        const fetchedMessages = res.data?.data?.messages || res.data?.data || [];
        setMessages(fetchedMessages);
      } catch (err) {
        console.warn("Failed to fetch chat history:", err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [boardId]);

  // 2. Connect to /chat socket namespace & subscribe to events
  useEffect(() => {
    if (!boardId || !token) return;

    const chatSocket = io(`${SOCKET_URL}/chat`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    socketRef.current = chatSocket;

    chatSocket.on("connect", () => {
      chatSocket.emit("chat:join", { boardId });
    });

    chatSocket.on("chat:message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    chatSocket.on("chat:typing", ({ userId, fullName }) => {
      if (String(userId) !== String(user?._id)) {
        setTypingUsers((prev) => ({ ...prev, [userId]: fullName }));
      }
    });

    chatSocket.on("chat:stop-typing", ({ userId }) => {
      setTypingUsers((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    });

    chatSocket.on("chat:deleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => String(m._id || m.id) !== String(messageId)));
    });

    return () => {
      chatSocket.disconnect();
    };
  }, [boardId, token, user?._id]);

  // 3. Emit actions
  const sendMessage = useCallback(
    (content) => {
      if (!content.trim() || !socketRef.current) return;
      socketRef.current.emit("chat:send", { boardId, content, type: "text" });
      socketRef.current.emit("chat:stop-typing", { boardId });
    },
    [boardId]
  );

  const startTyping = useCallback(() => {
    if (!socketRef.current || !boardId) return;
    socketRef.current.emit("chat:typing", { boardId });
  }, [boardId]);

  const stopTyping = useCallback(() => {
    if (!socketRef.current || !boardId) return;
    socketRef.current.emit("chat:stop-typing", { boardId });
  }, [boardId]);

  const deleteMessage = useCallback(
    (messageId) => {
      if (!socketRef.current || !boardId || !messageId) return;
      socketRef.current.emit("chat:delete", { boardId, messageId });
    },
    [boardId]
  );

  return {
    messages,
    isLoading,
    typingUsers: Object.values(typingUsers),
    sendMessage,
    startTyping,
    stopTyping,
    deleteMessage,
    currentUserId: user?._id,
  };
};