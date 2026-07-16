import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// API URL Resolution:
// - EXPO_PUBLIC_API_URL takes priority (set in .env — see .env.example)
// - Production: https://YOUR_RENDER_SERVICE.onrender.com/api
// - Android Emulator fallback: 10.0.2.2 → host machine localhost
// - iOS Simulator fallback: localhost
// - Physical device: set EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:5000/api

const getApiUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === "android") return "http://10.0.2.2:5000/api";
  return "http://localhost:5000/api";
};

export const API_BASE_URL = getApiUrl();
export const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const TOKEN_KEY = "@naseeb_token";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request Interceptor to append Authorization header dynamically
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper methods to abstract requests
export async function apiGet<T>(url: string, params?: any): Promise<T> {
  const response = await apiClient.get<T>(url, { params });
  return response.data;
}

export async function apiPost<T>(url: string, data?: any): Promise<T> {
  const response = await apiClient.post<T>(url, data);
  return response.data;
}

export async function apiPut<T>(url: string, data?: any): Promise<T> {
  const response = await apiClient.put<T>(url, data);
  return response.data;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const response = await apiClient.delete<T>(url);
  return response.data;
}
