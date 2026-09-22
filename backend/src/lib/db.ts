import { Sequelize } from "sequelize";
import mysql2 from "mysql2";

const isProduction = process.env.NODE_ENV === "production";
const dbHost = process.env.DB_HOST || "localhost";

// Automatically enable SSL for cloud providers (TiDB Cloud, AWS RDS, Aiven, etc.) or when DB_SSL=true
const useSsl =
  process.env.DB_SSL === "true" ||
  dbHost.includes("tidbcloud.com") ||
  dbHost.includes("aivencloud.com") ||
  dbHost.includes("rds.amazonaws.com") ||
  dbHost.includes("neon.tech");

const sequelize = new Sequelize(
  process.env.DB_NAME || "neighborlink",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "password",
  {
    host: dbHost,
    port: parseInt(process.env.DB_PORT || "3306", 10),
    dialect: "mysql",
    dialectModule: mysql2,
    dialectOptions: useSsl
      ? {
          ssl: {
            minVersion: "TLSv1.2",
            rejectUnauthorized:
              process.env.DB_SSL_REJECT_UNAUTHORIZED === "false" ? false : true,
          },
        }
      : undefined,
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: isProduction ? 10 : 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

/**
 * Sync all models — creates tables if they don't exist.
 * In development, `alter: true` adds new columns without dropping data.
 * In production, use migrations instead.
 */
let syncPromise: Promise<void> | null = null;

export async function ensureDbSync() {
  if (!syncPromise) {
    syncPromise = (async () => {
      try {
        console.log("ℹ️ Connecting to DB at", dbHost);
        // Import models to ensure they're registered before sync
        await import("./models.js");
        await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
        console.log("✅ Database synced successfully");

        // Seed sample data if table is empty (dev only)
        if (process.env.NODE_ENV !== "production") {
          try {
            const { seedEssentialServices } = await import("./seed.js");
            await seedEssentialServices();
          } catch (seedErr) {
            console.warn("⚠️ Seed failed or skipped:", seedErr);
          }
        }

        // Initialize BullMQ review queue (non-blocking)
        try {
          const { initReviewQueue } = await import("./queue.js");
          initReviewQueue();
        } catch (queueErr) {
          console.warn("⚠️ BullMQ queue initialization skipped:", queueErr);
        }
      } catch (error) {
        console.error("❌ Database sync failed:", error);
        syncPromise = null; // Allow retry on failure
        throw error;
      }
    })();
  }
  return syncPromise;
}

export default sequelize;
