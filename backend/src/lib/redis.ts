/**
 * Redis Client — shared ioredis connection
 *
 * Used by BullMQ for background job processing and by rate-limiters.
 * Graceful fallback: if Redis is unavailable, exports null.
 * All consumers must check for null before use.
 */

import Redis from "ioredis";

let redisClient: Redis | null = null;

const rawRedisUrl = process.env.REDIS_URL?.trim();

// Check if valid URL and not an unfilled placeholder like redis://<managed_redis_url>
function isValidRedisUrl(urlStr?: string): boolean {
  if (!urlStr) return false;
  if (urlStr.includes("<") || urlStr.includes(">") || urlStr.includes("placeholder")) {
    return false;
  }
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === "redis:" || parsed.protocol === "rediss:";
  } catch {
    return false;
  }
}

if (isValidRedisUrl(rawRedisUrl)) {
  try {
    redisClient = new Redis(rawRedisUrl!, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 2000,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 3) {
          console.warn("⚠️ Redis connection failed after 3 retries. Running without Redis.");
          return null;
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
} else {
  if (rawRedisUrl) {
    console.warn("⚠️ REDIS_URL was provided but is not a valid Redis URL. Running without Redis.");
  } else {
    console.log("ℹ️ No REDIS_URL configured. Running without Redis cache/queues.");
  }
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
