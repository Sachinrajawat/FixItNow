import { Router } from "express";
import {
  categoryIdParamSchema,
  createCategoryBodySchema,
  updateCategoryBodySchema,
} from "@fixitnow/types";

import { validate } from "../middlewares/validate";
import { requireAuth, requireRole } from "../middlewares/requireAuth";
import { cache } from "../middlewares/cache";
import { rateLimit } from "../middlewares/rateLimit";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "../controllers/categories.controller";

const router = Router();

// Public reads — cached for 60s.
router.get(
  "/",
  cache({ keyFn: () => "categories:list", ttl: 60, prefix: "categories" }),
  listCategories
);
router.get(
  "/:id",
  validate({ params: categoryIdParamSchema }),
  cache({
    keyFn: (req) => `categories:by:${req.params.id.toLowerCase()}`,
    ttl: 60,
    prefix: "categories",
  }),
  getCategory
);

// Admin-only writes — rate-limited to 30/min.
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  rateLimit({ name: "categories.create", max: 30, windowSec: 60 }),
  validate({ body: createCategoryBodySchema }),
  createCategory
);
router.patch(
  "/:id",
  requireAuth,
  requireRole("admin"),
  rateLimit({ name: "categories.update", max: 60, windowSec: 60 }),
  validate({
    params: categoryIdParamSchema,
    body: updateCategoryBodySchema,
  }),
  updateCategory
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  rateLimit({ name: "categories.delete", max: 30, windowSec: 60 }),
  validate({ params: categoryIdParamSchema }),
  deleteCategory
);

export default router;
