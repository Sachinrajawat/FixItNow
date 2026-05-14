import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { connectMongo, disconnectMongo } from "./config/db";
import { disconnectRedis } from "./config/redis";

async function main() {
  await connectMongo();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV },
      "FixItNow API listening"
    );
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down gracefully...");

    server.close(async (err) => {
      if (err) {
        logger.error({ err }, "Error closing HTTP server");
        process.exit(1);
      }
      try {
        await disconnectMongo();
        await disconnectRedis();
        logger.info("Shutdown complete");
        process.exit(0);
      } catch (e) {
        logger.error({ err: e }, "Shutdown error");
        process.exit(1);
      }
    });

    // Failsafe: hard exit after 10s.
    setTimeout(() => {
      logger.warn("Shutdown took too long, forcing exit");
      process.exit(1);
    }, 10000).unref();
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  logger.fatal({ err }, "Fatal startup error");
  process.exit(1);
});
