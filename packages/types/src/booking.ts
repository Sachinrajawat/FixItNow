import { z } from "zod";
import { businessSchema } from "./business";
import { paginatedResponseSchema, paginationQuerySchema } from "./common";

export const bookingStatusSchema = z.enum(["booked", "completed", "cancelled"]);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

/** ISO date for the appointment (YYYY-MM-DD). */
export const bookingDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

/** 24-hour HH:MM time (e.g. "10:30", "14:00"). */
export const bookingTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:MM (24h)");

export const bookingSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  userId: z.string(),
  date: bookingDateSchema,
  time: bookingTimeSchema,
  status: bookingStatusSchema,
  /** Populated on list-mine so the UI can render full booking cards. */
  business: businessSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Booking = z.infer<typeof bookingSchema>;

export const createBookingBodySchema = z.object({
  businessId: z.string().min(1),
  date: bookingDateSchema,
  time: bookingTimeSchema,
});

export type CreateBookingBody = z.infer<typeof createBookingBodySchema>;

export const bookingIdParamSchema = z.object({
  id: z.string().min(1),
});

export const bookingListMineQuerySchema = paginationQuerySchema.extend({
  status: bookingStatusSchema.optional(),
});

export type BookingListMineQuery = z.infer<typeof bookingListMineQuerySchema>;

export const bookedSlotsQuerySchema = z.object({
  businessId: z.string().min(1),
  date: bookingDateSchema,
});

export type BookedSlotsQuery = z.infer<typeof bookedSlotsQuerySchema>;

export const bookedSlotsResponseSchema = z.object({
  date: bookingDateSchema,
  businessId: z.string(),
  slots: z.array(bookingTimeSchema),
});

export type BookedSlotsResponse = z.infer<typeof bookedSlotsResponseSchema>;

export const bookingListResponseSchema = paginatedResponseSchema(bookingSchema);
export type BookingListResponse = z.infer<typeof bookingListResponseSchema>;
