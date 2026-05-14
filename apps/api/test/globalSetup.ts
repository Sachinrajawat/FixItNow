import { MongoMemoryServer } from "mongodb-memory-server";

declare global {
  // eslint-disable-next-line no-var
  var __MONGO__: MongoMemoryServer | undefined;
}

export default async function globalSetup() {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();
  // Stash on globalThis so globalTeardown can stop the same instance.
  (globalThis as { __MONGO__?: MongoMemoryServer }).__MONGO__ = mongo;
}
