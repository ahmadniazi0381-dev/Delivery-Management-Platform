import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { User } from "../types";
import { AuthService } from "../services/auth.service";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  updateUser: (fields: Partial<User>) => Promise<void>;
  biometricLogin: () => Promise<boolean>;
  isBiometricSupported: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "@naseeb_token";
const USER_KEY = "@naseeb_user";
const BIOMETRIC_ENABLED_KEY = "@naseeb_biometric_enabled";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  // Load credentials on mount and check biometrics
  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUserState(JSON.parse(storedUser));
        }

        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricSupported(compatible && enrolled);
      } catch {}
      setIsLoading(false);
    }
    loadStoredAuth();
  }, []);

  const login = useCallback(async (newToken: string, newUser: User) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
      setToken(newToken);
      setUserState(newUser);
    } catch (e) {
      console.error("Failed to save auth state:", e);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      setToken(null);
      setUserState(null);
    } catch (e) {
      console.error("Failed to clear auth state:", e);
    }
  }, []);

  const setUser = useCallback((u: User) => {
    setUserState(u);
    AsyncStorage.setItem(USER_KEY, JSON.stringify(u)).catch(() => {});
  }, []);

  const updateUser = useCallback(async (fields: Partial<User>) => {
    setUserState((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...fields };
      AsyncStorage.setItem(USER_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const biometricLogin = useCallback(async (): Promise<boolean> => {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);
      const biometricEnabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);

      if (!storedToken || !storedUser || biometricEnabled !== "true") {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to login to Karachi Naseeb Biryani",
        fallbackLabel: "Use Password",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setToken(storedToken);
        setUserState(JSON.parse(storedUser));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Biometric auth error:", e);
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        setUser,
        updateUser,
        biometricLogin,
        isBiometricSupported,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
