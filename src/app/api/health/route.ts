import { NextResponse } from "next/server";
import sequelize from "@/lib/db";
import { getRedisClient, isRedisReady } from "@/lib/redis";
import { getMeiliClient } from "@/lib/meilisearch";

export async function GET() {
  const status: Record<string, any> = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: "unknown",
      redis: "unknown",
      meilisearch: "unknown",
    },
  };

  let hasError = false;

  // 1. Check MySQL connection
  try {
    await sequelize.authenticate();
    status.services.database = "healthy";
  } catch (dbErr: any) {
    status.services.database = `unhealthy: ${dbErr.message || dbErr}`;
    status.status = "unhealthy";
    hasError = true;
  }

  // 2. Check Redis connection
  try {
    const redis = getRedisClient();
    const ready = await isRedisReady();
    if (redis && ready) {
      status.services.redis = "healthy";
    } else {
      status.services.redis = "unhealthy: connection not ready";
      status.status = "unhealthy";
      hasError = true;
    }
  } catch (redisErr: any) {
    status.services.redis = `unhealthy: ${redisErr.message || redisErr}`;
    status.status = "unhealthy";
    hasError = true;
  }

  // 3. Check Meilisearch connection
  try {
    const meili = getMeiliClient();
    if (meili) {
      const healthy = await meili.isHealthy();
      if (healthy) {
        status.services.meilisearch = "healthy";
      } else {
        status.services.meilisearch = "unhealthy: isHealthy returned false";
        status.status = "unhealthy";
        hasError = true;
      }
    } else {
      status.services.meilisearch = "unhealthy: client not configured";
      status.status = "unhealthy";
      hasError = true;
    }
  } catch (meiliErr: any) {
    status.services.meilisearch = `unhealthy: ${meiliErr.message || meiliErr}`;
    status.status = "unhealthy";
    hasError = true;
  }

  return NextResponse.json(status, {
    status: hasError ? 503 : 200,
  });
}
