/**
 * Redis Caching Layer Helper
 * Graceful fallback: If Redis is unavailable, acts as a no-op / cache-miss provider.
 */

import { getRedisClient, isRedisReady } from "./redis";

export const CACHE_TTLS = {
  VENDOR_PROFILE: 5 * 60,       // 5 minutes
  ESSENTIAL_SERVICES: 60 * 60,  // 1 hour
  SEARCH_RESULTS: 2 * 60,       // 2 minutes
};

/**
 * Get item from cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  const ready = await isRedisReady();
  if (!redis || !ready) return null;

  try {
    const data = await redis.get(key);
    if (!data) return null;
    
    console.log(`⚡ Cache HIT: key="${key}"`);
    return JSON.parse(data) as T;
  } catch (err) {
    console.warn(`⚠️ Cache read error for key="${key}":`, err);
    return null;
  }
}

/**
 * Save item to cache
 */
export async function setCache(key: string, value: any, ttlSeconds: number): Promise<void> {
  const redis = getRedisClient();
  const ready = await isRedisReady();
  if (!redis || !ready) return;

  try {
    const data = JSON.stringify(value);
    await redis.setex(key, ttlSeconds, data);
    console.log(`⚡ Cache SET: key="${key}" (TTL: ${ttlSeconds}s)`);
  } catch (err) {
    console.warn(`⚠️ Cache write error for key="${key}":`, err);
  }
}

/**
 * Invalidate specific key
 */
export async function deleteCache(key: string): Promise<void> {
  const redis = getRedisClient();
  const ready = await isRedisReady();
  if (!redis || !ready) return;

  try {
    await redis.del(key);
    console.log(`⚡ Cache DELETE: key="${key}"`);
  } catch (err) {
    console.warn(`⚠️ Cache delete error for key="${key}":`, err);
  }
}

/**
 * Invalidate all search cache entries
 */
export async function invalidateSearchCache(): Promise<void> {
  const redis = getRedisClient();
  const ready = await isRedisReady();
  if (!redis || !ready) return;

  try {
    const keys = await redis.keys("cache:search:*");
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`⚡ Cache INVALIDATE: cleared ${keys.length} search entries`);
    }
  } catch (err) {
    console.warn("⚠️ Cache search invalidation error:", err);
  }
}

/**
 * Invalidate a vendor's cached profiles and searches
 */
export async function invalidateVendorCache(vendorId: string, userId: string): Promise<void> {
  await deleteCache(`cache:vendor:id:${vendorId}`);
  await deleteCache(`cache:vendor:user:${userId}`);
  await invalidateSearchCache();
}
