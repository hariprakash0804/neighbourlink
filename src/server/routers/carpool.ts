import { router, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { Carpool, User } from "@/lib/models";
import { TRPCError } from "@trpc/server";
import { haversineDistance } from "@/lib/utils";
import { containsProfanityOrSpam } from "@/lib/moderation";

export const carpoolRouter = router({
  /**
   * Create a carpool ride offer
   */
  create: protectedProcedure
    .input(
      z.object({
        origin: z.string().min(3).max(255),
        destination: z.string().min(3).max(255),
        departureTime: z.string(), // ISO date string
        seatsAvailable: z.number().min(1).max(20),
        pricePerSeat: z.number().min(0).default(0),
        lat: z.number(),
        lng: z.number(),
        notes: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      if (
        containsProfanityOrSpam(input.origin) ||
        containsProfanityOrSpam(input.destination) ||
        (input.notes && containsProfanityOrSpam(input.notes))
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your carpool posting was flagged by our safety filters. Please revise the content.",
        });
      }

      const carpool = await Carpool.create({
        userId,
        origin: input.origin,
        destination: input.destination,
        departureTime: new Date(input.departureTime),
        seatsAvailable: input.seatsAvailable,
        pricePerSeat: input.pricePerSeat,
        lat: input.lat,
        lng: input.lng,
        notes: input.notes || null,
      });

      return { success: true, carpoolId: carpool.id };
    }),

  /**
   * List carpools near a specific location
   */
  listNearby: publicProcedure
    .input(
      z.object({
        lat: z.number(),
        lng: z.number(),
        radius: z.number().min(500).max(20000).default(5000), // in meters
      })
    )
    .query(async ({ input }) => {
      // Find all rides that are scheduled for the future
      const allCarpools = await Carpool.findAll({
        include: [
          { model: User, as: "driver", attributes: ["id", "name", "phone"] },
        ],
        order: [["departureTime", "ASC"]],
      });

      const nearbyCarpools = allCarpools
        .map((c) => {
          const dist = haversineDistance(input.lat, input.lng, c.lat, c.lng);
          return {
            id: c.id,
            userId: c.userId,
            origin: c.origin,
            destination: c.destination,
            departureTime: c.departureTime.toISOString(),
            seatsAvailable: c.seatsAvailable,
            pricePerSeat: c.pricePerSeat,
            lat: c.lat,
            lng: c.lng,
            notes: c.notes,
            createdAt: c.createdAt.toISOString(),
            driverName: c.driver?.name || "Driver",
            driverPhone: c.driver?.phone || "",
            distanceM: Math.round(dist),
          };
        })
        .filter((c) => c.distanceM <= input.radius && new Date(c.departureTime) >= new Date())
        .sort((a, b) => a.distanceM - b.distanceM);

      return { carpools: nearbyCarpools, total: nearbyCarpools.length };
    }),

  /**
   * Delete a carpool offer
   */
  delete: protectedProcedure
    .input(z.object({ carpoolId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const carpool = await Carpool.findByPk(input.carpoolId);
      if (!carpool) throw new TRPCError({ code: "NOT_FOUND" });
      if (carpool.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own carpool offers.",
        });
      }

      await carpool.destroy();
      return { success: true };
    }),
});
