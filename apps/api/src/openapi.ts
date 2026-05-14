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
    "/categories": {
      get: {
        tags: ["Categories"],
        summary: "List all categories (cached for 60s)",
        responses: { "200": { description: "OK" } },
      },
      post: {
        tags: ["Categories"],
        summary: "Create a category (admin only)",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": { description: "Created" },
          "401": { description: "Not authenticated" },
          "403": { description: "Admins only" },
          "409": { description: "Duplicate name" },
        },
      },
    },
    "/categories/{id}": {
      get: {
        tags: ["Categories"],
        summary: "Get a category by id or slug",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "OK" },
          "404": { description: "Not found" },
        },
      },
      patch: {
        tags: ["Categories"],
        summary: "Update a category (admin only)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "OK" },
          "403": { description: "Admins only" },
        },
      },
      delete: {
        tags: ["Categories"],
        summary: "Delete a category (admin only)",
        security: [{ bearerAuth: [] }],
        responses: {
          "204": { description: "Deleted" },
          "403": { description: "Admins only" },
          "409": { description: "Category still in use" },
        },
      },
    },
    "/businesses": {
      get: {
        tags: ["Businesses"],
        summary:
          "Paginated list with category filter, text search, and ?near=lng,lat&radius= geo search",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "near", in: "query", schema: { type: "string" } },
          { name: "radius", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "OK" } },
      },
      post: {
        tags: ["Businesses"],
        summary: "Create a business (auth required; caller becomes the owner)",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": { description: "Created" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/businesses/{id}": {
      get: {
        tags: ["Businesses"],
        summary: "Get a business by id or slug",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "OK" },
          "404": { description: "Not found" },
        },
      },
      patch: {
        tags: ["Businesses"],
        summary: "Update a business (owner or admin)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "OK" },
          "403": { description: "Forbidden" },
        },
      },
      delete: {
        tags: ["Businesses"],
        summary: "Delete a business (owner or admin)",
        security: [{ bearerAuth: [] }],
        responses: {
          "204": { description: "Deleted" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/bookings": {
      post: {
        tags: ["Bookings"],
        summary: "Create a booking",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": { description: "Created" },
          "409": { description: "Slot already booked" },
        },
      },
    },
    "/bookings/mine": {
      get: {
        tags: ["Bookings"],
        summary: "Paginated list of the caller's bookings",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/bookings/slots": {
      get: {
        tags: ["Bookings"],
        summary:
          "Booked time slots for a given business + date — used by the booking UI",
        parameters: [
          {
            name: "businessId",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "date",
            in: "query",
            required: true,
            schema: { type: "string", format: "date" },
          },
        ],
        responses: { "200": { description: "OK" } },
      },
    },
    "/bookings/{id}/cancel": {
      patch: {
        tags: ["Bookings"],
        summary: "Cancel a booking (owner only)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Cancelled" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/reviews": {
      get: {
        tags: ["Reviews"],
        summary: "List reviews (optionally filtered by businessId)",
        parameters: [
          { name: "businessId", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "OK" } },
      },
      post: {
        tags: ["Reviews"],
        summary:
          "Create a review (1-5 stars). Recomputes the business' ratingAvg/ratingCount.",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": { description: "Created" },
          "409": { description: "Already reviewed by this user" },
        },
      },
    },
    "/reviews/{id}": {
      delete: {
        tags: ["Reviews"],
        summary: "Delete a review (author or admin)",
        security: [{ bearerAuth: [] }],
        responses: {
          "204": { description: "Deleted" },
          "403": { description: "Forbidden" },
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
