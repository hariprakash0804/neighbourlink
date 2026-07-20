import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { Favorite, Vendor, User } from "@/lib/models";
import { TRPCError } from "@trpc/server";

export const favoritesRouter = router({
  /**
   * Toggle favorite status for a vendor (add if not exists, remove if exists)
   */
  toggle: protectedProcedure
    .input(z.object({ vendorId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;

      // Check if vendor exists
      const vendor = await Vendor.findByPk(input.vendorId);
      if (!vendor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vendor not found" });
      }

      // Check if already favorited
      const existing = await Favorite.findOne({
        where: { userId, vendorId: input.vendorId },
      });

      if (existing) {
        await existing.destroy();
        return { success: true, favorited: false };
      }

      await Favorite.create({ userId, vendorId: input.vendorId });
      return { success: true, favorited: true };
    }),

  /**
   * Check if a vendor is favorited by the current user
   */
  check: protectedProcedure
    .input(z.object({ vendorId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.userId;

      const existing = await Favorite.findOne({
        where: { userId, vendorId: input.vendorId },
      });

      return { favorited: !!existing };
    }),

  /**
   * List all favorited vendors for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.userId;

    const favorites = await Favorite.findAll({
      where: { userId },
      include: [
        {
          model: Vendor,
          as: "vendor",
          include: [
            { model: User, as: "user", attributes: ["phone", "name"] },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return {
      favorites: favorites
        .filter((f) => f.vendor) // only return if vendor still exists
        .map((f) => ({
          id: f.id,
          vendorId: f.vendorId,
          savedAt: f.createdAt.toISOString(),
          vendor: {
            id: f.vendor!.id,
            userId: f.vendor!.userId,
            category: f.vendor!.category,
            businessName: f.vendor!.businessName,
            description: f.vendor!.description,
            verificationTier: f.vendor!.verificationTier,
            ratingAvg: f.vendor!.ratingAvg,
            ratingCount: f.vendor!.ratingCount,
            phone: f.vendor!.user?.phone || null,
          },
        })),
      total: favorites.length,
    };
  }),
});
