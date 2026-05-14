/**
 * Application-level error type with an HTTP status, a stable error code that
 * clients can branch on, and an optional `details` payload (e.g. Zod issues).
 *
 * Domain code throws AppError; the central error middleware converts any
 * caught AppError into the standard ApiError response envelope.
 */
export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly expose: boolean;

  constructor(opts: {
    status: number;
    code: string;
    message: string;
    details?: unknown;
    /** Whether the message is safe to send to the client. Defaults to true. */
    expose?: boolean;
  }) {
    super(opts.message);
    this.name = "AppError";
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
    this.expose = opts.expose ?? true;

    Error.captureStackTrace?.(this, AppError);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError({
      status: 400,
      code: "BAD_REQUEST",
      message,
      details,
    });
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError({ status: 401, code: "UNAUTHORIZED", message });
  }

  static forbidden(message = "Forbidden") {
    return new AppError({ status: 403, code: "FORBIDDEN", message });
  }

  static notFound(resource = "Resource") {
    return new AppError({
      status: 404,
      code: "NOT_FOUND",
      message: `${resource} not found`,
    });
  }

  static conflict(message: string, details?: unknown) {
    return new AppError({ status: 409, code: "CONFLICT", message, details });
  }

  static tooMany(message = "Too many requests") {
    return new AppError({ status: 429, code: "TOO_MANY_REQUESTS", message });
  }

  static internal(message = "Internal server error") {
    return new AppError({
      status: 500,
      code: "INTERNAL",
      message,
      expose: false,
    });
  }
}
