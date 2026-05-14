import type { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import {
  type Category as CategoryDto,
  type CategoryListResponse,
  type CreateCategoryBody,
  type UpdateCategoryBody,
} from "@fixitnow/types";

import { Category } from "../models/Category";
import { Business } from "../models/Business";
import { AppError } from "../utils/AppError";
import { serializeCategory } from "../utils/serializers";
import { invalidateCachePrefix } from "../middlewares/cache";

const CACHE_PREFIX = "categories";

const isObjectId = (v: string): boolean => Types.ObjectId.isValid(v);

/** GET /categories — public list (cached). */
export async function listCategories(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const docs = await Category.find().sort({ name: 1 }).lean();
    const items: CategoryDto[] = docs.map(serializeCategory);
    const body: CategoryListResponse = { items };
    res.json(body);
  } catch (e) {
    next(e);
  }
}

/** GET /categories/:id — by id OR slug. */
export async function getCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const doc = isObjectId(id)
      ? await Category.findById(id).lean()
      : await Category.findOne({ slug: id.toLowerCase() }).lean();
    if (!doc) throw AppError.notFound("Category");
    res.json(serializeCategory(doc));
  } catch (e) {
    next(e);
  }
}

/** POST /categories — admin only. */
export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body as CreateCategoryBody;
    const exists = await Category.findOne({ name: body.name }).lean();
    if (exists) throw AppError.conflict("A category with that name exists");

    const doc = await Category.create(body);
    await invalidateCachePrefix(CACHE_PREFIX);
    res.status(201).json(serializeCategory(doc.toObject()));
  } catch (e) {
    next(e);
  }
}

/** PATCH /categories/:id — admin only. */
export async function updateCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) throw AppError.badRequest("Invalid category id");
    const body = req.body as UpdateCategoryBody;

    const doc = await Category.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!doc) throw AppError.notFound("Category");

    await invalidateCachePrefix(CACHE_PREFIX);
    res.json(serializeCategory(doc));
  } catch (e) {
    next(e);
  }
}

/** DELETE /categories/:id — admin only; refuses if businesses reference it. */
export async function deleteCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) throw AppError.badRequest("Invalid category id");

    const inUse = await Business.exists({ category: id });
    if (inUse) {
      throw AppError.conflict(
        "Category is still referenced by one or more businesses"
      );
    }

    const doc = await Category.findByIdAndDelete(id).lean();
    if (!doc) throw AppError.notFound("Category");

    await invalidateCachePrefix(CACHE_PREFIX);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
