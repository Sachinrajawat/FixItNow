import { z } from "zod";
import { paginatedResponseSchema, paginationQuerySchema } from "./common";

export const reviewSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  userId: z.string(),
  userName: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Review = z.infer<typeof reviewSchema>;

export const createReviewBodySchema = z.object({
  businessId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export type CreateReviewBody = z.infer<typeof createReviewBodySchema>;

export const reviewIdParamSchema = z.object({
  id: z.string().min(1),
});

export const reviewQuerySchema = paginationQuerySchema.extend({
  /** Filter to a single business by id. */
  businessId: z.string().min(1).optional(),
});

export type ReviewQuery = z.infer<typeof reviewQuerySchema>;

export const reviewListResponseSchema = paginatedResponseSchema(reviewSchema);
export type ReviewListResponse = z.infer<typeof reviewListResponseSchema>;
