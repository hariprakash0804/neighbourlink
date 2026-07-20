import { router, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { BulletinPost, User, BULLETIN_CATEGORIES } from "@/lib/models";
import { TRPCError } from "@trpc/server";
import { containsProfanityOrSpam } from "@/lib/moderation";

export const bulletinRouter = router({
  /**
   * Create a bulletin post
   */
  create: protectedProcedure
    .input(
      z.object({
        category: z.enum(BULLETIN_CATEGORIES as unknown as [string, ...string[]]),
        title: z.string().min(3).max(255),
        content: z.string().min(5).max(5000),
        photoUrl: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        expiresAt: z.string().optional(), // ISO date string
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;

      // Content moderation
      if (containsProfanityOrSpam(input.title) || containsProfanityOrSpam(input.content)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your post was flagged by our safety filters. Please revise the content.",
        });
      }

      const post = await BulletinPost.create({
        userId,
        category: input.category as any,
        title: input.title,
        content: input.content,
        photoUrl: input.photoUrl || null,
        lat: input.lat || null,
        lng: input.lng || null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      });

      return { success: true, postId: post.id };
    }),

  /**
   * List bulletin posts (paginated, newest first)
   */
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
        category: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const where: any = {};
      if (input.category) where.category = input.category;

      const offset = (input.page - 1) * input.limit;
      const { rows, count } = await BulletinPost.findAndCountAll({
        where,
        include: [
          { model: User, as: "author", attributes: ["id", "name"] },
        ],
        order: [["createdAt", "DESC"]],
        limit: input.limit,
        offset,
      });

      return {
        posts: rows.map((p) => ({
          id: p.id,
          userId: p.userId,
          category: p.category,
          title: p.title,
          content: p.content,
          photoUrl: p.photoUrl,
          expiresAt: p.expiresAt?.toISOString() || null,
          createdAt: p.createdAt.toISOString(),
          authorName: p.author?.name || "Resident",
        })),
        total: count,
      };
    }),

  /**
   * Delete a bulletin post (author only)
   */
  delete: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;

      const post = await BulletinPost.findByPk(input.postId);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      if (post.userId !== userId) throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own posts." });

      await post.destroy();
      return { success: true };
    }),
});
