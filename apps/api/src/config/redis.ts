import Redis from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

let client: Redis | null = null;

/**
 * Lazily-constructed Redis client. The first caller pays for the connect.
 * Tests that don't touch Redis can run without a server (the client is
 * never instantiated, so no socket handles are opened).
 */
export function getRedis(): Redis {
  if (client) return client;

  client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableAutoPipelining: true,
    retryStrategy: (times) => {
      // Stop trying after 3 attempts so failing tests don't hang.
      if (times > 3) return null;
      return Math.min(times * 200, 1000);
    },
  });

  client.on("connect", () => logger.info("Redis connected"));
  client.on("error", (err) =>
    logger.warn({ err: { message: err.message } }, "Redis error")
  );

  return client;
}

export async function disconnectRedis() {
  if (!client) return;
  try {
    await client.quit();
  } catch {
    client.disconnect();
  }
  client = null;
  logger.info("Redis disconnected");
}
