/**
 * Auth Store
 *
 * Holds: accessToken (in memory, never localStorage), user object.
 * The refresh token lives in an HTTP-only cookie — we never touch it directly.
 *
 * Why accessToken in memory (not localStorage)?
 * localStorage is readable by any JS on the page — XSS attack vector.
 * Memory is cleared when the tab closes, which is the correct behavior
 * for a security-sensitive token.
 */

import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: ({ user, accessToken }) =>
    set({ user, accessToken, isAuthenticated: true }),

  setUser: (user) => set({ user }),

  clearAuth: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),
}));