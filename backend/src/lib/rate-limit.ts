import { getRedisClient, isRedisReady } from "./redis";

/**
 * Check if a specific key has exceeded the rate limit.
 *
 * @param key The Redis key to track (e.g. `rate:otp:+919876543210` or `rate:reveal:userId`)
 * @param limit The maximum number of requests allowed in the window
 * @param windowSecs The time window size in seconds
 * @returns Object indicating if the request is allowed and how many requests are remaining
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSecs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedisClient();
  const ready = await isRedisReady();

  // If Redis is not initialized or offline, gracefully fail open (allow requests)
  if (!redis || !ready) {
    console.warn(`⚠️ Redis offline. Rate limit for key "${key}" bypassed (fail-open).`);
    return { allowed: true, remaining: limit };
  }

  try {
    // Pipeline to increment and set expiration atomically
    const pipeline = redis.multi();
    pipeline.incr(key);
    pipeline.ttl(key);
    const results = await pipeline.exec();

    if (!results) {
      return { allowed: true, remaining: limit };
    }

    const count = results[0][1] as number;
    const ttl = results[1][1] as number;

    // Set TTL on first request in the window
    if (ttl === -1) {
      await redis.expire(key, windowSecs);
    }

    const remaining = Math.max(0, limit - count);
    const allowed = count <= limit;

    return { allowed, remaining };
  } catch (err) {
    console.error(`❌ Redis rate-limit execution error for key "${key}":`, err);
    // Graceful fallback on error (fail-open)
    return { allowed: true, remaining: limit };
  }
}
