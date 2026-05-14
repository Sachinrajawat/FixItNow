import type { NextFunction, Request, Response } from "express";
import { Types, type FilterQuery } from "mongoose";
import {
  type BookedSlotsQuery,
  type BookedSlotsResponse,
  type Booking as BookingDto,
  type BookingListMineQuery,
  type BookingListResponse,
  type CreateBookingBody,
} from "@fixitnow/types";

import { Booking, type BookingDoc } from "../models/Booking";
import { Business } from "../models/Business";
import { AppError } from "../utils/AppError";
import { serializeBooking, type BookingLike } from "../utils/serializers";

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
 * POST /bookings — creates a booking for the authenticated user. The unique
 * partial index on (business, date, time, status="booked") makes the
 * "already taken" case race-safe: two concurrent inserts will see exactly
 * one succeed and one fail with E11000, which we map to a 409.
 */
export async function createBooking(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.auth) throw AppError.unauthorized();
    const body = req.body as CreateBookingBody;

    if (!isObjectId(body.businessId)) {
      throw AppError.badRequest("Invalid businessId");
    }
    const business = await Business.findById(body.businessId)
      .select("_id")
      .lean();
    if (!business) throw AppError.notFound("Business");

    try {
      const created = await Booking.create({
        business: business._id,
        user: new Types.ObjectId(req.auth.userId),
        date: body.date,
        time: body.time,
        status: "booked",
      });
      res
        .status(201)
        .json(serializeBooking(created.toObject() as unknown as BookingLike));
    } catch (e) {
      if (isDuplicateKeyError(e)) {
        throw AppError.conflict(
          "That time slot is already booked for this business"
        );
      }
      throw e;
    }
  } catch (e) {
    next(e);
  }
}

/** GET /bookings/mine — paginated list of the caller's bookings, newest first. */
export async function listMyBookings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.auth) throw AppError.unauthorized();
    const query = req.query as unknown as BookingListMineQuery;

    const filter: FilterQuery<BookingDoc> = {
      user: new Types.ObjectId(req.auth.userId),
    };
    if (query.status) filter.status = query.status;

    const total = await Booking.countDocuments(filter);
    const skip = (query.page - 1) * query.limit;
    const docs = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .populate({ path: "business", populate: { path: "category" } })
      .lean();

    const items: BookingDto[] = docs.map((d) =>
      serializeBooking(d as unknown as BookingLike)
    );
    const body: BookingListResponse = {
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

/**
 * GET /bookings/slots?businessId=&date=YYYY-MM-DD
 *
 * Public, lightweight endpoint used by the booking UI to grey out taken
 * time slots. Returns only times where status === "booked".
 */
export async function listBookedSlots(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const query = req.query as unknown as BookedSlotsQuery;
    if (!isObjectId(query.businessId)) {
      throw AppError.badRequest("Invalid businessId");
    }

    const rows = await Booking.find({
      business: new Types.ObjectId(query.businessId),
      date: query.date,
      status: "booked",
    })
      .select("time")
      .lean();

    const body: BookedSlotsResponse = {
      businessId: query.businessId,
      date: query.date,
      slots: rows.map((r) => r.time),
    };
    res.json(body);
  } catch (e) {
    next(e);
  }
}

/** PATCH /bookings/:id/cancel — owner only; idempotent. */
export async function cancelBooking(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.auth) throw AppError.unauthorized();
    const { id } = req.params;
    if (!isObjectId(id)) throw AppError.badRequest("Invalid booking id");

    const existing = await Booking.findById(id);
    if (!existing) throw AppError.notFound("Booking");

    const isOwner = existing.user.toString() === req.auth.userId;
    if (!isOwner && req.auth.role !== "admin") throw AppError.forbidden();

    if (existing.status !== "cancelled") {
      existing.status = "cancelled";
      await existing.save();
    }

    res.json(serializeBooking(existing.toObject() as unknown as BookingLike));
  } catch (e) {
    next(e);
  }
}
