import { router, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { JobPost, User, JOB_CATEGORIES } from "@/lib/models";
import { TRPCError } from "@trpc/server";
import { haversineDistance } from "@/lib/utils";
import { containsProfanityOrSpam } from "@/lib/moderation";

export const jobsRouter = router({
  /**
   * Post a local job vacancy
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(255),
        description: z.string().min(5).max(5000),
        category: z.enum(JOB_CATEGORIES as unknown as [string, ...string[]]),
        compensation: z.number().min(0),
        lat: z.number(),
        lng: z.number(),
        phone: z.string().min(10).max(20),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;

      if (
        containsProfanityOrSpam(input.title) ||
        containsProfanityOrSpam(input.description)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your job posting was flagged by our safety filters. Please revise the content.",
        });
      }

      const job = await JobPost.create({
        userId,
        title: input.title,
        description: input.description,
        category: input.category as any,
        compensation: input.compensation,
        lat: input.lat,
        lng: input.lng,
        phone: input.phone,
      });

      return { success: true, jobId: job.id };
    }),

  /**
   * List local job posts near a specific location
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
      const allJobs = await JobPost.findAll({
        include: [
          { model: User, as: "poster", attributes: ["id", "name"] },
        ],
        order: [["createdAt", "DESC"]],
      });

      const nearbyJobs = allJobs
        .map((j) => {
          const dist = haversineDistance(input.lat, input.lng, j.lat, j.lng);
          return {
            id: j.id,
            userId: j.userId,
            title: j.title,
            description: j.description,
            category: j.category,
            compensation: j.compensation,
            lat: j.lat,
            lng: j.lng,
            phone: j.phone,
            createdAt: j.createdAt.toISOString(),
            posterName: j.poster?.name || "Resident",
            distanceM: Math.round(dist),
          };
        })
        .filter((j) => j.distanceM <= input.radius)
        .sort((a, b) => a.distanceM - b.distanceM);

      return { jobs: nearbyJobs, total: nearbyJobs.length };
    }),

  /**
   * Delete a job post
   */
  delete: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;

      const job = await JobPost.findByPk(input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own job posts.",
        });
      }

      await job.destroy();
      return { success: true };
    }),
});
