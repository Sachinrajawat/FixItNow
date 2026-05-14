import { z } from "zod";

/**
 * Server-side environment schema.
 *
 * Variables that are referenced by server code go here. They are not exposed
 * to the browser bundle.
 */
const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXTAUTH_SECRET: z
    .string()
    .min(16, "NEXTAUTH_SECRET should be at least 16 characters"),
  NEXTAUTH_URL: z.string().url(),
  DESCOPE_CLIENT_ID: z.string().min(1),
  DESCOPE_CLIENT_SECRET: z.string().min(1),
  // Optional: Sentry server-side DSN
  SENTRY_DSN: z.string().url().optional(),
});

/**
 * Client-side environment schema. All keys MUST start with NEXT_PUBLIC_.
 *
 * These are inlined into the browser bundle, so destructure them through
 * `clientEnv` to keep usages explicit.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_MASTER_URL_KEY: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

const isServer = typeof window === "undefined";

const processEnv = {
  // Server
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  DESCOPE_CLIENT_ID: process.env.DESCOPE_CLIENT_ID,
  DESCOPE_CLIENT_SECRET: process.env.DESCOPE_CLIENT_SECRET,
  SENTRY_DSN: process.env.SENTRY_DSN,
  // Client
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_MASTER_URL_KEY: process.env.NEXT_PUBLIC_MASTER_URL_KEY,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
};

const merged = serverSchema.merge(clientSchema);

const parsed = isServer
  ? merged.safeParse(processEnv)
  : clientSchema.safeParse(processEnv);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    parsed.error.flatten().fieldErrors
  );
  // Throw on the server so the app fails fast at boot.
  if (isServer) {
    throw new Error("Invalid environment variables. See logs above.");
  }
}

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;
type Env = ServerEnv & ClientEnv;

// On the client we only ever read NEXT_PUBLIC_* vars; on the server the merged
// shape is available. Cast carefully — never log the full env object.
export const env = (parsed.success ? parsed.data : processEnv) as Env;
