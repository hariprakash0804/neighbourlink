import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { Booking, Vendor, User } from "@/lib/models";
import { TRPCError } from "@trpc/server";

export const bookingRouter = router({
  /**
   * Create a new booking request
   * Implementation: Phase 5
   */
  create: protectedProcedure
    .input(
      z.object({
        vendorId: z.string(),
        slotStart: z.string(), // ISO string
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const residentId = ctx.session.userId;
      if (!residentId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Check if vendor exists
      const vendor = await Vendor.findByPk(input.vendorId);
      if (!vendor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vendor profile not found" });
      }

      // Create booking
      const booking = await Booking.create({
        residentId,
        vendorId: input.vendorId,
        slotStart: new Date(input.slotStart),
        notes: input.notes || null,
        status: "PENDING",
      });

      return { success: true, bookingId: booking.id };
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
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const booking = await Booking.findByPk(input.bookingId);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking record not found" });
      }

      // Authorization checks
      if (input.status === "ACCEPTED" || input.status === "DECLINED") {
        // Only the assigned vendor can accept or decline
        const vendor = await Vendor.findOne({ where: { userId, id: booking.vendorId } });
        if (!vendor) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the assigned vendor can accept or decline jobs.",
          });
        }
      } else if (input.status === "CANCELLED") {
        // Only the resident who created it can cancel
        if (booking.residentId !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only cancel your own booking requests.",
          });
        }
      } else if (input.status === "COMPLETED") {
        // Either the vendor or resident can mark it completed
        const vendor = await Vendor.findOne({ where: { userId, id: booking.vendorId } });
        const isResident = booking.residentId === userId;
        if (!vendor && !isResident) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized to update this booking.",
          });
        }
      }

      // Update status
      await booking.update({ status: input.status });

      return { success: true };
    }),

  /**
   * List bookings for a vendor (incoming jobs)
   * Implementation: Phase 5
   */
  listForVendor: protectedProcedure
    .input(z.object({ vendorId: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.userId;

      // Find vendor profile associated with the user
      const vendor = await Vendor.findOne({ where: { userId } });
      if (!vendor) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be registered as a vendor to view vendor bookings.",
        });
      }

      const targetVendorId = input.vendorId || vendor.id;

      // Verify that the user owns this vendor profile or is an admin
      if (vendor.id !== targetVendorId && ctx.session.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Unauthorized to view these bookings.",
        });
      }

      const bookings = await Booking.findAll({
        where: { vendorId: targetVendorId },
        include: [
          {
            model: User,
            as: "resident",
            attributes: ["id", "name", "phone", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      return {
        bookings: bookings.map((b) => ({
          id: b.id,
          residentId: b.residentId,
          vendorId: b.vendorId,
          status: b.status,
          slotStart: b.slotStart.toISOString(),
          notes: b.notes,
          createdAt: b.createdAt.toISOString(),
          resident: b.resident
            ? {
                id: b.resident.id,
                name: b.resident.name || "Resident",
                phone: b.resident.phone,
                email: b.resident.email,
              }
            : null,
        })),
        total: bookings.length,
      };
    }),

  /**
   * List bookings for a resident (my booking requests)
   * Implementation: Phase 5
   */
  listForResident: protectedProcedure.query(async ({ ctx }) => {
    const residentId = ctx.session.userId;
    if (!residentId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const bookings = await Booking.findAll({
      where: { residentId },
      include: [
        {
          model: Vendor,
          as: "vendor",
          attributes: ["id", "userId", "businessName", "category", "verificationTier"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return {
      bookings: bookings.map((b) => ({
        id: b.id,
        residentId: b.residentId,
        vendorId: b.vendorId,
        status: b.status,
        slotStart: b.slotStart.toISOString(),
        notes: b.notes,
        createdAt: b.createdAt.toISOString(),
        vendor: b.vendor
          ? {
              id: b.vendor.id,
              userId: b.vendor.userId,
              businessName: b.vendor.businessName,
              category: b.vendor.category,
              verificationTier: b.vendor.verificationTier,
            }
          : null,
      })),
      total: bookings.length,
    };
  }),
});
