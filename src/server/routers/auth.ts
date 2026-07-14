import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { sendOtp as sendOtpService } from "@/lib/otp";
import { checkRateLimit } from "@/lib/rate-limit";
import { TRPCError } from "@trpc/server";

export const authRouter = router({
  /**
   * Send OTP to phone number
   * This doesn't go through NextAuth — it's a pre-auth step
   */
  sendOtp: publicProcedure
    .input(
      z.object({
        phone: z
          .string()
          .min(10, "Phone number must be at least 10 digits")
          .max(15, "Phone number is too long")
          .regex(/^\+?[0-9]+$/, "Invalid phone number format"),
      })
    )
    .mutation(async ({ input }) => {
      // Normalize phone: ensure it starts with country code
      let phone = input.phone.replace(/\D/g, "");
      if (phone.length === 10) {
        phone = `+91${phone}`;
      } else if (!phone.startsWith("+")) {
        phone = `+${phone}`;
      }

      // Apply rate limit: 3 requests per phone per minute (60 seconds)
      const rateLimitKey = `rate:otp:${phone}`;
      const limitResult = await checkRateLimit(rateLimitKey, 3, 60);
      if (!limitResult.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many OTP requests. Please wait one minute before requesting again.",
        });
      }

      const result = await sendOtpService(phone);
      return result;
    }),
});
