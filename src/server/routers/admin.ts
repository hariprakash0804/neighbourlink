import { router, adminProcedure } from "../trpc";
import { z } from "zod";

export const adminRouter = router({
  /**
   * Approve a vendor (changes verification tier to ID_VERIFIED)
   * Implementation: Phase 7
   */
  verifyVendor: adminProcedure
    .input(z.object({ vendorId: z.string() }))
    .mutation(async ({ input }) => {
      // TODO: Phase 7 — update vendor tier, write audit log
      return { success: true };
    }),

  /**
   * Reject a vendor with a reason
   * Implementation: Phase 7
   */
  rejectVendor: adminProcedure
    .input(
      z.object({
        vendorId: z.string(),
        reason: z.string().min(10),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Phase 7 — notify vendor, write audit log
      return { success: true };
    }),

  /**
   * List audit log entries
   * Implementation: Phase 7
   */
  auditLogList: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      // TODO: Phase 7
      return { entries: [], total: 0 };
    }),
});
