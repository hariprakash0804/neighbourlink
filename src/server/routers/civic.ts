import { router, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";

export const civicRouter = router({
  /**
   * Report a civic issue (pothole, garbage, streetlight, etc.)
   * Implementation: Phase 8
   */
  reportIssue: protectedProcedure
    .input(
      z.object({
        lat: z.number(),
        lng: z.number(),
        category: z.string().min(1),
        photoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Phase 8
      return { success: true, reportId: "stub-id" };
    }),

  /**
   * List civic reports near a location
   * Implementation: Phase 8
   */
  listNearby: publicProcedure
    .input(
      z.object({
        lat: z.number(),
        lng: z.number(),
        radius: z.number().min(500).max(10000).default(3000),
      })
    )
    .query(async ({ input }) => {
      // TODO: Phase 8
      return { reports: [], total: 0 };
    }),
});
