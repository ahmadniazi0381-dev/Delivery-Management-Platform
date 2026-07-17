"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; user?: User; message?: string }>;
  /** Persist token + user after Google (or any) auth success */
  applySession: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "naseeb_token";
const USER_KEY = "naseeb_user";

function normalizeUser(raw: User): User {
  const phoneVerified = !!(raw.phoneVerified ?? raw.isPhoneVerified);
  return {
    ...raw,
    phone: raw.phone ?? null,
    phoneVerified,
    isPhoneVerified: phoneVerified,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUserState(normalizeUser(JSON.parse(storedUser)));
      }
    } catch {}
    setLoading(false);
  }, []);

  const applySession = useCallback((newToken: string, newUser: User) => {
    const normalized = normalizeUser(newUser);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(normalized));
    setToken(newToken);
    setUserState(normalized);
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      try {
        const isEmail = identifier.includes("@");
        const body = isEmail
          ? { email: identifier, password }
          : { phone: identifier, password };

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (res.ok && data.token) {
          applySession(data.token, data.user);
          return { success: true, user: normalizeUser(data.user) };
        }
        return { success: false, message: data.error || data.message || "Login failed." };
      } catch {
        return { success: false, message: "Network error. Make sure the server is running." };
      }
    },
    [applySession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUserState(null);
  }, []);

  const setUser = useCallback((u: User) => {
    const normalized = normalizeUser(u);
    setUserState(normalized);
    localStorage.setItem(USER_KEY, JSON.stringify(normalized));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, applySession, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
