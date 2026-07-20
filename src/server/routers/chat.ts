import { router, protectedProcedure, rateLimitedProcedure } from "../trpc";
import { z } from "zod";
import { ChatMessage, User, Vendor } from "@/lib/models";
import { TRPCError } from "@trpc/server";
import { Op } from "sequelize";
import { containsProfanityOrSpam } from "@/lib/moderation";
import { createNotification } from "./notifications";

export const chatRouter = router({
  /**
   * Send a chat message (persists message in database)
   * Implementation: Phase 5
   */
  sendMessage: rateLimitedProcedure("chat:send", 30, 60)
    .input(
      z.object({
        recipientId: z.string(),
        content: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const senderId = ctx.session.userId;

      if (senderId === input.recipientId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot send messages to yourself.",
        });
      }

      // Content Moderation: Profanity/Spam filter
      if (containsProfanityOrSpam(input.content)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your message was flagged by our safety filters for containing inappropriate content or spam.",
        });
      }

      // Create message
      const msg = await ChatMessage.create({
        senderId,
        recipientId: input.recipientId,
        content: input.content,
        readAt: null,
      });

      // Notify the recipient
      const sender = await User.findByPk(senderId, { attributes: ["name"] });
      await createNotification({
        userId: input.recipientId,
        type: "NEW_MESSAGE",
        title: "New Message",
        body: `${sender?.name || "Someone"}: ${input.content.slice(0, 100)}${input.content.length > 100 ? "..." : ""}`,
        metadata: { senderId, messageId: msg.id },
      });

      return {
        success: true,
        message: {
          id: msg.id,
          senderId: msg.senderId,
          recipientId: msg.recipientId,
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
        },
      };
    }),

  /**
   * Get messages between current user and a recipient
   * Implementation: Phase 5
   */
  getConversation: protectedProcedure
    .input(z.object({ recipientId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.userId;

      const messages = await ChatMessage.findAll({
        where: {
          [Op.or]: [
            { senderId: userId, recipientId: input.recipientId },
            { senderId: input.recipientId, recipientId: userId },
          ],
        },
        order: [["createdAt", "ASC"]],
      });

      return {
        messages: messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          recipientId: m.recipientId,
          content: m.content,
          readAt: m.readAt ? m.readAt.toISOString() : null,
          createdAt: m.createdAt.toISOString(),
        })),
      };
    }),

  /**
   * List all conversation partners, last message preview, and unread counts
   * Implementation: Phase 5
   */
  listConversations: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.userId;

    // Find all messages involving user
    const messages = await ChatMessage.findAll({
      where: {
        [Op.or]: [{ senderId: userId }, { recipientId: userId }],
      },
      order: [["createdAt", "DESC"]],
    });

    // Group by other user ID
    const conversationMap = new Map<string, { lastMsg: ChatMessage; unreadCount: number }>();

    for (const msg of messages) {
      const otherId = msg.senderId === userId ? msg.recipientId : msg.senderId;

      if (!conversationMap.has(otherId)) {
        conversationMap.set(otherId, {
          lastMsg: msg,
          unreadCount: 0,
        });
      }

      // If the message is unread and sent by the other user, increment unread count
      if (msg.recipientId === userId && !msg.readAt) {
        const item = conversationMap.get(otherId)!;
        item.unreadCount += 1;
      }
    }

    const conversations = [];
    const otherUserIds = Array.from(conversationMap.keys());

    if (otherUserIds.length > 0) {
      // 1. Batch fetch all conversation partner User records
      const users = await User.findAll({
        where: { id: { [Op.in]: otherUserIds } },
        attributes: ["id", "name", "phone", "role"],
      });

      // 2. Identify vendor user IDs for batch fetching
      const vendorUserIds = users.filter((u) => u.role === "VENDOR").map((u) => u.id);
      
      let vendors: Vendor[] = [];
      if (vendorUserIds.length > 0) {
        vendors = await Vendor.findAll({
          where: { userId: { [Op.in]: vendorUserIds } },
          attributes: ["userId", "businessName"],
        });
      }

      // 3. Assemble response using in-memory mappings
      for (const [otherId, info] of conversationMap.entries()) {
        const user = users.find((u) => u.id === otherId);
        if (!user) continue;

        const vendor = vendors.find((v) => v.userId === otherId);
        const businessName = vendor?.businessName || null;

        conversations.push({
          user: {
            id: user.id,
            name: user.name || "User",
            phone: user.phone,
            role: user.role,
            businessName,
          },
          lastMessage: {
            content: info.lastMsg.content,
            createdAt: info.lastMsg.createdAt.toISOString(),
            senderId: info.lastMsg.senderId,
          },
          unreadCount: info.unreadCount,
        });
      }
    }

    return { conversations };
  }),

  /**
   * Mark all messages in a conversation as read
   * Implementation: Phase 5
   */
  markRead: protectedProcedure
    .input(z.object({ senderId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;

      await ChatMessage.update(
        { readAt: new Date() },
        {
          where: {
            senderId: input.senderId,
            recipientId: userId,
            readAt: null,
          },
        }
      );

      return { success: true };
    }),
});
