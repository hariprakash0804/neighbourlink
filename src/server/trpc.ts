import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { auth } from "@/auth";
import sequelize, { ensureDbSync } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Context — available in every tRPC procedure
 */
export async function createContext(opts?: FetchCreateContextFnOptions) {
  // Ensure DB tables exist (no-op after first call)
  await ensureDbSync();

  const session = await auth();

  return {
    db: sequelize,
    session: session?.user
      ? {
          userId: session.user.id,
          phone: session.user.phone,
          role: session.user.role,
          name: session.user.name,
        }
      : null,
    headers: opts?.req?.headers,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

/**
 * tRPC initialization
 */
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error ? error.cause.message : null,
      },
    };
  },
});

/**
 * Router and procedure exports
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure — requires authenticated session
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

/**
 * Admin procedure — requires ADMIN role
 */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }
  if (ctx.session.role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only admins can perform this action",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

/**
 * Rate-limited protected procedure factory.
 *
 * Creates a procedure that requires authentication AND enforces per-user
 * rate limiting using the Redis-backed rate limiter.
 *
 * @param keyPrefix - Unique prefix for the rate limit key (e.g., "chat:send")
 * @param limit - Max requests allowed in the window
 * @param windowSecs - Time window in seconds
 *
 * @example
 * ```ts
 * // Max 30 messages per minute per user
 * rateLimitedProcedure("chat:send", 30, 60)
 *   .input(z.object({ ... }))
 *   .mutation(async ({ input, ctx }) => { ... });
 * ```
 */
export function rateLimitedProcedure(keyPrefix: string, limit: number, windowSecs: number) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    const rateLimitKey = `rate:${keyPrefix}:${ctx.session.userId}`;
    const result = await checkRateLimit(rateLimitKey, limit, windowSecs);

    if (!result.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Please wait before trying again. (${result.remaining} remaining)`,
      });
    }

    return next({ ctx });
  });
}

