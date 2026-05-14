import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "./logger";

mongoose.set("strictQuery", true);

let connection: typeof mongoose | null = null;

export async function connectMongo(uri: string = env.MONGO_URI) {
  if (connection) return connection;

  connection = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    autoIndex: env.NODE_ENV !== "production",
  });

  logger.info({ host: connection.connection.host }, "MongoDB connected");
  return connection;
}

export async function disconnectMongo() {
  if (!connection) return;
  await connection.disconnect();
  connection = null;
  logger.info("MongoDB disconnected");
}
