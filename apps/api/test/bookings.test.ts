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
  return { businessId: biz.body.id as string, owner };
}

describe("POST /bookings", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/bookings").send({});
    expect(res.status).toBe(401);
  });

  it("creates a booking", async () => {
    const { businessId } = await seedBusiness();
    const user = await makeUser({ role: "user" });
    const res = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({ businessId, date: "2026-06-12", time: "10:30" });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("booked");
    expect(res.body.userId).toBe(user.id);
  });

  it("rejects double-booking with 409 (unique index)", async () => {
    const { businessId } = await seedBusiness();
    const a = await makeUser({ role: "user" });
    const b = await makeUser({ role: "user" });
    const first = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${a.accessToken}`)
      .send({ businessId, date: "2026-06-12", time: "10:30" });
    expect(first.status).toBe(201);

    const dup = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${b.accessToken}`)
      .send({ businessId, date: "2026-06-12", time: "10:30" });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe("CONFLICT");
  });

  it("validates date/time formats", async () => {
    const { businessId } = await seedBusiness();
    const user = await makeUser({ role: "user" });
    const res = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({ businessId, date: "12-06-2026", time: "10:30 AM" });
    expect(res.status).toBe(400);
  });

  it("404s when the business does not exist", async () => {
    const user = await makeUser({ role: "user" });
    const res = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({
        businessId: "5f9f1b9b9b9b9b9b9b9b9b9b",
        date: "2026-06-12",
        time: "10:30",
      });
    expect(res.status).toBe(404);
  });
});

describe("GET /bookings/mine", () => {
  it("lists only the caller's bookings, newest first", async () => {
    const { businessId } = await seedBusiness();
    const userA = await makeUser({ role: "user" });
    const userB = await makeUser({ role: "user" });

    await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${userA.accessToken}`)
      .send({ businessId, date: "2026-06-12", time: "10:30" });
    await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${userA.accessToken}`)
      .send({ businessId, date: "2026-06-13", time: "11:00" });
    await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${userB.accessToken}`)
      .send({ businessId, date: "2026-06-14", time: "12:00" });

    const mine = await request(app)
      .get("/bookings/mine")
      .set("Authorization", `Bearer ${userA.accessToken}`);
    expect(mine.status).toBe(200);
    expect(mine.body.items).toHaveLength(2);
    expect(mine.body.total).toBe(2);
    // Populated business
    expect(mine.body.items[0].business.name).toBe("Pipe Pros");
  });
});

describe("GET /bookings/slots", () => {
  it("returns only the booked times for a given date", async () => {
    const { businessId } = await seedBusiness();
    const user = await makeUser({ role: "user" });
    await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({ businessId, date: "2026-06-12", time: "10:30" });
    await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({ businessId, date: "2026-06-12", time: "14:00" });

    const slots = await request(app)
      .get("/bookings/slots")
      .query({ businessId, date: "2026-06-12" });
    expect(slots.status).toBe(200);
    expect(slots.body.slots.sort()).toEqual(["10:30", "14:00"]);
  });
});

describe("PATCH /bookings/:id/cancel", () => {
  it("lets the owner cancel and frees the slot", async () => {
    const { businessId } = await seedBusiness();
    const a = await makeUser({ role: "user" });
    const created = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${a.accessToken}`)
      .send({ businessId, date: "2026-06-12", time: "10:30" });

    const cancel = await request(app)
      .patch(`/bookings/${created.body.id}/cancel`)
      .set("Authorization", `Bearer ${a.accessToken}`);
    expect(cancel.status).toBe(200);
    expect(cancel.body.status).toBe("cancelled");

    // Slot can now be booked by someone else.
    const b = await makeUser({ role: "user" });
    const rebook = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${b.accessToken}`)
      .send({ businessId, date: "2026-06-12", time: "10:30" });
    expect(rebook.status).toBe(201);
  });

  it("forbids cancelling someone else's booking", async () => {
    const { businessId } = await seedBusiness();
    const a = await makeUser({ role: "user" });
    const b = await makeUser({ role: "user" });
    const created = await request(app)
      .post("/bookings")
      .set("Authorization", `Bearer ${a.accessToken}`)
      .send({ businessId, date: "2026-06-12", time: "10:30" });

    const forbidden = await request(app)
      .patch(`/bookings/${created.body.id}/cancel`)
      .set("Authorization", `Bearer ${b.accessToken}`);
    expect(forbidden.status).toBe(403);
  });
});
