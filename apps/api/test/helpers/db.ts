import mongoose from "mongoose";

/**
 * Connect mongoose to the URI provided by the global setup hook
 * (which boots a single MongoMemoryServer for the whole test run).
 */
export async function connectInMemoryMongo() {
  if (mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI not set; globalSetup did not run");
  await mongoose.connect(uri);
}

export async function clearCollections() {
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

export async function disconnectInMemoryMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
