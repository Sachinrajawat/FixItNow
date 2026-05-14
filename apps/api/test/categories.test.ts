import request from "supertest";
import { useRedisMock } from "./helpers/redis-mock";
import {
  clearCollections,
  connectInMemoryMongo,
  disconnectInMemoryMongo,
} from "./helpers/db";
import { createApp } from "../src/app";
import { makeUser } from "./helpers/auth";

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

const sampleCategory = {
  name: "Cleaning",
  iconUrl: "https://cdn.example.com/icons/clean.png",
};

describe("GET /categories", () => {
  it("returns an empty list initially", async () => {
    const res = await request(app).get("/categories");
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    // Caching headers are set by the middleware.
    expect(["MISS", "HIT"]).toContain(res.headers["x-cache"]);
  });

  it("serves a HIT on the second call", async () => {
    const admin = await makeUser({ role: "admin" });
    await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send(sampleCategory);

    const a = await request(app).get("/categories");
    expect(a.status).toBe(200);
    expect(a.headers["x-cache"]).toBe("MISS");
    expect(a.body.items).toHaveLength(1);

    const b = await request(app).get("/categories");
    expect(b.status).toBe(200);
    expect(b.headers["x-cache"]).toBe("HIT");
    expect(b.body.items).toHaveLength(1);
  });
});

describe("GET /categories/:id", () => {
  it("looks up by id and by slug", async () => {
    const admin = await makeUser({ role: "admin" });
    const created = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send(sampleCategory);
    expect(created.status).toBe(201);

    const byId = await request(app).get(`/categories/${created.body.id}`);
    expect(byId.status).toBe(200);
    expect(byId.body.slug).toBe("cleaning");

    const bySlug = await request(app).get(`/categories/${created.body.slug}`);
    expect(bySlug.status).toBe(200);
    expect(bySlug.body.id).toBe(created.body.id);
  });

  it("returns 404 for missing slug", async () => {
    const res = await request(app).get("/categories/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("POST /categories", () => {
  it("requires admin role", async () => {
    const u = await makeUser({ role: "user" });
    const res = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${u.accessToken}`)
      .send(sampleCategory);
    expect(res.status).toBe(403);
  });

  it("validates the body", async () => {
    const admin = await makeUser({ role: "admin" });
    const res = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ name: "x", iconUrl: "not-a-url" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects duplicate names with 409", async () => {
    const admin = await makeUser({ role: "admin" });
    const a = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send(sampleCategory);
    expect(a.status).toBe(201);
    const b = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send(sampleCategory);
    expect(b.status).toBe(409);
  });
});

describe("PATCH/DELETE /categories/:id", () => {
  it("updates and deletes a category", async () => {
    const admin = await makeUser({ role: "admin" });
    const created = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send(sampleCategory);

    const patched = await request(app)
      .patch(`/categories/${created.body.id}`)
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ name: "Deep Cleaning" });
    expect(patched.status).toBe(200);
    expect(patched.body.name).toBe("Deep Cleaning");

    const del = await request(app)
      .delete(`/categories/${created.body.id}`)
      .set("Authorization", `Bearer ${admin.accessToken}`);
    expect(del.status).toBe(204);

    const gone = await request(app).get(`/categories/${created.body.id}`);
    expect(gone.status).toBe(404);
  });
});
