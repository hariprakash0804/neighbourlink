import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { auth } from "@/auth";
import sequelize, { ensureDbSync } from "@/lib/db";

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
