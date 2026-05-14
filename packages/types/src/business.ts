import { z } from "zod";
import { categorySchema } from "./category";
import { paginationQuerySchema } from "./common";

export const businessImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
});

export const businessSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(160),
  slug: z.string().min(1).max(160),
  about: z.string().max(2000),
  address: z.string().max(300),
  contactPerson: z.string().max(160),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  images: z.array(businessImageSchema),
  category: categorySchema,
  ratingAvg: z.number().min(0).max(5).default(0),
  ratingCount: z.number().int().min(0).default(0),
  /** GeoJSON Point for "near me" queries (lng, lat). */
  location: z
    .object({
      type: z.literal("Point"),
      coordinates: z.tuple([z.number(), z.number()]),
    })
    .optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Business = z.infer<typeof businessSchema>;

export const createBusinessBodySchema = z.object({
  name: z.string().trim().min(2).max(160),
  about: z.string().trim().min(10).max(2000),
  address: z.string().trim().min(5).max(300),
  contactPerson: z.string().trim().min(2).max(160),
  email: z.string().email(),
  phone: z.string().trim().max(40).optional(),
  images: z.array(businessImageSchema).min(1).max(20),
  categoryId: z.string(),
  longitude: z.number().min(-180).max(180).optional(),
  latitude: z.number().min(-90).max(90).optional(),
});

export type CreateBusinessBody = z.infer<typeof createBusinessBodySchema>;

export const businessQuerySchema = paginationQuerySchema.extend({
  category: z.string().trim().min(1).optional(),
  q: z.string().trim().min(1).optional(),
  /** Optional "near me": "lng,lat" plus radius in meters. */
  near: z
    .string()
    .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, "Expected 'lng,lat'")
    .optional(),
  radius: z.coerce.number().int().min(100).max(50000).default(5000),
});

export type BusinessQuery = z.infer<typeof businessQuerySchema>;
