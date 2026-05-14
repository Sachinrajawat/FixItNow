/**
 * Hand-rolled OpenAPI 3.0 spec for the bare-bones API.
 *
 * In Step 3 this will be auto-generated from the Zod schemas in
 * `@fixitnow/types` (e.g. via `zod-to-openapi`) so it stays in sync.
 */
export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "FixItNow API",
    version: "0.1.0",
    description:
      "Backend for FixItNow — categories, businesses, bookings, reviews. " +
      "Authenticated routes use a Bearer access token (15m TTL) issued via /auth/login.",
  },
  servers: [{ url: "http://localhost:4000", description: "Local development" }],
  paths: {
    "/healthz": {
      get: {
        summary: "Liveness probe",
        responses: { "200": { description: "Process is up" } },
      },
    },
    "/readyz": {
      get: {
        summary: "Readiness probe",
        responses: {
          "200": { description: "All dependencies reachable" },
          "503": { description: "One or more dependencies unreachable" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      ApiError: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              requestId: { type: "string" },
              details: {},
            },
          },
        },
      },
    },
  },
} as const;
