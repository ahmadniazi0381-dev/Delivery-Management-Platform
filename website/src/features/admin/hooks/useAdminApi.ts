"use client";
import { useState, useEffect, useCallback, useRef } from 'react';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('naseeb_token');
}

function getHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
  }
  return '/api';
}

export function formatApiUrl(url: string): string {
  const base = getApiBaseUrl();
  let path = url.startsWith('/') ? url : `/${url}`;
  if (base.endsWith('/api') && path.startsWith('/api/')) {
    path = path.substring(4);
  }
  return `${base}${path}`;
}

export function useAdminQuery<T = any>(url: string, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetch_ = useCallback(async () => {
    if (!url) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(formatApiUrl(url), {
        headers: getHeaders(),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data ?? json);
    } catch (e: any) {
      if (e.name !== 'AbortError') setError(e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [url, ...deps]); // eslint-disable-line

  useEffect(() => { fetch_(); return () => abortRef.current?.abort(); }, [fetch_]);
  return { data, loading, error, refetch: fetch_ };
}

export function useAdminMutation<T = any>(url: string, method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (body?: any, overrideUrl?: string): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(formatApiUrl(overrideUrl || url), {
        method,
        headers: getHeaders(),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      return json;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [url, method]);

  return { mutate, loading, error };
}

export async function adminFetch(url: string, options?: RequestInit) {
  const res = await fetch(formatApiUrl(url), {
    ...options,
    headers: { ...getHeaders(), ...(options?.headers || {}) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json;
}

