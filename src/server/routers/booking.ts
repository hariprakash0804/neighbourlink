import { router, protectedProcedure, rateLimitedProcedure } from "../trpc";
import { z } from "zod";
import { Booking, Vendor, User } from "@/lib/models";
import { TRPCError } from "@trpc/server";
import { Op } from "sequelize";
import { createNotification } from "./notifications";

export const bookingRouter = router({
  /**
   * Create a new booking request
   * Implementation: Phase 5
   */
  create: rateLimitedProcedure("booking:create", 10, 60)
    .input(
      z.object({
        vendorId: z.string(),
        slotStart: z.string(), // ISO string
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const residentId = ctx.session.userId;

      // Check if vendor exists
      const vendor = await Vendor.findByPk(input.vendorId);
      if (!vendor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vendor profile not found" });
      }

      // Check if the requested slot overlaps with an already accepted job
      const slotStart = new Date(input.slotStart);
      const oneHourBefore = new Date(slotStart.getTime() - 59 * 60 * 1000);
      const oneHourAfter = new Date(slotStart.getTime() + 59 * 60 * 1000);

      const existingBooking = await Booking.findOne({
        where: {
          vendorId: input.vendorId,
          status: "ACCEPTED",
          slotStart: {
            [Op.between]: [oneHourBefore, oneHourAfter],
          },
        },
      });

      if (existingBooking) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This slot is already booked and unavailable. Please choose another time.",
        });
      }

      // Create booking
      const booking = await Booking.create({
        residentId,
        vendorId: input.vendorId,
        slotStart,
        notes: input.notes || null,
        status: "PENDING",
      });

      // Notify the vendor about the new booking (triggers email outbox)
      await createNotification({
        userId: vendor.userId,
        type: "BOOKING_UPDATE",
        title: "New Booking Request 📅",
        body: `A resident has requested a booking for ${new Date(input.slotStart).toLocaleDateString("en-IN", { dateStyle: "medium" })}.`,
        metadata: { bookingId: booking.id, vendorId: input.vendorId },
      });

      // Notify the resident confirming we received the request (triggers email outbox)
      await createNotification({
        userId: residentId,
        type: "BOOKING_UPDATE",
        title: "Booking Request Sent 📅",
        body: `Your service booking request for "${vendor.businessName}" has been submitted successfully for ${new Date(input.slotStart).toLocaleDateString("en-IN", { dateStyle: "medium" })}.`,
        metadata: { bookingId: booking.id, vendorId: input.vendorId },
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

      // Notify the relevant party about the status change
      const statusMessages: Record<string, string> = {
        ACCEPTED: "Your booking has been accepted!",
        DECLINED: "Your booking has been declined.",
        COMPLETED: "Your booking has been marked as completed.",
        CANCELLED: "A booking has been cancelled.",
      };

      // Notify the resident for vendor actions (accept/decline)
      if (input.status === "ACCEPTED" || input.status === "DECLINED") {
        await createNotification({
          userId: booking.residentId,
          type: "BOOKING_UPDATE",
          title: `Booking ${input.status.charAt(0) + input.status.slice(1).toLowerCase()} 📅`,
          body: statusMessages[input.status],
          metadata: { bookingId: booking.id },
        });
      } else if (input.status === "CANCELLED") {
        // Notify the vendor when cancelled by the resident
        const vendor = await Vendor.findByPk(booking.vendorId);
        if (vendor && vendor.userId !== userId) {
          await createNotification({
            userId: vendor.userId,
            type: "BOOKING_UPDATE",
            title: "Booking Cancelled ❌",
            body: `Your booking has been cancelled by the resident.`,
            metadata: { bookingId: booking.id },
          });
        }
      } else if (input.status === "COMPLETED") {
        // Notify the other party when marked completed
        const vendor = await Vendor.findByPk(booking.vendorId);
        if (vendor) {
          const isVendorActor = vendor.userId === userId;
          const targetUserId = isVendorActor ? booking.residentId : vendor.userId;
          const actorName = isVendorActor ? vendor.businessName : "The resident";

          await createNotification({
            userId: targetUserId,
            type: "BOOKING_UPDATE",
            title: "Booking Completed ✅",
            body: `${actorName} has marked your booking as completed.`,
            metadata: { bookingId: booking.id },
          });
        }
      }

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
