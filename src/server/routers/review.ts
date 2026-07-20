import { router, protectedProcedure, publicProcedure, rateLimitedProcedure } from "../trpc";
import { z } from "zod";
import { Review, Vendor, User } from "@/lib/models";
import { TRPCError } from "@trpc/server";
import { enqueueRatingRecompute } from "@/lib/queue";
import { containsProfanityOrSpam } from "@/lib/moderation";
import { createNotification } from "./notifications";
import { invalidateVendorCache } from "@/lib/cache";

export const reviewRouter = router({
  /**
   * Create a review for a vendor
   * Implementation: Phase 6
   */
  create: rateLimitedProcedure("review:create", 5, 3600)
    .input(
      z.object({
        vendorId: z.string(),
        rating: z.number().min(1).max(5),
        comment: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;

      // 1. Validate vendor exists
      const vendor = await Vendor.findByPk(input.vendorId);
      if (!vendor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vendor not found.",
        });
      }

      // 2. Prevent self-reviews (vendor reviewing themselves)
      if (vendor.userId === userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot review your own business.",
        });
      }

      // 3. Prevent duplicate reviews (one per user-vendor pair)
      const existing = await Review.findOne({
        where: { vendorId: input.vendorId, userId },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already reviewed this vendor. You can only leave one review per vendor.",
        });
      }

      // 3.5 Content Moderation: Profanity/Spam filter
      if (input.comment && containsProfanityOrSpam(input.comment)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your comment was flagged by our safety filters for containing inappropriate content or spam.",
        });
      }

      // 4. Create the review
      const review = await Review.create({
        vendorId: input.vendorId,
        userId,
        rating: input.rating,
        comment: input.comment || null,
      });

      // 5. Enqueue rating recomputation + badge tier check (BullMQ or sync fallback)
      await enqueueRatingRecompute(input.vendorId);

      // 6. Fetch reviewer name for the response
      const user = await User.findByPk(userId, { attributes: ["name"] });

      // 7. Notify the vendor about the new review
      await createNotification({
        userId: vendor.userId,
        type: "NEW_REVIEW",
        title: "New Review Received",
        body: `${user?.name || "A resident"} left a ${input.rating}-star review${input.comment ? " with a comment" : ""}.`,
        metadata: { reviewId: review.id, vendorId: input.vendorId, rating: input.rating },
      });

      await invalidateVendorCache(input.vendorId, vendor.userId);

      return {
        success: true,
        review: {
          id: review.id,
          vendorId: review.vendorId,
          userId: review.userId,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt.toISOString(),
          userName: user?.name || "Anonymous",
        },
      };
    }),

  /**
   * List reviews for a vendor (paginated)
   * Implementation: Phase 6
   */
  listForVendor: publicProcedure
    .input(
      z.object({
        vendorId: z.string(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const { vendorId, page, limit } = input;
      const offset = (page - 1) * limit;

      const { count, rows } = await Review.findAndCountAll({
        where: { vendorId },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

      return {
        reviews: rows.map((r) => ({
          id: r.id,
          vendorId: r.vendorId,
          userId: r.userId,
          rating: r.rating,
          comment: r.comment,
          reply: r.reply,
          replyCreatedAt: r.replyCreatedAt ? r.replyCreatedAt.toISOString() : null,
          createdAt: r.createdAt.toISOString(),
          userName: r.user?.name || "Anonymous",
        })),
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
      };
    }),

  /**
   * Reply to a review (for vendors replying to their reviews)
   */
  reply: rateLimitedProcedure("review:reply", 10, 3600)
    .input(
      z.object({
        reviewId: z.string(),
        reply: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;

      // 1. Fetch review
      const review = await Review.findByPk(input.reviewId, {
        include: [{ model: Vendor, as: "vendor" }],
      });
      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found.",
        });
      }

      // 2. Verify that the current user owns the vendor profile
      const vendor = review.vendor;
      if (!vendor || vendor.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only reply to reviews written for your own business.",
        });
      }

      // 3. Content moderation: Profanity/Spam filter
      if (containsProfanityOrSpam(input.reply)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your reply was flagged by our safety filters for containing inappropriate content or spam.",
        });
      }

      // 4. Update the review with vendor reply
      await review.update({
        reply: input.reply,
        replyCreatedAt: new Date(),
      });

      // 5. Notify the resident who wrote the review
      await createNotification({
        userId: review.userId,
        type: "SYSTEM_ALERT",
        title: "Vendor Replied to Your Review",
        body: `${vendor.businessName} has responded to your review.`,
        metadata: { reviewId: review.id, vendorId: vendor.id },
      });

      return { success: true };
    }),
});
