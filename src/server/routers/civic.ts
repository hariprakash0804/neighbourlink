import { router, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { CivicReport, User } from "@/lib/models";
import { TRPCError } from "@trpc/server";
import { haversineDistance } from "@/lib/utils";
import { Op } from "sequelize";
import { containsProfanityOrSpam } from "@/lib/moderation";

export const civicRouter = router({
  /**
   * Report a civic issue (pothole, garbage, streetlight, etc.)
   * Implementation: Phase 8
   */
  reportIssue: protectedProcedure
    .input(
      z.object({
        lat: z.number(),
        lng: z.number(),
        category: z.string().min(1),
        description: z.string().min(5).max(1000).optional(),
        photoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      if (input.description && containsProfanityOrSpam(input.description)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your description was flagged by our safety filters. Please revise the content.",
        });
      }

      const report = await CivicReport.create({
        userId,
        lat: input.lat,
        lng: input.lng,
        category: input.category,
        description: input.description || null,
        photoUrl: input.photoUrl || null,
        status: "OPEN",
      });

      return { success: true, reportId: report.id };
    }),

  /**
   * List civic reports near a location
   * Implementation: Phase 8
   */
  listNearby: publicProcedure
    .input(
      z.object({
        lat: z.number(),
        lng: z.number(),
        radius: z.number().min(500).max(10000).default(3000),
      })
    )
    .query(async ({ input }) => {
      // Get all reports, then filter by distance in memory
      const allReports = await CivicReport.findAll({
        include: [
          {
            model: User,
            as: "reporter",
            attributes: ["id", "name"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: 200,
      });

      const nearbyReports = allReports
        .map((r) => {
          const dist = haversineDistance(input.lat, input.lng, r.lat, r.lng);
          return {
            id: r.id,
            userId: r.userId,
            lat: r.lat,
            lng: r.lng,
            category: r.category,
            description: (r as any).description || null,
            photoUrl: r.photoUrl,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
            reporterName: r.reporter?.name || "Resident",
            distanceM: Math.round(dist),
          };
        })
        .filter((r) => r.distanceM <= input.radius)
        .sort((a, b) => a.distanceM - b.distanceM);

      return { reports: nearbyReports, total: nearbyReports.length };
    }),

  /**
   * Update civic report status (admin or reporter)
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        reportId: z.string(),
        status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
      })
    )
    .mutation(async ({ input }) => {
      const report = await CivicReport.findByPk(input.reportId);
      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Civic report not found" });
      }

      await report.update({ status: input.status });
      return { success: true };
    }),
});
