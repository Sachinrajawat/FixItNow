import type { NextFunction, Request, Response } from "express";
import { Types, type FilterQuery } from "mongoose";
import {
  type Business as BusinessDto,
  type BusinessListResponse,
  type BusinessQuery,
  type CreateBusinessBody,
  type UpdateBusinessBody,
} from "@fixitnow/types";

import { Business } from "../models/Business";
import { Category } from "../models/Category";
import { AppError } from "../utils/AppError";
import { serializeBusiness, type BusinessLike } from "../utils/serializers";
import { invalidateCachePrefix } from "../middlewares/cache";

const CACHE_PREFIX = "businesses";

const isObjectId = (v: string): boolean => Types.ObjectId.isValid(v);

/**
 * Resolve a category identifier — accepts an ObjectId, slug, or name. Returns
 * the matching ObjectId or null if the category does not exist.
 */
async function resolveCategoryId(
  identifier: string
): Promise<Types.ObjectId | null> {
  if (isObjectId(identifier)) {
    const byId = await Category.findById(identifier).select("_id").lean();
    if (byId) return byId._id as Types.ObjectId;
  }
  const slug = identifier.toLowerCase();
  const bySlug = await Category.findOne({ slug }).select("_id").lean();
  if (bySlug) return bySlug._id as Types.ObjectId;
  const byName = await Category.findOne({ name: identifier })
    .select("_id")
    .lean();
  return (byName?._id as Types.ObjectId) ?? null;
}

/**
 * GET /businesses
 *   ?page&limit                — pagination
 *   ?category=slug|id|name     — category filter (resolved server-side)
 *   ?q=string                  — full-text search on name + about
 *   ?near=lng,lat&radius=meters - geo search
 *
 * When `q` is supplied we sort by the text score, otherwise by rating desc.
 */
export async function listBusinesses(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const query = req.query as unknown as BusinessQuery;
    const filter: FilterQuery<BusinessLike> = {};
    const sort: Record<string, 1 | -1 | { $meta: "textScore" }> = {};
    const projection: Record<string, unknown> = {};

    if (query.category) {
      const catId = await resolveCategoryId(query.category);
      if (!catId) {
        const body: BusinessListResponse = {
          items: [],
          page: query.page,
          limit: query.limit,
          total: 0,
        };
        res.json(body);
        return;
      }
      filter.category = catId;
    }

    if (query.q) {
      filter.$text = { $search: query.q };
      projection.score = { $meta: "textScore" };
      sort.score = { $meta: "textScore" };
    } else {
      sort.ratingAvg = -1;
      sort.createdAt = -1;
    }

    if (query.near) {
      const [lngStr, latStr] = query.near.split(",");
      const longitude = Number(lngStr);
      const latitude = Number(latStr);
      filter.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          $maxDistance: query.radius,
        },
      };
      // $near can't combine with $text-score sort, so drop the score sort.
      delete sort.score;
      if (!query.q) {
        // $near already implies a distance sort; clear the rating sort.
        Object.keys(sort).forEach((k) => delete sort[k]);
      }
    }

    const total = filter.location
      ? // $near already limits by radius and is incompatible with countDocuments
        // semantics on every Mongo build, so when geo is used we run the same
        // query without pagination and take its length. The result set is
        // bounded by $maxDistance so this stays cheap.
        (await Business.find(filter).select("_id").lean()).length
      : await Business.countDocuments(filter);

    const skip = (query.page - 1) * query.limit;
    const docs = await Business.find(filter, projection)
      .sort(sort)
      .skip(skip)
      .limit(query.limit)
      .populate("category")
      .lean();

    const items: BusinessDto[] = docs.map((d) =>
      serializeBusiness(d as unknown as BusinessLike)
    );
    const body: BusinessListResponse = {
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

/** GET /businesses/:id — by id OR slug. */
export async function getBusiness(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const doc = isObjectId(id)
      ? await Business.findById(id).populate("category").lean()
      : await Business.findOne({ slug: id.toLowerCase() })
          .populate("category")
          .lean();
    if (!doc) throw AppError.notFound("Business");
    res.json(serializeBusiness(doc as unknown as BusinessLike));
  } catch (e) {
    next(e);
  }
}

/** POST /businesses — auth required; the caller becomes the owner. */
export async function createBusiness(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.auth) throw AppError.unauthorized();
    const body = req.body as CreateBusinessBody;

    const category = await Category.findById(body.categoryId).lean();
    if (!category) throw AppError.badRequest("Unknown categoryId");

    const location =
      typeof body.longitude === "number" && typeof body.latitude === "number"
        ? {
            type: "Point" as const,
            coordinates: [body.longitude, body.latitude] as [number, number],
          }
        : undefined;

    const created = await Business.create({
      name: body.name,
      about: body.about,
      address: body.address,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      images: body.images,
      category: category._id,
      owner: new Types.ObjectId(req.auth.userId),
      location,
    });

    const populated = await Business.findById(created._id)
      .populate("category")
      .lean();
    if (!populated) throw AppError.internal();

    await invalidateCachePrefix(CACHE_PREFIX);
    res
      .status(201)
      .json(serializeBusiness(populated as unknown as BusinessLike));
  } catch (e) {
    next(e);
  }
}

/** PATCH /businesses/:id — owner OR admin. */
export async function updateBusiness(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.auth) throw AppError.unauthorized();
    const { id } = req.params;
    if (!isObjectId(id)) throw AppError.badRequest("Invalid business id");

    const existing = await Business.findById(id);
    if (!existing) throw AppError.notFound("Business");

    const isOwner = existing.owner?.toString() === req.auth.userId;
    if (!isOwner && req.auth.role !== "admin") {
      throw AppError.forbidden();
    }

    const body = req.body as UpdateBusinessBody;
    if (body.name !== undefined) existing.name = body.name;
    if (body.about !== undefined) existing.about = body.about;
    if (body.address !== undefined) existing.address = body.address;
    if (body.contactPerson !== undefined) {
      existing.contactPerson = body.contactPerson;
    }
    if (body.email !== undefined) existing.email = body.email;
    if (body.phone !== undefined) existing.phone = body.phone;
    if (body.images !== undefined) existing.images = body.images;

    if (body.categoryId !== undefined) {
      const cat = await Category.findById(body.categoryId).select("_id").lean();
      if (!cat) throw AppError.badRequest("Unknown categoryId");
      existing.category = cat._id as Types.ObjectId;
    }

    if (
      typeof body.longitude === "number" &&
      typeof body.latitude === "number"
    ) {
      existing.location = {
        type: "Point",
        coordinates: [body.longitude, body.latitude],
      };
    }

    await existing.save();
    const populated = await Business.findById(existing._id)
      .populate("category")
      .lean();
    if (!populated) throw AppError.internal();
    await invalidateCachePrefix(CACHE_PREFIX);
    res.json(serializeBusiness(populated as unknown as BusinessLike));
  } catch (e) {
    next(e);
  }
}

/** DELETE /businesses/:id — owner OR admin. */
export async function deleteBusiness(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.auth) throw AppError.unauthorized();
    const { id } = req.params;
    if (!isObjectId(id)) throw AppError.badRequest("Invalid business id");

    const existing = await Business.findById(id).select("owner");
    if (!existing) throw AppError.notFound("Business");

    const isOwner = existing.owner?.toString() === req.auth.userId;
    if (!isOwner && req.auth.role !== "admin") {
      throw AppError.forbidden();
    }

    await existing.deleteOne();
    await invalidateCachePrefix(CACHE_PREFIX);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
