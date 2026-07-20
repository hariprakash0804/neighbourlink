import { router, protectedProcedure, rateLimitedProcedure } from "../trpc";
import { z } from "zod";
import { VENDOR_CATEGORIES, Vendor, User, Booking, Review } from "@/lib/models";
import { uploadFile } from "@/lib/storage";
import { TRPCError } from "@trpc/server";
import { indexVendors } from "@/lib/meilisearch";
import { containsProfanityOrSpam } from "@/lib/moderation";
import { getCache, setCache, CACHE_TTLS, invalidateVendorCache, invalidateSearchCache } from "@/lib/cache";

// Allowed file types for vendor document uploads
const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

// Max file size: 5MB (base64 is ~33% larger than binary)
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil(MAX_FILE_SIZE_BYTES * 1.37); // base64 overhead

/**
 * Sanitize a filename to prevent path traversal and special character issues.
 * Strips directory separators, null bytes, and non-ASCII characters.
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[\x00-\x1f]/g, "")     // strip control characters
    .replace(/\.\./g, "")             // strip directory traversal
    .replace(/[\/\\]/g, "")           // strip path separators
    .replace(/[^a-zA-Z0-9._-]/g, "_") // replace unsafe chars with underscore
    .slice(0, 200);                    // limit length
}

export const vendorRouter = router({
  /**
   * Register as a vendor (multi-step form submission)
   * Implementation: Phase 4
   */
  register: rateLimitedProcedure("vendor:register", 3, 3600)
    .input(
      z.object({
        category: z.enum(VENDOR_CATEGORIES as unknown as [string, ...string[]]),
        businessName: z.string().min(2).max(255),
        description: z.string().optional(),
        lat: z.number(),
        lng: z.number(),
        serviceRadiusM: z.number().min(100).max(20000),
        priceInfo: z.record(z.string(), z.unknown()).optional(),
        workingHours: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;

      if (
        containsProfanityOrSpam(input.businessName) ||
        (input.description && containsProfanityOrSpam(input.description))
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your registration details were flagged by our safety filters. Please revise the content.",
        });
      }

      // Check if vendor already exists
      const existingVendor = await Vendor.findOne({ where: { userId } });
      if (existingVendor) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already registered as a vendor",
        });
      }

      // Upgrade user role to VENDOR
      await User.update({ role: "VENDOR" }, { where: { id: userId } });

      // Create vendor profile
      const vendor = await Vendor.create({
        userId,
        category: input.category as any,
        businessName: input.businessName,
        description: input.description || null,
        lat: input.lat,
        lng: input.lng,
        serviceRadiusM: input.serviceRadiusM,
        priceInfo: input.priceInfo || null,
        workingHours: input.workingHours || null,
        verificationTier: "UNVERIFIED",
        ratingAvg: 0,
        ratingCount: 0,
        responseTimeMin: null,
      });

      await invalidateSearchCache();
      return { success: true, vendorId: vendor.id };
    }),

  /**
   * Upload identity/business document to MinIO / FileSystem
   * Implementation: Phase 4
   */
  uploadDocument: protectedProcedure
    .input(
      z.object({
        vendorId: z.string(),
        fileName: z.string().max(255),
        fileType: z.string().max(50),
        base64Data: z.string().max(MAX_BASE64_LENGTH, {
          message: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;

      // Validate file type against allowlist
      if (!ALLOWED_FILE_TYPES.has(input.fileType.toLowerCase())) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unsupported file type: ${input.fileType}. Allowed types: JPEG, PNG, WebP, PDF.`,
        });
      }

      // Verify vendor ownership
      const vendor = await Vendor.findOne({ where: { id: input.vendorId, userId } });
      if (!vendor) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not own this vendor profile",
        });
      }

      // Convert base64 string back to binary buffer
      const buffer = Buffer.from(input.base64Data, "base64");

      // Double-check decoded size (in case base64 length check was bypassed)
      if (buffer.length > MAX_FILE_SIZE_BYTES) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
        });
      }

      // Sanitize filename to prevent path traversal
      const safeName = sanitizeFileName(input.fileName);
      const key = `${input.vendorId}-${Date.now()}-${safeName}`;

      // Upload file via storage helper
      const documentUrl = await uploadFile(key, buffer, input.fileType);

      // Update vendor document URL
      await Vendor.update({ idDocumentUrl: documentUrl }, { where: { id: input.vendorId } });

      await invalidateVendorCache(input.vendorId, userId);
      return { success: true, documentUrl };
    }),

  /**
   * Update vendor profile
   * Implementation: Phase 4
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        vendorId: z.string(),
        businessName: z.string().min(2).max(255).optional(),
        description: z.string().optional(),
        priceInfo: z.record(z.string(), z.unknown()).optional(),
        workingHours: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;

      if (
        (input.businessName && containsProfanityOrSpam(input.businessName)) ||
        (input.description && containsProfanityOrSpam(input.description))
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your profile details were flagged by our safety filters. Please revise the content.",
        });
      }

      // Verify vendor ownership
      const vendor = await Vendor.findOne({ where: { id: input.vendorId, userId } });
      if (!vendor) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not own this vendor profile",
        });
      }

      // Update fields
      const updates: any = {};
      if (input.businessName !== undefined) updates.businessName = input.businessName;
      if (input.description !== undefined) updates.description = input.description;
      if (input.priceInfo !== undefined) updates.priceInfo = input.priceInfo;
      if (input.workingHours !== undefined) updates.workingHours = input.workingHours;

      await Vendor.update(updates, { where: { id: input.vendorId } });

      // If the vendor is verified, update the Meilisearch index as well
      const updatedVendor = await Vendor.findByPk(input.vendorId);
      if (updatedVendor && updatedVendor.verificationTier !== "UNVERIFIED") {
        try {
          await indexVendors([
            {
              id: updatedVendor.id,
              businessName: updatedVendor.businessName,
              description: updatedVendor.description,
              category: updatedVendor.category,
              verificationTier: updatedVendor.verificationTier,
              ratingAvg: updatedVendor.ratingAvg,
              ratingCount: updatedVendor.ratingCount,
              _geo: {
                lat: updatedVendor.lat,
                lng: updatedVendor.lng,
              },
            },
          ]);
          console.log(`✅ Synced updated vendor ${updatedVendor.id} to Meilisearch`);
        } catch (meiliError) {
          console.error("⚠️ Failed to sync vendor updates to Meilisearch:", meiliError);
        }
      }

      await invalidateVendorCache(input.vendorId, userId);
      return { success: true };
    }),

  /**
   * Get logged-in vendor's own profile details
   */
  getOwnProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.userId;
    const cacheKey = `cache:vendor:user:${userId}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) return cached;

    const vendor = await Vendor.findOne({ where: { userId } });
    if (!vendor) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Vendor profile not found for this user.",
      });
    }

    const result = {
      id: vendor.id,
      userId: vendor.userId,
      category: vendor.category,
      businessName: vendor.businessName,
      description: vendor.description,
      lat: vendor.lat,
      lng: vendor.lng,
      serviceRadiusM: vendor.serviceRadiusM,
      priceInfo: vendor.priceInfo,
      workingHours: vendor.workingHours,
      verificationTier: vendor.verificationTier,
      idDocumentUrl: vendor.idDocumentUrl,
      ratingAvg: vendor.ratingAvg,
      ratingCount: vendor.ratingCount,
      responseTimeMin: vendor.responseTimeMin,
      createdAt: vendor.createdAt.toISOString(),
    };

    await setCache(cacheKey, result, CACHE_TTLS.VENDOR_PROFILE);
    return result;
  }),

  /**
   * Get vendor analytics metrics & trends
   */
  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.userId;
    const vendor = await Vendor.findOne({ where: { userId } });
    if (!vendor) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Vendor profile not found for this user.",
      });
    }

    // 1. Fetch bookings & reviews
    const bookings = await Booking.findAll({
      where: { vendorId: vendor.id },
      order: [["createdAt", "ASC"]],
    });

    const reviews = await Review.findAll({
      where: { vendorId: vendor.id },
      include: [{ model: User, as: "user", attributes: ["name"] }],
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    // 2. Compute status counts
    const statusCounts = {
      PENDING: 0,
      ACCEPTED: 0,
      DECLINED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    bookings.forEach((b) => {
      if (b.status in statusCounts) {
        statusCounts[b.status as keyof typeof statusCounts]++;
      }
    });

    // 3. Compute estimated revenue
    const price = vendor.priceInfo as any;
    const baseRate = price && typeof price.rate === "number" ? price.rate : 500;
    const estimatedRevenue = statusCounts.COMPLETED * baseRate;

    // 4. Compute 7-day bookings trend
    const last7Days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      last7Days[dateStr] = 0;
    }

    bookings.forEach((b) => {
      const dateStr = new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (dateStr in last7Days) {
        last7Days[dateStr]++;
      }
    });

    const weeklyTrend = Object.entries(last7Days).map(([date, count]) => ({
      date,
      count,
    }));

    return {
      metrics: {
        totalBookings: bookings.length,
        completedBookings: statusCounts.COMPLETED,
        pendingBookings: statusCounts.PENDING,
        estimatedRevenue,
        ratingAvg: vendor.ratingAvg,
        ratingCount: vendor.ratingCount,
      },
      statusCounts,
      weeklyTrend,
      recentReviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        userName: r.user?.name || "Anonymous",
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }),
});

