/**
 * Redis Client — shared ioredis connection
 *
 * Used by BullMQ for background job processing and by rate-limiters.
 * Graceful fallback: if Redis is unavailable, exports null.
 * All consumers must check for null before use.
 */

import Redis from "ioredis";

let redisClient: Redis | null = null;

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

try {
  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: 2000, // Timeout connection attempts after 2 seconds
    retryStrategy(times) {
      if (times > 3) {
        console.warn("⚠️ Redis connection failed after 3 retries. Running without Redis.");
        return null; // Stop retrying
      }
      return Math.min(times * 200, 2000);
    },
  });

  redisClient.on("error", (err) => {
    if ((err as any).code === "ECONNREFUSED") {
      console.warn("⚠️ Redis not available (ECONNREFUSED). Background jobs will run synchronously.");
    }
  });

  redisClient.on("connect", () => {
    console.log("✅ Redis connected successfully");
  });
} catch (err) {
  console.warn("⚠️ Failed to initialize Redis client:", err);
  redisClient = null;
}

/**
 * Get the Redis client instance.
 * Returns null if Redis is not available.
 */
export function getRedisClient(): Redis | null {
  return redisClient;
}

/**
 * Check if Redis is connected and ready.
 */
export async function isRedisReady(): Promise<boolean> {
  if (!redisClient) return false;
  try {
    await redisClient.ping();
    return true;
  } catch {
    return false;
  }
}

export default redisClient;
