import { router, protectedProcedure } from "../trpc";
import { z } from "zod";

export const chatRouter = router({
  /**
   * Send a chat message (also mirrored over Socket.io for realtime)
   * Implementation: Phase 5
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        recipientId: z.string(),
        content: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Phase 5 — save message + emit via Socket.io
      return { success: true, messageId: "stub-id" };
    }),
});
