import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { Notification } from "@/lib/models";
import { TRPCError } from "@trpc/server";

export const notificationsRouter = router({
  /**
   * List notifications for the current user (paginated, newest first)
   */
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.userId;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const offset = (input.page - 1) * input.limit;
      const { rows, count } = await Notification.findAndCountAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        limit: input.limit,
        offset,
      });

      return {
        notifications: rows.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          read: n.read,
          metadata: n.metadata as any,
          createdAt: n.createdAt.toISOString(),
        })),
        total: count,
        page: input.page,
        totalPages: Math.ceil(count / input.limit),
      };
    }),

  /**
   * Get unread notification count
   */
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.userId;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    const count = await Notification.count({
      where: { userId, read: false },
    });

    return { count };
  }),

  /**
   * Mark a single notification as read
   */
  markRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const notification = await Notification.findOne({
        where: { id: input.notificationId, userId },
      });

      if (!notification) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Notification not found" });
      }

      await notification.update({ read: true });
      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.userId;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    await Notification.update(
      { read: true },
      { where: { userId, read: false } }
    );

    return { success: true };
  }),
});

// ─── Helper: Create Notification ──────────────────────────────────────────────
/**
 * Utility to create a notification for a user.
 * Can be called from any router.
 */
export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata?: object;
}) {
  try {
    await Notification.create({
      userId: params.userId,
      type: params.type as any,
      title: params.title,
      body: params.body,
      metadata: params.metadata || null,
      read: false,
    });
  } catch (err) {
    console.error("⚠️ Failed to create notification:", err);
  }
}
