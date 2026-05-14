/**
 * Plug an in-memory Redis (ioredis-mock) into our config/redis module so
 * tests can exercise refresh-token allowlist flows without a live server.
 *
 * Call this BEFORE importing the controllers/services that hold a reference
 * to the Redis client. In Jest you'd typically do:
 *
 *   import { useRedisMock } from "../helpers/redis-mock";
 *   beforeAll(useRedisMock);
 */
import RedisMock from "ioredis-mock";
import * as redisModule from "../../src/config/redis";

export function useRedisMock() {
  const mock = new RedisMock();
  // Replace getRedis() with one that returns the mock for the rest of the run.
  jest
    .spyOn(redisModule, "getRedis")
    // ioredis-mock's API is a strict subset compatible with our usage
    .mockReturnValue(
      mock as unknown as ReturnType<typeof redisModule.getRedis>
    );
  return mock;
}
