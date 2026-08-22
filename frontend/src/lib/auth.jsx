import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const s = localStorage.getItem("veded_user");
            return s ? JSON.parse(s) : null;
        } catch { return null; }
    });
    const [loading, setLoading] = useState(false);

    const persist = useCallback((token, u) => {
        if (token) localStorage.setItem("veded_token", token);
        if (u) {
            localStorage.setItem("veded_user", JSON.stringify(u));
            setUser(u);
        }
    }, []);

    const refresh = useCallback(async () => {
        try {
            const { data } = await api.get("/auth/me");
            persist(null, data.user);
            return data.user;
        } catch {
            return null;
        }
    }, [persist]);

    const login = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const { data } = await api.post("/auth/login", { email, password });
            persist(data.token, data.user);
            return data.user;
        } finally {
            setLoading(false);
        }
    }, [persist]);

    const signup = useCallback(async (email, password, name) => {
        setLoading(true);
        try {
            const { data } = await api.post("/auth/signup", { email, password, name });
            persist(data.token, data.user);
            return data.user;
        } finally {
            setLoading(false);
        }
    }, [persist]);

    const logout = useCallback(() => {
        localStorage.removeItem("veded_token");
        localStorage.removeItem("veded_user");
        setUser(null);
    }, []);

    useEffect(() => {
        if (localStorage.getItem("veded_token") && user) {
            refresh();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

export function getDeviceFingerprint() {
    let fp = localStorage.getItem("veded_fp");
    if (!fp) {
        const nav = window.navigator;
        const seed = [
            nav.userAgent, nav.language, screen.width, screen.height,
            new Date().getTimezoneOffset(), Math.random().toString(36).slice(2, 10),
        ].join("|");
        fp = btoa(seed).slice(0, 32);
        localStorage.setItem("veded_fp", fp);
    }
    return fp;
}
