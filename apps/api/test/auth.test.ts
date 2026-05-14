import request from "supertest";
import { useRedisMock } from "./helpers/redis-mock";
import {
  connectInMemoryMongo,
  clearCollections,
  disconnectInMemoryMongo,
} from "./helpers/db";
import { createApp } from "../src/app";

const app = createApp();

beforeAll(async () => {
  useRedisMock();
  await connectInMemoryMongo();
});

beforeEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await disconnectInMemoryMongo();
});

const validSignup = {
  name: "Sahreen Sharma",
  email: "sahreen@example.com",
  password: "supersecret123",
};

describe("POST /auth/signup", () => {
  it("creates a user and returns 201 + access token + sets refresh cookie", async () => {
    const res = await request(app).post("/auth/signup").send(validSignup);

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("sahreen@example.com");
    expect(res.body.user.role).toBe("user");
    expect(res.body.user).not.toHaveProperty("password");
    expect(typeof res.body.accessToken).toBe("string");
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^fin_rt=/);
    expect(res.headers["set-cookie"]?.[0]).toMatch(/HttpOnly/i);
  });

  it("rejects duplicate emails with 409", async () => {
    await request(app).post("/auth/signup").send(validSignup);
    const res = await request(app).post("/auth/signup").send(validSignup);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("rejects weak passwords with 400 VALIDATION_ERROR", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ ...validSignup, password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details.fieldErrors).toHaveProperty("password");
  });

  it("normalises email to lowercase + trimmed", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ ...validSignup, email: "  SAHReen@Example.com " });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("sahreen@example.com");
  });
});

describe("POST /auth/login", () => {
  it("returns access + refresh on correct credentials", async () => {
    await request(app).post("/auth/signup").send(validSignup);
    const res = await request(app)
      .post("/auth/login")
      .send({ email: validSignup.email, password: validSignup.password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  it("returns 401 for wrong password", async () => {
    await request(app).post("/auth/signup").send(validSignup);
    const res = await request(app)
      .post("/auth/login")
      .send({ email: validSignup.email, password: "wrong-password" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 for unknown email", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "nope@example.com", password: "whatever" });
    expect(res.status).toBe(401);
  });
});

describe("GET /auth/me", () => {
  it("returns 401 without a Bearer token", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user with a valid Bearer token", async () => {
    const signup = await request(app).post("/auth/signup").send(validSignup);
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${signup.body.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(validSignup.email);
  });

  it("rejects garbage Bearer tokens with 401", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", "Bearer not.a.real.jwt");
    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/invalid/i);
  });
});

describe("POST /auth/refresh", () => {
  it("rotates the refresh token (single-use) and returns a new access token", async () => {
    const signup = await request(app).post("/auth/signup").send(validSignup);
    const cookie = signup.headers["set-cookie"];

    const res = await request(app).post("/auth/refresh").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^fin_rt=/);

    // Replaying the OLD cookie must fail (rotation enforced).
    const replay = await request(app)
      .post("/auth/refresh")
      .set("Cookie", cookie);
    expect(replay.status).toBe(401);
  });

  it("returns 401 when no refresh cookie is sent", async () => {
    const res = await request(app).post("/auth/refresh");
    expect(res.status).toBe(401);
  });
});

describe("POST /auth/logout", () => {
  it("revokes all the user's refresh tokens", async () => {
    const signup = await request(app).post("/auth/signup").send(validSignup);
    const access = signup.body.accessToken;
    const cookie = signup.headers["set-cookie"];

    const out = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${access}`);
    expect(out.status).toBe(204);

    // The cookie we still have on disk should now be useless.
    const refresh = await request(app)
      .post("/auth/refresh")
      .set("Cookie", cookie);
    expect(refresh.status).toBe(401);
  });
});
