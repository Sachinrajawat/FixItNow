import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("health routes", () => {
  it("GET /healthz returns ok with uptime", async () => {
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptime).toBe("number");
    expect(res.headers["x-request-id"]).toBeTruthy();
  });

  it("Unknown routes return the standard ApiError envelope", async () => {
    const res = await request(app).get("/this/does/not/exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.requestId).toBeTruthy();
  });

  it("Honours an inbound X-Request-Id header", async () => {
    const res = await request(app)
      .get("/healthz")
      .set("X-Request-Id", "test-id-123");
    expect(res.headers["x-request-id"]).toBe("test-id-123");
  });
});
