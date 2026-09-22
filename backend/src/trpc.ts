import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import jwt from "jsonwebtoken";
import sequelize, { ensureDbSync } from "./lib/db.js";
import { checkRateLimit } from "./lib/rate-limit.js";
import { logger } from "./lib/logger.js";

// ─── JWT Configuration ──────────────────────────────────────────────────────
const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.AUTH_SECRET ||
  "fallback_dev_jwt_secret_32_chars_long_!!";

if (
  process.env.NODE_ENV === "production" &&
  (!process.env.JWT_SECRET && !process.env.AUTH_SECRET)
) {
  throw new Error(
    "❌ FATAL: JWT_SECRET or AUTH_SECRET must be set in production. " +
      "Generate one with: openssl rand -base64 32"
  );
}

export interface JwtPayload {
  userId: string;
  email: string;
  phone?: string | null;
  role: string;
  name?: string | null;
}

export function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Context — available in every tRPC procedure.
 * Extracts JWT from Authorization header instead of NextAuth session.
 */
export async function createContext({ req }: CreateFastifyContextOptions) {
  // Ensure DB tables exist (no-op after first call)
  await ensureDbSync();

  let session: JwtPayload | null = null;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    session = verifyJwt(token);
  }

  return {
    db: sequelize,
    session,
    headers: req.headers,
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
