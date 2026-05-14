import { z } from "zod";

export const reviewSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  userId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Review = z.infer<typeof reviewSchema>;

export const createReviewBodySchema = z.object({
  businessId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export type CreateReviewBody = z.infer<typeof createReviewBodySchema>;
