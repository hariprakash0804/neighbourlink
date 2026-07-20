import { Sequelize } from "sequelize";
import mysql2 from "mysql2";

// Force trigger redeployment to Vercel
const sequelize = new Sequelize(
  process.env.DB_NAME || "neighborlink",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "password",
  {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    dialect: "mysql",
    dialectModule: mysql2,
    dialectOptions: process.env.DB_SSL === "true" ? {
      ssl: {
        rejectUnauthorized: true,
      }
    } : undefined,
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 10,
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
        // Import models to ensure they're registered before sync
        await import("@/lib/models");
        await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
        console.log("✅ Database synced successfully");

        // Seed sample data if table is empty
        const { seedEssentialServices } = await import("./seed");
        await seedEssentialServices();

        // Initialize BullMQ review queue (non-blocking)
        try {
          const { initReviewQueue } = await import("./queue");
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
