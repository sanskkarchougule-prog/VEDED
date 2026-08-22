import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("veded_token");
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch (e) {
      localStorage.removeItem("veded_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = (token, u) => {
    localStorage.setItem("veded_token", token);
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem("veded_token");
    setUser(null);
  };
  const setCredits = (credits) => setUser((u) => (u ? { ...u, credits } : u));

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh, setCredits, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
