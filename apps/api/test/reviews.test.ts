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

async function seedBusiness() {
  const admin = await makeUser({ role: "admin" });
  const cat = await request(app)
    .post("/categories")
    .set("Authorization", `Bearer ${admin.accessToken}`)
    .send({
      name: "Plumbing",
      iconUrl: "https://cdn.example.com/plumb.png",
    });
  const owner = await makeUser({ role: "owner" });
  const biz = await request(app)
    .post("/businesses")
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .send({
      name: "Pipe Pros",
      about: "Leaks, taps, geysers — call us anytime.",
      address: "45 Brigade Road",
      contactPerson: "Ravi",
      email: "pipes@e.example",
      images: [{ url: "https://images.example.com/pipes.jpg" }],
      categoryId: cat.body.id,
    });
  return { businessId: biz.body.id as string };
}

describe("POST /reviews", () => {
  it("requires auth and a valid body", async () => {
    const noAuth = await request(app).post("/reviews").send({});
    expect(noAuth.status).toBe(401);

    const u = await makeUser({ role: "user" });
    const bad = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${u.accessToken}`)
      .send({ businessId: "nope", rating: 7 });
    expect(bad.status).toBe(400);
  });

  it("creates a review and updates the business rating aggregate", async () => {
    const { businessId } = await seedBusiness();
    const userA = await makeUser({ role: "user" });
    const userB = await makeUser({ role: "user" });

    const a = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${userA.accessToken}`)
      .send({ businessId, rating: 5, comment: "Excellent!" });
    expect(a.status).toBe(201);

    const b = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${userB.accessToken}`)
      .send({ businessId, rating: 3 });
    expect(b.status).toBe(201);

    const biz = await request(app).get(`/businesses/${businessId}`);
    expect(biz.status).toBe(200);
    expect(biz.body.ratingAvg).toBe(4);
    expect(biz.body.ratingCount).toBe(2);
  });

  it("rejects duplicate reviews from the same user with 409", async () => {
    const { businessId } = await seedBusiness();
    const u = await makeUser({ role: "user" });
    const first = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${u.accessToken}`)
      .send({ businessId, rating: 4 });
    expect(first.status).toBe(201);
    const dup = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${u.accessToken}`)
      .send({ businessId, rating: 5 });
    expect(dup.status).toBe(409);
  });
});

describe("GET /reviews", () => {
  it("lists reviews for a business", async () => {
    const { businessId } = await seedBusiness();
    const u = await makeUser({ role: "user", name: "Tanvi" });
    await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${u.accessToken}`)
      .send({ businessId, rating: 5, comment: "Top notch." });

    const list = await request(app).get("/reviews").query({ businessId });
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].userName).toBe("Tanvi");
    expect(list.body.items[0].rating).toBe(5);
  });
});

describe("DELETE /reviews/:id", () => {
  it("lets the author delete; recomputes the rating", async () => {
    const { businessId } = await seedBusiness();
    const userA = await makeUser({ role: "user" });
    const userB = await makeUser({ role: "user" });

    const r1 = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${userA.accessToken}`)
      .send({ businessId, rating: 5 });
    await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${userB.accessToken}`)
      .send({ businessId, rating: 3 });

    const before = await request(app).get(`/businesses/${businessId}`);
    expect(before.body.ratingAvg).toBe(4);
    expect(before.body.ratingCount).toBe(2);

    const del = await request(app)
      .delete(`/reviews/${r1.body.id}`)
      .set("Authorization", `Bearer ${userA.accessToken}`);
    expect(del.status).toBe(204);

    const after = await request(app).get(`/businesses/${businessId}`);
    expect(after.body.ratingAvg).toBe(3);
    expect(after.body.ratingCount).toBe(1);
  });

  it("forbids deletion by non-author non-admin", async () => {
    const { businessId } = await seedBusiness();
    const userA = await makeUser({ role: "user" });
    const userB = await makeUser({ role: "user" });
    const r = await request(app)
      .post("/reviews")
      .set("Authorization", `Bearer ${userA.accessToken}`)
      .send({ businessId, rating: 5 });
    const forbidden = await request(app)
      .delete(`/reviews/${r.body.id}`)
      .set("Authorization", `Bearer ${userB.accessToken}`);
    expect(forbidden.status).toBe(403);
  });
});
