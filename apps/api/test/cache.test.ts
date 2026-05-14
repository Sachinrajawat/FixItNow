import request from "supertest";
import express from "express";
import { useRedisMock } from "./helpers/redis-mock";
import { cache, invalidateCachePrefix } from "../src/middlewares/cache";

let redisMock: ReturnType<typeof useRedisMock>;

beforeAll(() => {
  redisMock = useRedisMock();
});

beforeEach(async () => {
  await redisMock.flushall();
});

function makeApp() {
  const app = express();
  let serveCount = 0;
  app.get(
    "/cached",
    cache({ keyFn: () => "ping", ttl: 60, prefix: "test" }),
    (_req, res) => {
      serveCount += 1;
      res.json({ serveCount });
    }
  );
  app.get("/count", (_req, res) => res.json({ serveCount }));
  return app;
}

describe("cache middleware", () => {
  it("serves a HIT on the second request", async () => {
    const app = makeApp();

    const a = await request(app).get("/cached");
    expect(a.status).toBe(200);
    expect(a.headers["x-cache"]).toBe("MISS");
    expect(a.body.serveCount).toBe(1);

    const b = await request(app).get("/cached");
    expect(b.status).toBe(200);
    expect(b.headers["x-cache"]).toBe("HIT");
    expect(b.body.serveCount).toBe(1); // handler did not run again
  });

  it("invalidateCachePrefix drops all matching keys", async () => {
    const app = makeApp();

    await request(app).get("/cached");
    const stillHit = await request(app).get("/cached");
    expect(stillHit.headers["x-cache"]).toBe("HIT");

    await invalidateCachePrefix("test");

    const afterReset = await request(app).get("/cached");
    expect(afterReset.headers["x-cache"]).toBe("MISS");
  });
});
