/**
 * Cache-aside middleware for GET endpoints, backed by Redis.
 *
 * Usage:
 *   router.get("/categories", cache({ keyFn: () => "categories:all", ttl: 60 }), handler)
 *
 * The middleware checks Redis first; on a HIT it serves the cached payload
 * with `X-Cache: HIT`. On a MISS it lets the handler run and snoops the
 * response body so it can write it back to Redis with the requested TTL.
 *
 * If Redis is unreachable the middleware fails open — the request is served
 * normally and the cache write is skipped. This avoids cascading failures
 * when the cache is degraded.
 */
import type { NextFunction, Request, Response } from "express";
import { getRedis } from "../config/redis";
import { logger } from "../config/logger";

export interface CacheOptions {
  /** Build the Redis key from the request. */
  keyFn: (req: Request) => string;
  /** TTL in seconds. */
  ttl: number;
  /** Optional namespace prefix. */
  prefix?: string;
}

/** Internal: build the full Redis key for a request. */
function buildCacheKey(opts: CacheOptions, req: Request): string {
  const prefix = opts.prefix ?? "default";
  return `cache:${prefix}:${opts.keyFn(req)}`;
}

export function cache(opts: CacheOptions) {
  const buildKey = (req: Request) => buildCacheKey(opts, req);

  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") return next();

    const key = buildKey(req);
    let redis: ReturnType<typeof getRedis>;
    try {
      redis = getRedis();
    } catch {
      return next();
    }

    try {
      const hit = await redis.get(key);
      if (hit) {
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.send(hit);
        return;
      }
    } catch (err) {
      logger.warn({ err, key }, "cache read failed; serving fresh");
      return next();
    }

    res.setHeader("X-Cache", "MISS");
    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      // Only cache successful responses.
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const payload = JSON.stringify(body);
        redis.setex(key, opts.ttl, payload).catch((err: Error) => {
          logger.warn({ err, key }, "cache write failed");
        });
      }
      return originalJson(body);
    }) as typeof res.json;
    next();
  };
}

/**
 * Invalidate all cache keys under a given prefix (e.g. when a category is
 * mutated, drop every cached /categories response). Failures are logged but
 * never propagated because the application is still consistent — it just
 * temporarily serves stale data until the TTL expires.
 *
 * We use a non-blocking SCAN cursor (in batches of 200) rather than the
 * O(N) `KEYS` command so this is safe to run against production-sized key
 * spaces without stalling the Redis main loop.
 */
export async function invalidateCachePrefix(prefix: string): Promise<void> {
  let redis: ReturnType<typeof getRedis>;
  try {
    redis = getRedis();
  } catch {
    return;
  }

  const pattern = `cache:${prefix}*`;
  try {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        200
      );
      if (keys.length > 0) await redis.del(...keys);
      cursor = nextCursor;
    } while (cursor !== "0");
  } catch (err) {
    logger.warn({ err, pattern }, "cache invalidate failed");
  }
}
