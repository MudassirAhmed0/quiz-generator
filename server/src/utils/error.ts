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

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // express-rate-limit provides status/code on the error
  const statusFromErr = (err as any).status || (err as any).statusCode;
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "ValidationError",
      message: "Invalid request/response payload",
      issues: err.issues,
    });
  }
  if (err instanceof ApiError) {
    return res
      .status(err.status)
      .json({ error: "ApiError", message: err.message, details: err.details });
  }
  const status = typeof statusFromErr === "number" ? statusFromErr : 500;
  return res.status(status).json({
    error: "InternalServerError",
    message: status === 429 ? "Too many requests" : "Something went wrong",
  });
};
