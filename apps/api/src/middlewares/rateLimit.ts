/**
 * Redis-backed sliding-window rate limiter.
 *
 * Implementation: a single Redis key per (route, identity) holds a counter
 * incremented atomically with INCR + EXPIRE. The window is fixed (e.g. one
 * minute) which is good enough for protecting POST endpoints — it does not
 * suffer from the burstiness of token-bucket while staying O(1) per request.
 *
 * Identity defaults to req.auth.userId for authenticated requests and falls
 * back to req.ip — so abuse from a single IP is mitigated even before
 * sign-in. Failures (e.g. Redis down) fail open so a degraded cache does
 * not knock out the application.
 */
import type { NextFunction, Request, Response } from "express";
import { getRedis } from "../config/redis";
import { logger } from "../config/logger";
import { AppError } from "../utils/AppError";

export interface RateLimitOptions {
  /** Logical name of the route, used in the Redis key. */
  name: string;
  /** Max number of requests allowed inside the window. */
  max: number;
  /** Window size in seconds. */
  windowSec: number;
  /** Custom identity function (defaults to userId-or-IP). */
  identity?: (req: Request) => string;
}

const DEFAULT_IDENTITY = (req: Request): string =>
  req.auth?.userId ?? req.ip ?? "anonymous";

export function rateLimit(opts: RateLimitOptions) {
  const ident = opts.identity ?? DEFAULT_IDENTITY;
  return async (req: Request, res: Response, next: NextFunction) => {
    let redis: ReturnType<typeof getRedis>;
    try {
      redis = getRedis();
    } catch {
      return next();
    }

    const id = ident(req);
    const key = `rl:${opts.name}:${id}`;

    try {
      const count = await redis.incr(key);
      if (count === 1) {
        // First write in the window — set the expiry.
        await redis.expire(key, opts.windowSec);
      }

      res.setHeader("X-RateLimit-Limit", String(opts.max));
      res.setHeader(
        "X-RateLimit-Remaining",
        String(Math.max(0, opts.max - count))
      );

      if (count > opts.max) {
        const ttl = await redis.ttl(key);
        if (ttl > 0) res.setHeader("Retry-After", String(ttl));
        return next(
          AppError.tooMany(
            `Rate limit exceeded for ${opts.name}. Try again in ${ttl}s.`
          )
        );
      }

      next();
    } catch (err) {
      logger.warn({ err, key }, "rate limit check failed; allowing request");
      next();
    }
  };
}
