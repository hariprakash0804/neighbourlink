import { router, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";

export const reviewRouter = router({
  /**
   * Create a review for a vendor
   * Implementation: Phase 6
   */
  create: protectedProcedure
    .input(
      z.object({
        vendorId: z.string(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Phase 6
      return { success: true, reviewId: "stub-id" };
    }),

  /**
   * List reviews for a vendor
   * Implementation: Phase 6
   */
  listForVendor: publicProcedure
    .input(
      z.object({
        vendorId: z.string(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      // TODO: Phase 6
      return { reviews: [], total: 0 };
    }),
});
