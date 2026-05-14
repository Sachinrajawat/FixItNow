import { Router } from "express";
import {
  businessIdParamSchema,
  businessQuerySchema,
  createBusinessBodySchema,
  updateBusinessBodySchema,
} from "@fixitnow/types";

import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/requireAuth";
import { cache } from "../middlewares/cache";
import { rateLimit } from "../middlewares/rateLimit";
import {
  createBusiness,
  deleteBusiness,
  getBusiness,
  listBusinesses,
  updateBusiness,
} from "../controllers/businesses.controller";

const router = Router();

/**
 * Cache key encodes the entire normalised query string so that different
 * filters/pages don't collide. The cache is invalidated on any write to a
 * business and on every category mutation that could affect a listing.
 */
const businessListCacheKey = (req: import("express").Request): string => {
  const q = req.query as Record<string, string | undefined>;
  const parts = [
    q.page ?? "1",
    q.limit ?? "20",
    q.category ?? "_",
    q.q ?? "_",
    q.near ?? "_",
    q.radius ?? "_",
  ];
  return `businesses:list:${parts.join("|")}`;
};

router.get(
  "/",
  validate({ query: businessQuerySchema }),
  cache({ keyFn: businessListCacheKey, ttl: 60, prefix: "businesses" }),
  listBusinesses
);

router.get(
  "/:id",
  validate({ params: businessIdParamSchema }),
  cache({
    keyFn: (req) => `businesses:by:${req.params.id.toLowerCase()}`,
    ttl: 60,
    prefix: "businesses",
  }),
  getBusiness
);

router.post(
  "/",
  requireAuth,
  rateLimit({ name: "businesses.create", max: 10, windowSec: 60 }),
  validate({ body: createBusinessBodySchema }),
  createBusiness
);

router.patch(
  "/:id",
  requireAuth,
  rateLimit({ name: "businesses.update", max: 30, windowSec: 60 }),
  validate({
    params: businessIdParamSchema,
    body: updateBusinessBodySchema,
  }),
  updateBusiness
);

router.delete(
  "/:id",
  requireAuth,
  rateLimit({ name: "businesses.delete", max: 10, windowSec: 60 }),
  validate({ params: businessIdParamSchema }),
  deleteBusiness
);

export default router;
