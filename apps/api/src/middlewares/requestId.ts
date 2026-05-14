import type { NextFunction, Request, Response } from "express";
import { v4 as uuid } from "uuid";

/**
 * Adds a stable per-request id, available as `req.id` and `X-Request-Id`
 * response header. Honours an inbound `X-Request-Id` if the caller already
 * generated one (useful for distributed tracing).
 */
export function requestId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header("x-request-id");
  const id = incoming && incoming.length <= 64 ? incoming : uuid();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id: string;
    }
  }
}
