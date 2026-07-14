import { router, publicProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import { reverseGeocode as reverseGeocodeService, forwardGeocode } from "@/lib/geocoding";
import { Address } from "@/lib/models";

export const locationRouter = router({
  /**
   * Reverse geocode lat/lng to locality/pincode
   */
  reverseGeocode: publicProcedure
    .input(z.object({ lat: z.number(), lng: z.number() }))
    .query(async ({ input }) => {
      const result = await reverseGeocodeService(input.lat, input.lng);
      return result;
    }),

  /**
   * Forward geocode a pincode or locality name to coordinates
   */
  forwardGeocode: publicProcedure
    .input(z.object({ query: z.string().min(1).max(200) }))
    .query(async ({ input }) => {
      const result = await forwardGeocode(input.query);
      return result;
    }),

  /**
   * Save a named address for the current user
   */
  saveAddress: protectedProcedure
    .input(
      z.object({
        label: z.string().min(1, "Label is required").max(100),
        lat: z.number(),
        lng: z.number(),
        pincode: z.string().min(4).max(10),
        radiusMeters: z.number().min(500).max(5000).default(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already has an address with this label
      const existing = await Address.findOne({
        where: { userId: ctx.session.userId, label: input.label },
      });

      if (existing) {
        // Update existing
        await existing.update({
          lat: input.lat,
          lng: input.lng,
          pincode: input.pincode,
          radiusMeters: input.radiusMeters,
        });
        return { success: true, address: existing, isNew: false };
      }

      // Create new address
      const address = await Address.create({
        userId: ctx.session.userId,
        label: input.label,
        lat: input.lat,
        lng: input.lng,
        pincode: input.pincode,
        radiusMeters: input.radiusMeters,
      });

      return { success: true, address, isNew: true };
    }),

  /**
   * Get all saved addresses for the current user
   */
  getAddresses: protectedProcedure.query(async ({ ctx }) => {
    const addresses = await Address.findAll({
      where: { userId: ctx.session.userId },
      order: [["createdAt", "DESC"]],
    });
    return addresses.map((a) => ({
      id: a.id,
      label: a.label,
      lat: a.lat,
      lng: a.lng,
      pincode: a.pincode,
      radiusMeters: a.radiusMeters,
    }));
  }),

  /**
   * Delete an address
   */
  deleteAddress: protectedProcedure
    .input(z.object({ addressId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const address = await Address.findOne({
        where: { id: input.addressId, userId: ctx.session.userId },
      });

      if (!address) {
        return { success: false, message: "Address not found" };
      }

      await address.destroy();
      return { success: true, message: "Address deleted" };
    }),

  /**
   * Update the radius for an address
   */
  updateRadius: protectedProcedure
    .input(
      z.object({
        addressId: z.string(),
        radiusMeters: z.number().min(500).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const address = await Address.findOne({
        where: { id: input.addressId, userId: ctx.session.userId },
      });

      if (!address) {
        return { success: false, message: "Address not found" };
      }

      await address.update({ radiusMeters: input.radiusMeters });
      return { success: true, address };
    }),
});
