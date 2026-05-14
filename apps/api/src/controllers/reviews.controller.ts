import type { NextFunction, Request, Response } from "express";
import { Types, type FilterQuery, type HydratedDocument } from "mongoose";
import {
  type CreateReviewBody,
  type Review as ReviewDto,
  type ReviewListResponse,
  type ReviewQuery,
} from "@fixitnow/types";

import { Review, type ReviewDoc } from "../models/Review";
import { Business } from "../models/Business";
import { AppError } from "../utils/AppError";
import { serializeReview, type ReviewLike } from "../utils/serializers";
import { invalidateCachePrefix } from "../middlewares/cache";

const isObjectId = (v: string): boolean => Types.ObjectId.isValid(v);

interface MongoDuplicateKeyError {
  code: number;
  keyValue?: Record<string, unknown>;
}

const isDuplicateKeyError = (e: unknown): e is MongoDuplicateKeyError =>
  typeof e === "object" &&
  e !== null &&
  "code" in e &&
  (e as { code: unknown }).code === 11000;

/**
 * Recompute a business's ratingAvg + ratingCount from its reviews. Run after
 * every create/delete so the cached aggregates on the Business document stay
 * exact (cheaper than $lookup at read time and great for list endpoints).
 *
 * The compute is idempotent: re-running over the same review set always
 * yields the same numbers, so we don't need a transaction to keep them in
 * sync — even if a second concurrent writer recomputes after us, the result
 * is identical.
 */
async function recomputeBusinessRating(
  businessId: Types.ObjectId
): Promise<void> {
  const [agg] = await Review.aggregate<{
    _id: null;
    avg: number;
    count: number;
  }>([
    { $match: { business: businessId } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const ratingAvg = agg ? Math.round(agg.avg * 10) / 10 : 0;
  const ratingCount = agg ? agg.count : 0;

  await Business.updateOne(
    { _id: businessId },
    { $set: { ratingAvg, ratingCount } }
  );
}

/** POST /reviews — one review per (user, business). */
export async function createReview(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.auth) throw AppError.unauthorized();
    const body = req.body as CreateReviewBody;

    if (!isObjectId(body.businessId)) {
      throw AppError.badRequest("Invalid businessId");
    }
    const business = await Business.findById(body.businessId)
      .select("_id")
      .lean();
    if (!business) throw AppError.notFound("Business");

    let created: HydratedDocument<ReviewDoc>;
    try {
      created = await Review.create({
        business: business._id,
        user: new Types.ObjectId(req.auth.userId),
        rating: body.rating,
        comment: body.comment,
      });
    } catch (e) {
      if (isDuplicateKeyError(e)) {
        throw AppError.conflict("You have already reviewed this business");
      }
      throw e;
    }

    await recomputeBusinessRating(business._id as Types.ObjectId);
    await invalidateCachePrefix("businesses");
    res
      .status(201)
      .json(serializeReview(created.toObject() as unknown as ReviewLike));
  } catch (e) {
    next(e);
  }
}

/** GET /reviews?businessId=&page=&limit= */
export async function listReviews(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const query = req.query as unknown as ReviewQuery;
    const filter: FilterQuery<ReviewDoc> = {};
    if (query.businessId) {
      if (!isObjectId(query.businessId)) {
        throw AppError.badRequest("Invalid businessId");
      }
      filter.business = new Types.ObjectId(query.businessId);
    }

    const total = await Review.countDocuments(filter);
    const skip = (query.page - 1) * query.limit;
    const docs = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .populate("user", "name")
      .lean();

    const items: ReviewDto[] = docs.map((d) =>
      serializeReview(d as unknown as ReviewLike)
    );
    const body: ReviewListResponse = {
      items,
      page: query.page,
      limit: query.limit,
      total,
    };
    res.json(body);
  } catch (e) {
    next(e);
  }
}

/** DELETE /reviews/:id — review author OR admin. */
export async function deleteReview(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.auth) throw AppError.unauthorized();
    const { id } = req.params;
    if (!isObjectId(id)) throw AppError.badRequest("Invalid review id");

    const existing = await Review.findById(id);
    if (!existing) throw AppError.notFound("Review");

    const isAuthor = existing.user.toString() === req.auth.userId;
    if (!isAuthor && req.auth.role !== "admin") throw AppError.forbidden();

    const businessId = existing.business as Types.ObjectId;
    await existing.deleteOne();
    await recomputeBusinessRating(businessId);
    await invalidateCachePrefix("businesses");
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
