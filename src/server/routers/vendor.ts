import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { VENDOR_CATEGORIES, Vendor, User } from "@/lib/models";
import { uploadFile } from "@/lib/storage";
import { TRPCError } from "@trpc/server";
import { indexVendors } from "@/lib/meilisearch";
import { containsProfanityOrSpam } from "@/lib/moderation";

export const vendorRouter = router({
  /**
   * Register as a vendor (multi-step form submission)
   * Implementation: Phase 4
   */
  register: protectedProcedure
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
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

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
        fileName: z.string(),
        fileType: z.string(),
        base64Data: z.string(), // base64 string
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
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
      const key = `${input.vendorId}-${Date.now()}-${input.fileName}`;

      // Upload file via storage helper
      const documentUrl = await uploadFile(key, buffer, input.fileType);

      // Update vendor document URL
      await Vendor.update({ idDocumentUrl: documentUrl }, { where: { id: input.vendorId } });

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
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

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

      return { success: true };
    }),

  /**
   * Get logged-in vendor's own profile details
   */
  getOwnProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.userId;
    const vendor = await Vendor.findOne({ where: { userId } });
    if (!vendor) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Vendor profile not found for this user.",
      });
    }
    return {
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
  }),
});

