import { initTRPC, TRPCError } from "@trpc/server";

export interface JwtSession {
  userId: string;
  email: string;
  phone?: string | null;
  role: string;
  name?: string | null;
}

export interface Context {
  db: any;
  session: JwtSession | null;
  headers: Record<string, string | string[] | undefined>;
}

/**
 * tRPC initialization — pure definitions with zero runtime server dependencies
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
      if (process.env.NODE_ENV !== "production") {
        console.log(`[tRPC] [${type}] ${path} - SUCCESS (${duration}ms) - ${actor}`);
      }
    } else {
      console.error(`[tRPC] [${type}] ${path} - ERROR (${duration}ms) - ${actor}:`, result.error.message);
    }
    return result;
  } catch (error: any) {
    const duration = Date.now() - start;
    console.error(`[tRPC] [${type}] ${path} - CRASH (${duration}ms) - ${actor}:`, error.message || error);
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
 * Lazily loads rate-limiting to avoid static import chains.
 */
export function rateLimitedProcedure(
  keyPrefix: string,
  limit: number,
  windowSecs: number
) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    const { checkRateLimit } = await import("./lib/rate-limit.js");
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
