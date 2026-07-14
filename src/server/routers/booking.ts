import { router, protectedProcedure } from "../trpc";
import { z } from "zod";

export const bookingRouter = router({
  /**
   * Create a new booking request
   * Implementation: Phase 5
   */
  create: protectedProcedure
    .input(
      z.object({
        vendorId: z.string(),
        slotStart: z.string().datetime(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Phase 5
      return { success: true, bookingId: "stub-id" };
    }),

  /**
   * Update booking status (accept/decline/complete/cancel)
   * Implementation: Phase 5
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
        status: z.enum(["ACCEPTED", "DECLINED", "COMPLETED", "CANCELLED"]),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Phase 5
      return { success: true };
    }),

  /**
   * List bookings for a vendor
   * Implementation: Phase 5
   */
  listForVendor: protectedProcedure
    .input(z.object({ vendorId: z.string() }))
    .query(async ({ input }) => {
      // TODO: Phase 5
      return { bookings: [], total: 0 };
    }),

  /**
   * List bookings for a resident
   * Implementation: Phase 5
   */
  listForResident: protectedProcedure.query(async () => {
    // TODO: Phase 5
    return { bookings: [], total: 0 };
  }),
});
