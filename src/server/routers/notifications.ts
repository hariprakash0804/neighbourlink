import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { Notification, User } from "@/lib/models";
import { TRPCError } from "@trpc/server";
import { sendNotificationEmail } from "@/lib/email";

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
      const notification = await Notification.findOne({
        where: { id: input.notificationId, userId },
      });

      if (!notification) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Notification not found" });
      }

      await notification.update({ read: true });
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.userId;
    await Notification.update(
      { read: true },
      { where: { userId, read: false } }
    );

    return { success: true };
  }),

  /**
   * Get notification preferences
   */
  getPrefs: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.userId;
    const user = await User.findByPk(userId);
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const defaultPrefs = { email: true, push: false, digest: "daily" };
    return {
      prefs: user.notificationPrefs
        ? { ...defaultPrefs, ...(user.notificationPrefs as any) }
        : defaultPrefs,
    };
  }),

  /**
   * Update notification preferences
   */
  updatePrefs: protectedProcedure
    .input(
      z.object({
        email: z.boolean(),
        push: z.boolean(),
        digest: z.enum(["none", "daily", "weekly"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;
      await User.update(
        { notificationPrefs: input },
        { where: { id: userId } }
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
    // 1. Persist notification in database
    await Notification.create({
      userId: params.userId,
      type: params.type as any,
      title: params.title,
      body: params.body,
      metadata: params.metadata || null,
      read: false,
    });

    // 2. Fetch User & send email if configured
    const user = await User.findByPk(params.userId);
    if (user && user.email) {
      const prefs = user.notificationPrefs as any;
      const emailEnabled = prefs ? prefs.email !== false : true; // default true

      if (emailEnabled) {
        // Run in background asynchronously (don't block the caller request)
        sendNotificationEmail(user.email, params.title, params.body).catch((emailErr) => {
          console.error("⚠️ Failed to send notification email:", emailErr);
        });
      }
    }
  } catch (err) {
    console.error("⚠️ Failed to create notification:", err);
  }
}
