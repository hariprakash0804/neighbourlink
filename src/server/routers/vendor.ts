import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { VENDOR_CATEGORIES } from "@/lib/models";

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
    .mutation(async ({ input }) => {
      // TODO: Phase 4 — create vendor profile
      return { success: true, vendorId: "stub-id" };
    }),

  /**
   * Upload identity/business document to MinIO
   * Implementation: Phase 4
   */
  uploadDocument: protectedProcedure
    .input(z.object({ vendorId: z.string() }))
    .mutation(async ({ input }) => {
      // TODO: Phase 4 — handle file upload to MinIO
      return { success: true, documentUrl: "stub-url" };
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
    .mutation(async ({ input }) => {
      // TODO: Phase 4 — update vendor record
      return { success: true };
    }),
});
