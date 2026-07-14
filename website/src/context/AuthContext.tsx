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
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "naseeb_token";
const USER_KEY  = "naseeb_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState]   = useState<User | null>(null);
  const [token, setToken]      = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser  = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUserState(JSON.parse(storedUser));
      }
    } catch {}
    setLoading(false);
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      try {
        // Determine if identifier is an email or a phone number
        const isEmail = identifier.includes("@");
        const body = isEmail
          ? { email: identifier, password }
          : { phone: identifier, password };

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
        const data = await res.json();
        if (res.ok && data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          setToken(data.token);
          setUserState(data.user);
          return { success: true, user: data.user };
        }
        return { success: false, message: data.error || data.message || "Login failed." };
      } catch {
        return { success: false, message: "Network error. Make sure the server is running." };
      }
    },
    []
  );


  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUserState(null);
  }, []);

  const setUser = useCallback((u: User) => {
    setUserState(u);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, logout, setUser }}
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
