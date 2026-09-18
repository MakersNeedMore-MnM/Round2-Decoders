/**
 * Minimal in-memory cache for client-side data fetching, with a
 * stale-while-revalidate pattern.
 *
 * Why this exists: pages like /accounts use plain useEffect + useState,
 * so every time you navigate away and back the component remounts and
 * re-fetches from zero — even if you were just there 5 seconds ago.
 * This module is a singleton (lives in the JS module scope, not React
 * state), so it survives client-side navigation and gives repeat visits
 * an instant paint from cache while quietly refreshing in the
 * background.
 *
 * No extra dependency needed (no React Query / SWR) — this covers the
 * same core behavior for the handful of endpoints that need it.
 */

type CacheEntry<T> = {
    data: T;
    timestamp: number;
  };
  
  const cache = new Map<string, CacheEntry<unknown>>();
  const inflight = new Map<string, Promise<unknown>>();
  
  /** How long cached data is considered fresh enough to skip revalidation entirely. */
  const DEFAULT_TTL_MS = 60_000;
  
  export function getCached<T>(key: string): T | undefined {
    return cache.get(key)?.data as T | undefined;
  }
  
  export function isStale(key: string, ttlMs: number = DEFAULT_TTL_MS): boolean {
    const entry = cache.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > ttlMs;
  }
  
  export function setCached<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
  }
  
  /** Call after a mutation (e.g. a new analysis just ran) to force the next read to hit the network. */
  export function invalidateCache(key: string): void {
    cache.delete(key);
  }
  
  /**
   * Fetches `fn()` and caches the result under `key`.
   *
   * - Fresh cache hit (within ttlMs): returns cached value immediately, no network call.
   * - Stale cache hit: returns the stale value immediately (so the UI paints instantly),
   *   then refetches in the background and calls `onRevalidate` once the fresh value lands.
   * - No cache: awaits the real fetch like a normal call.
   * - Concurrent calls for the same key are de-duped into a single in-flight request.
   */
  export async function fetchWithCache<T>(
    key: string,
    fn: () => Promise<T>,
    options: { ttlMs?: number; onRevalidate?: (data: T) => void } = {},
  ): Promise<T> {
    const { ttlMs = DEFAULT_TTL_MS, onRevalidate } = options;
    const cached = getCached<T>(key);
    const stale = isStale(key, ttlMs);
  
    if (cached !== undefined && !stale) {
      return cached;
    }
  
    let promise = inflight.get(key) as Promise<T> | undefined;
    if (!promise) {
      promise = fn()
        .then((data) => {
          setCached(key, data);
          inflight.delete(key);
          return data;
        })
        .catch((err) => {
          inflight.delete(key);
          throw err;
        });
      inflight.set(key, promise);
    }
  
    if (cached !== undefined && stale) {
      promise.then((fresh) => onRevalidate?.(fresh)).catch(() => {});
      return cached;
    }
  
    return promise;
  }