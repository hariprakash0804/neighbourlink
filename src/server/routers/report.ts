import { router, protectedProcedure, adminProcedure } from "../trpc";
import { z } from "zod";
import { Report, User, Review, AuditLog } from "@/lib/models";
import { TRPCError } from "@trpc/server";

export const reportRouter = router({
  /**
   * Create a report (flag a vendor, user, or review)
   * Implementation: Phase 7
   */
  create: protectedProcedure
    .input(
      z.object({
        targetType: z.enum(["VENDOR", "USER", "REVIEW"]),
        targetId: z.string(),
        reason: z.string().min(10).max(1000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const reporterId = ctx.session.userId;

      const report = await Report.create({
        reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        status: "OPEN",
      });

      return {
        success: true,
        reportId: report.id,
      };
    }),

  /**
   * List open reports (admin only)
   * Implementation: Phase 7
   */
  listOpen: adminProcedure.query(async () => {
    const reports = await Report.findAll({
      where: { status: "OPEN" },
      include: [
        {
          model: User,
          as: "reporter",
          attributes: ["id", "name", "phone"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return {
      reports: reports.map((r) => ({
        id: r.id,
        reporterId: r.reporterId,
        targetType: r.targetType,
        targetId: r.targetId,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        reporter: r.reporter
          ? {
              id: r.reporter.id,
              name: r.reporter.name || "Resident",
              phone: r.reporter.phone,
            }
          : null,
      })),
      total: reports.length,
    };
  }),

  /**
   * Resolve or dismiss an open report (admin only)
   * Implementation: Phase 7
   */
  resolveReport: adminProcedure
    .input(
      z.object({
        reportId: z.string(),
        action: z.enum(["RESOLVE", "DISMISS"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const actorId = ctx.session.userId;

      const report = await Report.findByPk(input.reportId);
      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Report not found" });
      }

      if (report.status !== "OPEN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Report is already resolved or dismissed.",
        });
      }

      // If action is RESOLVE and target is a review, delete the review
      if (input.action === "RESOLVE" && report.targetType === "REVIEW") {
        await Review.destroy({ where: { id: report.targetId } });
        console.log(`🗑️ Review ${report.targetId} deleted via moderation action`);
      }

      // Update report status
      const nextStatus = input.action === "RESOLVE" ? "RESOLVED" : "DISMISSED";
      await report.update({ status: nextStatus });

      // Audit Log
      await AuditLog.create({
        actorId,
        action: input.action === "RESOLVE" ? "RESOLVE_REPORT" : "DISMISS_REPORT",
        targetId: report.id,
        metadata: {
          targetType: report.targetType,
          targetId: report.targetId,
          reason: report.reason,
        } as any,
      });

      return { success: true };
    }),
});
