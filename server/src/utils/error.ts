// server/src/utils/error.ts
import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler =
  (fn: (...args: any[]) => Promise<any>): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

function codeForStatus(
  status: number
): "BAD_REQUEST" | "RATE_LIMITED" | "INTERNAL_SERVER_ERROR" {
  if (status === 400) return "BAD_REQUEST";
  if (status === 429) return "RATE_LIMITED";
  return "INTERNAL_SERVER_ERROR";
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // express-rate-limit sets status/statusCode and message
  const statusFromErr = (err as any).status || (err as any).statusCode;
  const msgFromErr = (err as any).message;

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "Invalid request/response payload",
      },
    });
  }

  if (err instanceof ApiError) {
    const status = err.status || 500;
    return res.status(status).json({
      error: {
        code: codeForStatus(status),
        message: err.message || "Request failed",
      },
    });
  }

  const status = typeof statusFromErr === "number" ? statusFromErr : 500;
  const code = codeForStatus(status);
  const message =
    status === 429
      ? msgFromErr || "Too many requests"
      : msgFromErr || "Something went wrong";

  return res.status(status).json({ error: { code, message } });
};
