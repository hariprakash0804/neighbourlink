/**
 * BullMQ Queue & Worker — Background job processing
 *
 * Jobs:
 * - `recompute-vendor-rating`: Recomputes ratingAvg and ratingCount for a vendor.
 * - `check-badge-tier`: Promotes vendor to TOP_RATED if threshold met (20+ reviews, 4.5★+).
 *
 * Graceful fallback: If Redis is unavailable, exports a helper to run jobs synchronously.
 */

import { Queue, Worker, type Job } from "bullmq";
import { getRedisClient, isRedisReady } from "./redis";
import { Review, Vendor, AuditLog } from "./models";
import sequelize from "./db";

const QUEUE_NAME = "review-jobs";

// Badge tier thresholds
const TOP_RATED_MIN_REVIEWS = 20;
const TOP_RATED_MIN_AVG = 4.5;

let reviewQueue: Queue | null = null;
let reviewWorker: Worker | null = null;

/**
 * Initialize the BullMQ queue and worker.
 * Call this once at app startup (e.g., in ensureDbSync or a startup hook).
 */
export function initReviewQueue(): void {
  const redis = getRedisClient();
  if (!redis) {
    console.warn("⚠️ Redis not available. BullMQ queue will not be initialized. Jobs run synchronously.");
    return;
  }

  if (reviewQueue) return; // Already initialized

  try {
    reviewQueue = new Queue(QUEUE_NAME, {
      connection: redis as any,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      },
    });

    reviewWorker = new Worker(
      QUEUE_NAME,
      async (job: Job) => {
        switch (job.name) {
          case "recompute-vendor-rating":
            await processRecomputeRating(job.data.vendorId);
            break;
          case "check-badge-tier":
            await processCheckBadgeTier(job.data.vendorId);
            break;
          default:
            console.warn(`Unknown job name: ${job.name}`);
        }
      },
      { connection: redis as any, concurrency: 5 }
    );

    reviewWorker.on("completed", (job) => {
      console.log(`✅ Job ${job.name} completed for vendor ${job.data.vendorId}`);
    });

    reviewWorker.on("failed", (job, err) => {
      console.error(`❌ Job ${job?.name} failed for vendor ${job?.data.vendorId}:`, err.message);
    });

    console.log("✅ BullMQ review queue & worker initialized");
  } catch (err) {
    console.warn("⚠️ Failed to initialize BullMQ:", err);
    reviewQueue = null;
    reviewWorker = null;
  }
}

/**
 * Recompute ratingAvg and ratingCount for a vendor.
 */
async function processRecomputeRating(vendorId: string): Promise<void> {
  const result = await Review.findAll({
    where: { vendorId },
    attributes: [
      [sequelize.fn("AVG", sequelize.col("rating")), "avgRating"],
      [sequelize.fn("COUNT", sequelize.col("id")), "totalCount"],
    ],
    raw: true,
  });

  const row = result[0] as any;
  const ratingAvg = row?.avgRating ? parseFloat(Number(row.avgRating).toFixed(2)) : 0;
  const ratingCount = row?.totalCount ? parseInt(row.totalCount, 10) : 0;

  await Vendor.update({ ratingAvg, ratingCount }, { where: { id: vendorId } });

  console.log(`📊 Vendor ${vendorId}: ratingAvg=${ratingAvg}, ratingCount=${ratingCount}`);
}

/**
 * Check if a vendor qualifies for TOP_RATED badge tier.
 */
async function processCheckBadgeTier(vendorId: string): Promise<void> {
  const vendor = await Vendor.findByPk(vendorId);
  if (!vendor) return;

  // Only promote, never demote in this job
  if (vendor.verificationTier === "TOP_RATED") return;

  // Must already be ID_VERIFIED to be eligible for TOP_RATED
  if (vendor.verificationTier !== "ID_VERIFIED") return;

  if (vendor.ratingCount >= TOP_RATED_MIN_REVIEWS && vendor.ratingAvg >= TOP_RATED_MIN_AVG) {
    await vendor.update({ verificationTier: "TOP_RATED" });

    // Log the promotion
    await AuditLog.create({
      actorId: "SYSTEM",
      action: "BADGE_TIER_PROMOTION",
      targetId: vendorId,
      metadata: {
        previousTier: "ID_VERIFIED",
        newTier: "TOP_RATED",
        ratingAvg: vendor.ratingAvg,
        ratingCount: vendor.ratingCount,
      } as any,
    });

    console.log(`🏆 Vendor ${vendorId} promoted to TOP_RATED!`);
  }
}

/**
 * Enqueue a rating recomputation + badge tier check job.
 * Falls back to synchronous execution if BullMQ is not available.
 */
export async function enqueueRatingRecompute(vendorId: string): Promise<void> {
  const redisReady = await isRedisReady();

  if (reviewQueue && redisReady) {
    // Async via BullMQ
    await reviewQueue.add("recompute-vendor-rating", { vendorId });
    await reviewQueue.add("check-badge-tier", { vendorId }, { delay: 500 }); // Slight delay so rating is computed first
    console.log(`📤 Enqueued rating recompute + badge check for vendor ${vendorId}`);
  } else {
    // Synchronous fallback
    console.log(`⚡ Running synchronous rating recompute for vendor ${vendorId} (Redis unavailable)`);
    await processRecomputeRating(vendorId);
    await processCheckBadgeTier(vendorId);
  }
}
