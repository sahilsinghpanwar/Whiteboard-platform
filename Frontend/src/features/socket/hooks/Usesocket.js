/**
 * useSocket
 *
 * Manages the Socket.io collaboration connection lifecycle.
 * Connects once when the user is authenticated, disconnects on logout.
 * Returns the socket instance for use in other hooks.
 */

import { useEffect } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "@/shared/constants/index.js";
import { useAuthStore } from "@/features/auth/store/useAuthStore.js";
import { useSocketStore } from "../store/Socketstore.js";

export const useSocket = () => {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { socket, setSocket, setConnected } = useSocketStore();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Don't create a second connection if one already exists
    if (socket?.connected) return;

    const newSocket = io(`${SOCKET_URL}/collaboration`, {
      auth: { token },
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      setConnected(true);
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket collaboration connection error:", err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, token]);

  return useSocketStore((s) => s.socket);
};