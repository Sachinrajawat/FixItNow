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
