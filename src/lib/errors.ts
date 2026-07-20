import { TRPCError } from "@trpc/server";

export class NotFoundError extends TRPCError {
  constructor(message = "Resource not found") {
    super({
      code: "NOT_FOUND",
      message,
    });
  }
}

export class ForbiddenError extends TRPCError {
  constructor(message = "Action forbidden") {
    super({
      code: "FORBIDDEN",
      message,
    });
  }
}

export class UnauthorizedError extends TRPCError {
  constructor(message = "You must be authenticated") {
    super({
      code: "UNAUTHORIZED",
      message,
    });
  }
}

export class RateLimitError extends TRPCError {
  constructor(message = "Rate limit exceeded") {
    super({
      code: "TOO_MANY_REQUESTS",
      message,
    });
  }
}

export class ValidationError extends TRPCError {
  constructor(message = "Validation failed") {
    super({
      code: "BAD_REQUEST",
      message,
    });
  }
}
