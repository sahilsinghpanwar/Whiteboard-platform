import { useEffect } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "@/shared/constants/index.js";
import { useAuthStore } from "@/features/auth/store/useAuthStore.js";
import { useSocketStore } from "../store/Socketstore.js";

export const useSocket = () => {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { setSocket, setConnected, disconnect } = useSocketStore();

  useEffect(() => {
    // If not authenticated or logged out, disconnect existing socket
    if (!isAuthenticated || !token) {
      disconnect();
      return;
    }

    const currentSocket = useSocketStore.getState().socket;
    // Don't create a new connection if socket is already active and connected
    if (currentSocket && (currentSocket.connected || currentSocket.connecting)) {
      return;
    }

    const newSocket = io(`${SOCKET_URL}/collaboration`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      setConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      setConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.warn("Collaboration socket connect error:", err.message);
    });

    setSocket(newSocket);

    // Note: Do NOT disconnect on component unmount (route change).
    // The socket should remain active while the user stays authenticated.
  }, [isAuthenticated, token, setSocket, setConnected, disconnect]);

  return useSocketStore((s) => s.socket);
};