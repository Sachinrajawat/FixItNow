import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { logger } from "../config/logger";

/** 404 fallback. Mounted last in the route chain. */
export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl}`));
}

/** Central error converter. Always returns the standard ApiError envelope. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Zod validation errors -> 400 with field-level details
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request payload failed validation",
        requestId: req.id,
        details: err.flatten(),
      },
    });
    return;
  }

  // Known application errors
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.expose ? err.message : "Internal server error",
        requestId: req.id,
        details: err.details,
      },
    });
    return;
  }

  // Anything else
  const e = err as { message?: string; stack?: string };
  logger.error({ err: e, requestId: req.id }, "Unhandled error");

  res.status(500).json({
    error: {
      code: "INTERNAL",
      message: "Internal server error",
      requestId: req.id,
    },
  });
}
