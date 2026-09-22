import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context.js";
import { checkRateLimit } from "./lib/rate-limit.js";
import { logger } from "./lib/logger.js";

export type { Context };

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
 * Global Request/Response Logging Middleware
 */
const loggingMiddleware = t.middleware(async ({ path, type, next, ctx }) => {
  const start = Date.now();
  const actor = ctx.session
    ? `${ctx.session.role}:${ctx.session.userId}`
    : "anonymous";

  try {
    const result = await next();
    const duration = Date.now() - start;
    if (result.ok) {
      logger.info(`tRPC request: [${type}] ${path} - SUCCESS`, {
        actor,
        durationMs: duration,
      });
    } else {
      logger.error(`tRPC request: [${type}] ${path} - ERROR`, {
        actor,
        durationMs: duration,
        error: result.error.message,
        code: result.error.code,
      });
    }
    return result;
  } catch (error: any) {
    const duration = Date.now() - start;
    logger.error(`tRPC request: [${type}] ${path} - CRASH`, {
      actor,
      durationMs: duration,
      error: error.message || error,
    });
    throw error;
  }
});

/**
 * Router and procedure exports
 */
export const router = t.router;
export const publicProcedure = t.procedure.use(loggingMiddleware);

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
 */
export function rateLimitedProcedure(
  keyPrefix: string,
  limit: number,
  windowSecs: number
) {
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
