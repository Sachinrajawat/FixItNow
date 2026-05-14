import express, { type Express } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env";
import { logger } from "./config/logger";
import { requestId } from "./middlewares/requestId";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import { openApiSpec } from "./openapi";

export function createApp(): Express {
  const app = express();

  // Trust the first proxy (e.g. nginx, Render, Fly) so req.ip is correct.
  app.set("trust proxy", 1);

  // Core middleware
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id ?? "unknown",
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
    })
  );
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  // Routes
  app.use("/", healthRouter);
  app.use("/auth", authRouter);

  // OpenAPI / Swagger UI
  app.get("/api/docs.json", (_req, res) => res.json(openApiSpec));
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customSiteTitle: "FixItNow API",
    })
  );

  // 404 + error handler — always last
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
