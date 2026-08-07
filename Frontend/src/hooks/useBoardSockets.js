// import { useEffect, useRef, useState, useCallback } from "react";
// import { io } from "socket.io-client";

// const API_URL = process.env.REACT_APP_API_URL;

// /**
//  * Manages two socket.io namespace connections: /collaboration and /chat
//  * for a given board. Emits helpers and exposes event registration.
//  */
// export const useBoardSockets = (boardId) => {
//   const collabRef = useRef(null);
//   const chatRef = useRef(null);
//   const [connected, setConnected] = useState(false);

//   useEffect(() => {
//     if (!boardId) return;
//     const token = localStorage.getItem("accessToken");
//     if (!token) return;

//     const common = {
//       auth: { token },
//       transports: ["websocket", "polling"],
//       withCredentials: true,
//       reconnection: true,
//     };

//     const collab = io(`${API_URL}/collaboration`, common);
//     const chat = io(`${API_URL}/chat`, common);
//     collabRef.current = collab;
//     chatRef.current = chat;

//     collab.on("connect", () => {
//       setConnected(true);
//       collab.emit("join-board", { boardId });
//     });
//     collab.on("disconnect", () => setConnected(false));

//     chat.on("connect", () => {
//       chat.emit("chat:join", { boardId });
//     });

//     return () => {
//       try { collab.emit("leave-board", { boardId }); } catch {}
//       collab.disconnect();
//       chat.disconnect();
//       collabRef.current = null;
//       chatRef.current = null;
//     };
//   }, [boardId]);

//   const onCollab = useCallback((event, handler) => {
//     const s = collabRef.current;
//     if (!s) return () => {};
//     s.on(event, handler);
//     return () => s.off(event, handler);
//   }, []);

//   const onChat = useCallback((event, handler) => {
//     const s = chatRef.current;
//     if (!s) return () => {};
//     s.on(event, handler);
//     return () => s.off(event, handler);
//   }, []);

//   const emitCollab = useCallback((event, payload) => {
//     collabRef.current?.emit(event, payload);
//   }, []);

//   const emitChat = useCallback((event, payload) => {
//     chatRef.current?.emit(event, payload);
//   }, []);

//   return { connected, onCollab, onChat, emitCollab, emitChat, collabRef, chatRef };
// };



import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { getAccessToken, setAccessToken } from "../lib/api";
import { authApi } from "../lib/services";

const getApiUrl = () => {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  const isProduction =
    typeof import.meta !== "undefined" && import.meta.env?.MODE === "production";

  if (isProduction) {
    throw new Error("VITE_API_URL is not configured for production environment.");
  }

  return "http://localhost:5000";
};

const API_URL = getApiUrl();

/**
 * Custom hook managing WebSocket connections (collaboration + chat)
 * for a given board. Emits helpers and exposes event registration.
 */
export const useBoardSockets = (boardId) => {
  const collabRef = useRef(null);
  const chatRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [collabSocket, setCollabSocket] = useState(null);
  const [chatSocket, setChatSocket] = useState(null);

  useEffect(() => {
    if (!boardId) return;

    const common = {
      auth: (cb) => {
        const token =
          getAccessToken() ||
          (typeof localStorage !== "undefined" ? localStorage.getItem("accessToken") : null);
        cb({ token });
      },
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    };

    const collab = io(`${API_URL}/collaboration`, common);
    const chat = io(`${API_URL}/chat`, common);
    collabRef.current = collab;
    chatRef.current = chat;
    queueMicrotask(() => {
      setCollabSocket(collab);
      setChatSocket(chat);
    });

    collab.on("connect", () => {
      setConnected(true);
      collab.emit("join-board", { boardId });
    });
    collab.on("disconnect", () => setConnected(false));
    collab.on("connect_error", async (err) => {
      setConnected(false);
      if (
        err?.message?.toLowerCase().includes("token") ||
        err?.message?.toLowerCase().includes("jwt") ||
        err?.message?.toLowerCase().includes("expired")
      ) {
        try {
          const res = await authApi.refresh();
          const newToken = res?.accessToken;
          if (newToken) {
            setAccessToken(newToken);
            collab.connect();
            chat.connect();
          }
        } catch {
          // Token refresh failed
        }
      }
    });

    chat.on("connect", () => {
      chat.emit("chat:join", { boardId });
    });

    return () => {
      try { collab.emit("leave-board", { boardId }); } catch { console.warn("Failed to emit leave-board"); }
      collab.disconnect();
      chat.disconnect();
      collabRef.current = null;
      chatRef.current = null;
      setCollabSocket(null);
      setChatSocket(null);
    };
  }, [boardId]);

  const onCollab = useCallback((event, handler) => {
    const s = collabSocket || collabRef.current;
    if (!s) return () => {};
    s.on(event, handler);
    return () => s.off(event, handler);
  }, [collabSocket]);

  const onChat = useCallback((event, handler) => {
    const s = chatSocket || chatRef.current;
    if (!s) return () => {};
    s.on(event, handler);
    return () => s.off(event, handler);
  }, [chatSocket]);

  const emitCollab = useCallback((event, payload, ack) => {
    (collabSocket || collabRef.current)?.emit(event, payload, ack);
  }, [collabSocket]);

  const emitChat = useCallback((event, payload, ack) => {
    (chatSocket || chatRef.current)?.emit(event, payload, ack);
  }, [chatSocket]);

  return { connected, onCollab, onChat, emitCollab, emitChat, collabRef, chatRef };
};
