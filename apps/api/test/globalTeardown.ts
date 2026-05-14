import type { MongoMemoryServer } from "mongodb-memory-server";

export default async function globalTeardown() {
  const mongo = (globalThis as { __MONGO__?: MongoMemoryServer }).__MONGO__;
  if (mongo) await mongo.stop();
}
