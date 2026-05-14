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

async function makeCategory(token: string, name = "Cleaning") {
  const res = await request(app)
    .post("/categories")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name,
      iconUrl: `https://cdn.example.com/${name.toLowerCase()}.png`,
    });
  if (res.status !== 201) {
    throw new Error(`failed to create category: ${res.status}`);
  }
  return res.body as { id: string; slug: string; name: string };
}

function makeBusinessPayload(categoryId: string, overrides = {}) {
  return {
    name: "Sparkle Cleaners",
    about: "Professional cleaning services for homes and offices.",
    address: "12 MG Road, Bengaluru",
    contactPerson: "Anita Sharma",
    email: "hello@sparkle.example",
    phone: "+919999999999",
    images: [{ url: "https://images.example.com/sparkle.jpg" }],
    categoryId,
    ...overrides,
  };
}

describe("POST /businesses", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/businesses").send({});
    expect(res.status).toBe(401);
  });

  it("validates the body", async () => {
    const user = await makeUser({ role: "user" });
    const res = await request(app)
      .post("/businesses")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects unknown category ids", async () => {
    const user = await makeUser({ role: "user" });
    const fakeCategoryId = "5f9f1b9b9b9b9b9b9b9b9b9b";
    const res = await request(app)
      .post("/businesses")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send(makeBusinessPayload(fakeCategoryId));
    expect(res.status).toBe(400);
  });

  it("creates a business + populates category", async () => {
    const admin = await makeUser({ role: "admin" });
    const cat = await makeCategory(admin.accessToken);
    const user = await makeUser({ role: "user" });

    const res = await request(app)
      .post("/businesses")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send(makeBusinessPayload(cat.id, { longitude: 77.59, latitude: 12.97 }));
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.category.id).toBe(cat.id);
    expect(res.body.location.coordinates).toEqual([77.59, 12.97]);
    expect(res.body.slug).toMatch(/^sparkle-cleaners-[a-f0-9]+$/);
  });
});

describe("GET /businesses", () => {
  it("returns paginated results with text search + category filter", async () => {
    const admin = await makeUser({ role: "admin" });
    const cleaning = await makeCategory(admin.accessToken, "Cleaning");
    const plumbing = await makeCategory(admin.accessToken, "Plumbing");
    const owner = await makeUser({ role: "owner" });

    await request(app)
      .post("/businesses")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send(makeBusinessPayload(cleaning.id, { name: "Sparkle Cleaners" }));
    await request(app)
      .post("/businesses")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send(
        makeBusinessPayload(cleaning.id, {
          name: "Bright Home Cleaners",
          email: "bright@e.example",
        })
      );
    await request(app)
      .post("/businesses")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send(
        makeBusinessPayload(plumbing.id, {
          name: "Pipe Pros",
          email: "pipes@e.example",
        })
      );

    const all = await request(app).get("/businesses");
    expect(all.status).toBe(200);
    expect(all.body.items).toHaveLength(3);
    expect(all.body.total).toBe(3);

    const byCategorySlug = await request(app)
      .get("/businesses")
      .query({ category: "cleaning" });
    expect(byCategorySlug.body.items).toHaveLength(2);

    const byCategoryName = await request(app)
      .get("/businesses")
      .query({ category: "Plumbing" });
    expect(byCategoryName.body.items).toHaveLength(1);
    expect(byCategoryName.body.items[0].name).toBe("Pipe Pros");

    const byText = await request(app).get("/businesses").query({ q: "pipe" });
    expect(byText.body.items).toHaveLength(1);
    expect(byText.body.items[0].name).toBe("Pipe Pros");

    const page = await request(app)
      .get("/businesses")
      .query({ limit: 2, page: 2 });
    expect(page.body.items).toHaveLength(1);
    expect(page.body.total).toBe(3);
  });

  it("supports ?near=lng,lat&radius= geo search", async () => {
    const admin = await makeUser({ role: "admin" });
    const cat = await makeCategory(admin.accessToken);
    const owner = await makeUser({ role: "owner" });

    // Near Bengaluru
    await request(app)
      .post("/businesses")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send(
        makeBusinessPayload(cat.id, {
          name: "Nearby Cleaners",
          email: "near@e.example",
          longitude: 77.5946,
          latitude: 12.9716,
        })
      );
    // Far away in Mumbai
    await request(app)
      .post("/businesses")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send(
        makeBusinessPayload(cat.id, {
          name: "Far Cleaners",
          email: "far@e.example",
          longitude: 72.8777,
          latitude: 19.076,
        })
      );

    const near = await request(app)
      .get("/businesses")
      .query({ near: "77.59,12.97", radius: 5000 });
    expect(near.status).toBe(200);
    expect(near.body.items.map((b: { name: string }) => b.name)).toEqual([
      "Nearby Cleaners",
    ]);
  });

  it("caches list responses keyed by query string", async () => {
    const a = await request(app).get("/businesses");
    expect(a.headers["x-cache"]).toBe("MISS");
    const b = await request(app).get("/businesses");
    expect(b.headers["x-cache"]).toBe("HIT");
    const c = await request(app).get("/businesses").query({ q: "anything" });
    expect(c.headers["x-cache"]).toBe("MISS");
  });
});

describe("GET /businesses/:id", () => {
  it("returns 404 for unknown id", async () => {
    const res = await request(app).get("/businesses/5f9f1b9b9b9b9b9b9b9b9b9b");
    expect(res.status).toBe(404);
  });

  it("returns a business by id and by slug", async () => {
    const admin = await makeUser({ role: "admin" });
    const cat = await makeCategory(admin.accessToken);
    const owner = await makeUser({ role: "owner" });
    const created = await request(app)
      .post("/businesses")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send(makeBusinessPayload(cat.id));

    const byId = await request(app).get(`/businesses/${created.body.id}`);
    expect(byId.status).toBe(200);
    expect(byId.body.name).toBe("Sparkle Cleaners");

    const bySlug = await request(app).get(`/businesses/${created.body.slug}`);
    expect(bySlug.status).toBe(200);
    expect(bySlug.body.id).toBe(created.body.id);
  });
});

describe("PATCH/DELETE /businesses/:id", () => {
  it("forbids non-owners and lets the owner update / delete", async () => {
    const admin = await makeUser({ role: "admin" });
    const cat = await makeCategory(admin.accessToken);
    const owner = await makeUser({ role: "owner" });
    const stranger = await makeUser({ role: "user" });

    const created = await request(app)
      .post("/businesses")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send(makeBusinessPayload(cat.id));

    const forbidden = await request(app)
      .patch(`/businesses/${created.body.id}`)
      .set("Authorization", `Bearer ${stranger.accessToken}`)
      .send({ about: "Hijacked description by a stranger" });
    expect(forbidden.status).toBe(403);

    const ok = await request(app)
      .patch(`/businesses/${created.body.id}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ about: "Updated about text from the owner." });
    expect(ok.status).toBe(200);
    expect(ok.body.about).toBe("Updated about text from the owner.");

    const adminDelete = await request(app)
      .delete(`/businesses/${created.body.id}`)
      .set("Authorization", `Bearer ${admin.accessToken}`);
    expect(adminDelete.status).toBe(204);
  });
});
