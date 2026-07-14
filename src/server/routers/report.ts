import { router, protectedProcedure, adminProcedure } from "../trpc";
import { z } from "zod";

export const reportRouter = router({
  /**
   * Create a report (flag a vendor, user, or review)
   * Implementation: Phase 7
   */
  create: protectedProcedure
    .input(
      z.object({
        targetType: z.enum(["VENDOR", "USER", "REVIEW"]),
        targetId: z.string(),
        reason: z.string().min(10).max(1000),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Phase 7
      return { success: true, reportId: "stub-id" };
    }),

  /**
   * List open reports (admin only)
   * Implementation: Phase 7
   */
  listOpen: adminProcedure.query(async () => {
    // TODO: Phase 7
    return { reports: [], total: 0 };
  }),
});
