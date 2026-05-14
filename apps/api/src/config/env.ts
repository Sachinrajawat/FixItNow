import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  // Database
  MONGO_URI: z.string().url().default("mongodb://localhost:27017/fixitnow"),

  // Cache
  REDIS_URL: z.string().url().default("redis://localhost:6379"),

  // Auth (used in Step 2 — declared up front so the schema is stable)
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 chars")
    .default("development_access_secret_change_me_change_me_please"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 chars")
    .default("development_refresh_secret_change_me_change_me_please"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // Logging
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid API environment:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment. Aborting startup.");
}

export const env = parsed.data;
export type Env = typeof env;
