/**
 * OpenAPI 3.0 spec for the FixItNow API.
 *
 * The spec is generated *programmatically* from the same Zod schemas that
 * the routes use for request validation (`@fixitnow/types`). That makes it
 * impossible for `/api/docs` to drift from the wire contract — adding a
 * field to a Zod schema automatically reflects it here.
 */
import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import {
  apiErrorSchema,
  authResponseSchema,
  bookedSlotsQuerySchema,
  bookedSlotsResponseSchema,
  bookingIdParamSchema,
  bookingListMineQuerySchema,
  bookingListResponseSchema,
  bookingSchema,
  businessIdParamSchema,
  businessListResponseSchema,
  businessQuerySchema,
  businessSchema,
  categoryIdParamSchema,
  categoryListResponseSchema,
  categorySchema,
  createBookingBodySchema,
  createBusinessBodySchema,
  createCategoryBodySchema,
  createReviewBodySchema,
  loginBodySchema,
  reviewIdParamSchema,
  reviewListResponseSchema,
  reviewQuerySchema,
  reviewSchema,
  signupBodySchema,
  updateBusinessBodySchema,
  updateCategoryBodySchema,
  userSchema,
} from "@fixitnow/types";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// --- Components / shared schemas ----------------------------------------
registry.register("ApiError", apiErrorSchema);
registry.register("User", userSchema);
registry.register("AuthResponse", authResponseSchema);
registry.register("Category", categorySchema);
registry.register("Business", businessSchema);
registry.register("Booking", bookingSchema);
registry.register("Review", reviewSchema);
registry.register("CategoryListResponse", categoryListResponseSchema);
registry.register("BusinessListResponse", businessListResponseSchema);
registry.register("BookingListResponse", bookingListResponseSchema);
registry.register("ReviewListResponse", reviewListResponseSchema);
registry.register("BookedSlotsResponse", bookedSlotsResponseSchema);

const bearerAuth = registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

// --- Convenience helpers ------------------------------------------------
const ok = <T extends z.ZodTypeAny>(schema: T, description = "OK") => ({
  description,
  content: { "application/json": { schema } },
});

const created = <T extends z.ZodTypeAny>(
  schema: T,
  description = "Created"
) => ({
  description,
  content: { "application/json": { schema } },
});

const noContent = (description = "No content") => ({ description });

const error = (description: string) => ({
  description,
  content: { "application/json": { schema: apiErrorSchema } },
});

// --- Health -------------------------------------------------------------
registry.registerPath({
  method: "get",
  path: "/healthz",
  tags: ["Health"],
  summary: "Liveness probe",
  responses: { 200: { description: "Process is up" } },
});

registry.registerPath({
  method: "get",
  path: "/readyz",
  tags: ["Health"],
  summary: "Readiness probe",
  responses: {
    200: { description: "All dependencies reachable" },
    503: error("One or more dependencies unreachable"),
  },
});

// --- Auth ---------------------------------------------------------------
registry.registerPath({
  method: "post",
  path: "/auth/signup",
  tags: ["Auth"],
  summary: "Create a new user account",
  request: {
    body: {
      content: { "application/json": { schema: signupBodySchema } },
    },
  },
  responses: {
    201: created(authResponseSchema),
    400: error("Validation error"),
    409: error("Email already registered"),
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Exchange credentials for an access + refresh token",
  request: {
    body: {
      content: { "application/json": { schema: loginBodySchema } },
    },
  },
  responses: {
    200: ok(authResponseSchema),
    401: error("Invalid credentials"),
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/refresh",
  tags: ["Auth"],
  summary: "Rotate the refresh cookie and issue a new access token",
  responses: {
    200: ok(z.object({ accessToken: z.string() })),
    401: error("Refresh token missing / revoked / invalid"),
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  summary: "Revoke ALL refresh tokens for the current user",
  security: [{ [bearerAuth.name]: [] }],
  responses: { 204: noContent("Logged out"), 401: error("Not authenticated") },
});

registry.registerPath({
  method: "get",
  path: "/auth/me",
  tags: ["Auth"],
  summary: "Return the authenticated user",
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: ok(z.object({ user: userSchema })),
    401: error("Not authenticated"),
  },
});

// --- Categories ---------------------------------------------------------
registry.registerPath({
  method: "get",
  path: "/categories",
  tags: ["Categories"],
  summary: "List all categories (cached for 60s)",
  responses: { 200: ok(categoryListResponseSchema) },
});

registry.registerPath({
  method: "get",
  path: "/categories/{id}",
  tags: ["Categories"],
  summary: "Get a category by id or slug",
  request: { params: categoryIdParamSchema },
  responses: { 200: ok(categorySchema), 404: error("Not found") },
});

registry.registerPath({
  method: "post",
  path: "/categories",
  tags: ["Categories"],
  summary: "Create a category (admin only)",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: {
      content: { "application/json": { schema: createCategoryBodySchema } },
    },
  },
  responses: {
    201: created(categorySchema),
    401: error("Not authenticated"),
    403: error("Admins only"),
    409: error("Duplicate name"),
  },
});

registry.registerPath({
  method: "patch",
  path: "/categories/{id}",
  tags: ["Categories"],
  summary: "Update a category (admin only)",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: categoryIdParamSchema,
    body: {
      content: { "application/json": { schema: updateCategoryBodySchema } },
    },
  },
  responses: {
    200: ok(categorySchema),
    403: error("Admins only"),
    404: error("Not found"),
  },
});

