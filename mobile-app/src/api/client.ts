import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000/api';
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiUrl();
export const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const TOKEN_KEY = '@delivery_platform_token';
const LEGACY_TOKEN_KEY = '@naseeb_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: append Authorization header dynamically
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = (await AsyncStorage.getItem(TOKEN_KEY)) || (await AsyncStorage.getItem(LEGACY_TOKEN_KEY));
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch { /* non-critical read failure */ }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: handle expired/invalid tokens
// ponytail: local token clear only — AuthContext re-reads on next render cycle
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      try {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
        console.warn('[API] 401 received — token cleared. App will redirect to login on next navigation.');
      } catch { /* non-critical */ }
    }
    return Promise.reject(error);
  }
);

// Helper methods to abstract requests
export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await apiClient.get<T>(url, { params });
  return response.data;
}

export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.post<T>(url, data);
  return response.data;
}

export async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.put<T>(url, data);
  return response.data;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const response = await apiClient.delete<T>(url);
  return response.data;
}
