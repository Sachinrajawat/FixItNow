import { Router } from "express";
import {
  createReviewBodySchema,
  reviewIdParamSchema,
  reviewQuerySchema,
} from "@fixitnow/types";

import { validate } from "../middlewares/validate";
import { requireAuth } from "../middlewares/requireAuth";
import { rateLimit } from "../middlewares/rateLimit";
import {
  createReview,
  deleteReview,
  listReviews,
} from "../controllers/reviews.controller";

const router = Router();

router.get("/", validate({ query: reviewQuerySchema }), listReviews);

router.post(
  "/",
  requireAuth,
  rateLimit({ name: "reviews.create", max: 10, windowSec: 60 }),
  validate({ body: createReviewBodySchema }),
  createReview
);

router.delete(
  "/:id",
  requireAuth,
  rateLimit({ name: "reviews.delete", max: 30, windowSec: 60 }),
  validate({ params: reviewIdParamSchema }),
  deleteReview
);

export default router;