registry.registerPath({
  method: "delete",
  path: "/categories/{id}",
  tags: ["Categories"],
  summary: "Delete a category (admin only)",
  security: [{ [bearerAuth.name]: [] }],
  request: { params: categoryIdParamSchema },
  responses: {
    204: noContent("Deleted"),
    403: error("Admins only"),
    409: error("Category still in use"),
  },
});

// --- Businesses ---------------------------------------------------------
registry.registerPath({
  method: "get",
  path: "/businesses",
  tags: ["Businesses"],
  summary:
    "Paginated list with category filter, text search, and ?near=lng,lat&radius= geo search",
  request: { query: businessQuerySchema },
  responses: { 200: ok(businessListResponseSchema) },
});

registry.registerPath({
  method: "get",
  path: "/businesses/{id}",
  tags: ["Businesses"],
  summary: "Get a business by id or slug",
  request: { params: businessIdParamSchema },
  responses: { 200: ok(businessSchema), 404: error("Not found") },
});

registry.registerPath({
  method: "post",
  path: "/businesses",
  tags: ["Businesses"],
  summary: "Create a business (auth required; caller becomes the owner)",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: {
      content: { "application/json": { schema: createBusinessBodySchema } },
    },
  },
  responses: {
    201: created(businessSchema),
    400: error("Validation error"),
    401: error("Not authenticated"),
  },
});

registry.registerPath({
  method: "patch",
  path: "/businesses/{id}",
  tags: ["Businesses"],
  summary: "Update a business (owner or admin)",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: businessIdParamSchema,
    body: {
      content: { "application/json": { schema: updateBusinessBodySchema } },
    },
  },
  responses: {
    200: ok(businessSchema),
    403: error("Forbidden"),
    404: error("Not found"),
  },
});

registry.registerPath({
  method: "delete",
  path: "/businesses/{id}",
  tags: ["Businesses"],
  summary: "Delete a business (owner or admin)",
  security: [{ [bearerAuth.name]: [] }],
  request: { params: businessIdParamSchema },
  responses: {
    204: noContent("Deleted"),
    403: error("Forbidden"),
    404: error("Not found"),
  },
});

// --- Bookings -----------------------------------------------------------
registry.registerPath({
  method: "post",
  path: "/bookings",
  tags: ["Bookings"],
  summary: "Create a booking",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: {
      content: { "application/json": { schema: createBookingBodySchema } },
    },
  },
  responses: {
    201: created(bookingSchema),
    404: error("Business not found"),
    409: error("Slot already booked"),
  },
});

registry.registerPath({
  method: "get",
  path: "/bookings/mine",
  tags: ["Bookings"],
  summary: "Paginated list of the caller's bookings",
  security: [{ [bearerAuth.name]: [] }],
  request: { query: bookingListMineQuerySchema },
  responses: { 200: ok(bookingListResponseSchema) },
});

registry.registerPath({
  method: "get",
  path: "/bookings/slots",
  tags: ["Bookings"],
  summary:
    "Booked time slots for a given business + date — used by the booking UI",
  request: { query: bookedSlotsQuerySchema },
  responses: { 200: ok(bookedSlotsResponseSchema) },
});

registry.registerPath({
  method: "patch",
  path: "/bookings/{id}/cancel",
  tags: ["Bookings"],
  summary: "Cancel a booking (owner only)",
  security: [{ [bearerAuth.name]: [] }],
  request: { params: bookingIdParamSchema },
  responses: {
    200: ok(bookingSchema),
    403: error("Forbidden"),
    404: error("Not found"),
  },
});

// --- Reviews ------------------------------------------------------------
registry.registerPath({
  method: "get",
  path: "/reviews",
  tags: ["Reviews"],
  summary: "List reviews (optionally filtered by businessId)",
  request: { query: reviewQuerySchema },
  responses: { 200: ok(reviewListResponseSchema) },
});

registry.registerPath({
  method: "post",
  path: "/reviews",
  tags: ["Reviews"],
  summary:
    "Create a review (1-5 stars). Recomputes the business' ratingAvg/ratingCount.",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: {
      content: { "application/json": { schema: createReviewBodySchema } },
    },
  },
  responses: {
    201: created(reviewSchema),
    404: error("Business not found"),
    409: error("Already reviewed by this user"),
  },
});

registry.registerPath({
  method: "delete",
  path: "/reviews/{id}",
  tags: ["Reviews"],
  summary: "Delete a review (author or admin)",
  security: [{ [bearerAuth.name]: [] }],
  request: { params: reviewIdParamSchema },
  responses: {
    204: noContent("Deleted"),
    403: error("Forbidden"),
    404: error("Not found"),
  },
});

// --- Generate the document ----------------------------------------------
const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiSpec = generator.generateDocument({
  openapi: "3.0.3",
  info: {
    title: "FixItNow API",
    version: "0.2.0",
    description:
      "Backend for FixItNow — categories, businesses, bookings, reviews. " +
      "Authenticated routes use a Bearer access token (15m TTL). The " +
      "refresh token (7d TTL) lives in an HttpOnly cookie scoped to /auth. " +
      "This spec is generated programmatically from the same Zod schemas " +
      "used for request validation, so it cannot drift from the wire contract.",
  },
  servers: [{ url: "http://localhost:4000", description: "Local development" }],
});
