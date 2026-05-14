import { z } from "zod";

export const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(80),
  iconUrl: z.string().url(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Category = z.infer<typeof categorySchema>;

export const createCategoryBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  iconUrl: z.string().url(),
});

export type CreateCategoryBody = z.infer<typeof createCategoryBodySchema>;

export const updateCategoryBodySchema = createCategoryBodySchema.partial();
export type UpdateCategoryBody = z.infer<typeof updateCategoryBodySchema>;

/**
 * URL param schemas. Categories can be addressed by either ObjectId or slug,
 * so we accept any non-empty string here and resolve in the controller.
 */
export const categoryIdParamSchema = z.object({
  id: z.string().min(1),
});

export const categoryListResponseSchema = z.object({
  items: z.array(categorySchema),
});

export type CategoryListResponse = z.infer<typeof categoryListResponseSchema>;
