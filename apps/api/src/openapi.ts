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
    version: "0.2.0",
    description:
      "Backend for FixItNow — categories, businesses, bookings, reviews. " +
      "Authenticated routes use a Bearer access token (15m TTL). The " +
      "refresh token (7d TTL) lives in an HttpOnly cookie scoped to /auth.",
  },
  servers: [{ url: "http://localhost:4000", description: "Local development" }],
  paths: {
    "/healthz": {
      get: {
        tags: ["Health"],
        summary: "Liveness probe",
        responses: { "200": { description: "Process is up" } },
      },
    },
    "/readyz": {
      get: {
        tags: ["Health"],
        summary: "Readiness probe",
        responses: {
          "200": { description: "All dependencies reachable" },
          "503": { description: "One or more dependencies unreachable" },
        },
      },
    },
    "/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Create a new user account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
          "400": { description: "Validation error" },
          "409": { description: "Email already registered" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Exchange credentials for an access + refresh token",
        responses: {
          "200": { description: "OK" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Rotate the refresh cookie and issue a new access token",
        responses: {
          "200": { description: "OK" },
          "401": { description: "Refresh token missing / revoked / invalid" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Revoke ALL refresh tokens for the current user",
        security: [{ bearerAuth: [] }],
        responses: {
          "204": { description: "Logged out" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Return the authenticated user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "OK" },
          "401": { description: "Not authenticated" },
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
