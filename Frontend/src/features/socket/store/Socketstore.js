import { create } from "zustand";

export const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,

  setSocket: (socket) => set({ socket }),

  setConnected: (isConnected) => set({ isConnected }),

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));