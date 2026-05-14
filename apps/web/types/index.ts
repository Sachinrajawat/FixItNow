/**
 * Re-exports of the API contract types so app code can `import from "@/types"`
 * without reaching into `@fixitnow/types` directly. The Zod schemas in
 * `@fixitnow/types` are the single source of truth for HTTP payloads.
 */

export type {
  ApiError,
  Booking,
  BookingStatus,
  Business,
  BusinessImage,
  BusinessListResponse,
  Category,
  CategoryListResponse,
  CreateBookingBody,
  CreateBusinessBody,
  CreateReviewBody,
  Review,
  ReviewListResponse,
  User,
  UserRole,
} from "@fixitnow/types";

export type BookingTabType = "booked" | "completed";
