import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export function useOfflineCache<T = any>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000 // 5 minutes TTL default
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [isCached, setIsCached] = useState(false);

  const loadFromCache = useCallback(async (): Promise<T | null> => {
    try {
      const stored = await AsyncStorage.getItem(`@naseeb_cache_${key}`);
      if (stored) {
        const cacheItem: CacheItem<T> = JSON.parse(stored);
        const age = Date.now() - cacheItem.timestamp;
        setIsStale(age > ttlMs);
        setIsCached(true);
        return cacheItem.data;
      }
    } catch (e) {
      console.warn('Failed to read offline cache:', e);
    }
    return null;
  }, [key, ttlMs]);

  const saveToCache = useCallback(
    async (freshData: T) => {
      try {
        const cacheItem: CacheItem<T> = {
          data: freshData,
          timestamp: Date.now(),
        };
        await AsyncStorage.setItem(`@naseeb_cache_${key}`, JSON.stringify(cacheItem));
        setIsCached(true);
        setIsStale(false);
      } catch (e) {
        console.warn('Failed to save offline cache:', e);
      }
    },
    [key]
  );

  const sync = useCallback(async () => {
    setLoading(true);
    try {
      const freshData = await fetcher();
      setData(freshData);
      await saveToCache(freshData);
    } catch (err) {
      console.warn(`Sync failed for ${key}, falling back to offline cache.`);
      const cached = await loadFromCache();
      if (cached !== null) {
        setData(cached);
      }
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, saveToCache, loadFromCache]);

  useEffect(() => {
    sync();
  }, [key]);

  return { data, loading, isStale, isCached, refetch: sync };
}
