import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { authApi } from "../lib/services";
import { setAccessToken } from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleAuthPayload = useCallback((payload) => {
    const data = payload?.data ?? payload;
    const token = data?.accessToken;
    const u = data?.user;
    if (token) setAccessToken(token);
    if (u) setUser(u);
    return u;
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const data = await authApi.refresh();
      return handleAuthPayload(data);
    } catch {
      try {
        const data = await authApi.me();
        const u = data?.user ?? data;
        setUser(u);
        return u;
      } catch {
        setAccessToken(null);
        setUser(null);
        return null;
      }
    }
  }, [handleAuthPayload]);

  useEffect(() => {
    refreshMe().finally(() => setLoading(false));
  }, [refreshMe]);

  const login = useCallback(
    async (email, password) => {
      const res = await authApi.login({ email, password });
      return handleAuthPayload(res);
    },
    [handleAuthPayload]
  );

  const register = useCallback(
    async (fullName, email, password) => {
      const res = await authApi.register({ fullName, email, password });
      return handleAuthPayload(res);
    },
    [handleAuthPayload]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}
    setAccessToken(null);
    setUser(null);
  }, []);

  const setTokenAndRefresh = useCallback(
    async (token) => {
      if (token) setAccessToken(token);
      return refreshMe();
    },
    [refreshMe]
  );

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      login,
      register,
      logout,
      refreshMe,
      setTokenAndRefresh,
    }),
    [user, loading, login, register, logout, refreshMe, setTokenAndRefresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
