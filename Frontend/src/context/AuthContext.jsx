import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../lib/services";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const data = await authApi.me();
      const u = data?.user ?? data;
      setUser(u);
      return u;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { setLoading(false); return; }
    refreshMe().finally(() => setLoading(false));
  }, [refreshMe]);

  const handleAuthPayload = (payload) => {
    // Backend wraps: { statusCode, message, data: { accessToken, refreshToken, user } }
    // OR nested differently. Normalize both.
    const data = payload?.data ?? payload;
    const token = data?.accessToken;
    const u = data?.user;
    if (token) localStorage.setItem("accessToken", token);
    if (u) setUser(u);
    return u;
  };

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    return handleAuthPayload(res);
  };

  const register = async (fullName, email, password) => {
    const res = await authApi.register({ fullName, email, password });
    return handleAuthPayload(res);
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  const setTokenAndRefresh = async (token) => {
    localStorage.setItem("accessToken", token);
    return refreshMe();
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refreshMe, setTokenAndRefresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
