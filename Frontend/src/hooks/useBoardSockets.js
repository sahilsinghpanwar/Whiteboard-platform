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

const getApiUrl = () => {
  // Vite injects process.env via define config
  if (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return "http://localhost:5000";
};

const API_URL = getApiUrl();

/**
 * Manages two socket.io namespace connections: /collaboration and /chat
 * for a given board. Emits helpers and exposes event registration.
 */
export const useBoardSockets = (boardId) => {
  const collabRef = useRef(null);
  const chatRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!boardId) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const common = {
      auth: { token },
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

    collab.on("connect", () => {
      setConnected(true);
      collab.emit("join-board", { boardId });
    });
    collab.on("disconnect", () => setConnected(false));
    collab.on("connect_error", () => setConnected(false));

    chat.on("connect", () => {
      chat.emit("chat:join", { boardId });
    });

    return () => {
      try { collab.emit("leave-board", { boardId }); } catch { console.warn("Failed to emit leave-board"); }
      collab.disconnect();
      chat.disconnect();
      collabRef.current = null;
      chatRef.current = null;
    };
  }, [boardId]);

  const onCollab = useCallback((event, handler) => {
    const s = collabRef.current;
    if (!s) return () => {};
    s.on(event, handler);
    return () => s.off(event, handler);
  }, []);

  const onChat = useCallback((event, handler) => {
    const s = chatRef.current;
    if (!s) return () => {};
    s.on(event, handler);
    return () => s.off(event, handler);
  }, []);

  const emitCollab = useCallback((event, payload) => {
    collabRef.current?.emit(event, payload);
  }, []);

  const emitChat = useCallback((event, payload) => {
    chatRef.current?.emit(event, payload);
  }, []);

  return { connected, onCollab, onChat, emitCollab, emitChat, collabRef, chatRef };
};
