import { router, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { Deal, Vendor, User } from "@/lib/models";
import { TRPCError } from "@trpc/server";
import { Op } from "sequelize";

export const dealsRouter = router({
  /**
   * List all currently active deals
   */
  listActive: publicProcedure.query(async () => {
    const now = new Date();
    const deals = await Deal.findAll({
      where: {
        validUntil: {
          [Op.gt]: now,
        },
      },
      include: [
        {
          model: Vendor,
          as: "vendor",
          attributes: ["id", "businessName", "category", "verificationTier", "ratingAvg"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return {
      deals: deals.map((d) => ({
        id: d.id,
        vendorId: d.vendorId,
        title: d.title,
        description: d.description,
        discountPercent: d.discountPercent,
        validUntil: d.validUntil.toISOString(),
        createdAt: d.createdAt.toISOString(),
        vendor: d.vendor
          ? {
              id: d.vendor.id,
              businessName: d.vendor.businessName,
              category: d.vendor.category,
              verificationTier: d.vendor.verificationTier,
              ratingAvg: d.vendor.ratingAvg,
            }
          : null,
      })),
      total: deals.length,
    };
  }),

  /**
   * Create a new deal (vendors only)
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(2).max(100),
        description: z.string().min(5).max(1000),
        discountPercent: z.number().min(1).max(100),
        durationHours: z.number().min(1).max(168), // max 1 week
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;

      // Ensure user is a registered vendor
      const vendor = await Vendor.findOne({ where: { userId } });
      if (!vendor) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only registered vendors can create discount deals.",
        });
      }

      const validUntil = new Date();
      validUntil.setHours(validUntil.getHours() + input.durationHours);

      const deal = await Deal.create({
        vendorId: vendor.id,
        title: input.title,
        description: input.description,
        discountPercent: input.discountPercent,
        validUntil,
      });

      return {
        success: true,
        dealId: deal.id,
      };
    }),

  /**
   * Delete a deal
   */
  delete: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;

      const vendor = await Vendor.findOne({ where: { userId } });
      if (!vendor) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const deal = await Deal.findOne({
        where: { id: input.dealId, vendorId: vendor.id },
      });

      if (!deal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found or does not belong to you.",
        });
      }

      await deal.destroy();

      return { success: true };
    }),
});
