/**
 * Helpers that turn Mongoose documents/POJOs into the wire shape that the
 * API contract (in @fixitnow/types) defines. Centralising this keeps the
 * `toJSON` transform on the schema honest and lets us populate references
 * without leaking ObjectIds.
 */
import type { Types } from "mongoose";
import type { Booking, Business, Category, Review } from "@fixitnow/types";

type Stringifiable = { toString(): string };

const toId = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  return (v as Stringifiable).toString();
};

const toIso = (v: unknown): string => {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return new Date().toISOString();
};

export interface CategoryLike {
  _id: Types.ObjectId | string;
  name: string;
  slug: string;
  iconUrl: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function serializeCategory(doc: CategoryLike): Category {
  return {
    id: toId(doc._id),
    name: doc.name,
    slug: doc.slug,
    iconUrl: doc.iconUrl,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export interface BusinessImageLike {
  url: string;
  alt?: string | null;
}

export interface BusinessLike {
  _id: Types.ObjectId | string;
  name: string;
  slug: string;
  about: string;
  address: string;
  contactPerson: string;
  email: string;
  phone?: string | null;
  images: BusinessImageLike[];
  category: CategoryLike | Types.ObjectId | string;
  ratingAvg?: number;
  ratingCount?: number;
  location?: { type: "Point"; coordinates: [number, number] } | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function serializeBusiness(doc: BusinessLike): Business {
  // A populated category is a plain object with a name; an unpopulated one
  // is just an ObjectId. ObjectIds happen to satisfy `'_id' in v` because of
  // their internal getters, so we look for a real schema field instead.
  const cat = doc.category as unknown;
  const populated =
    typeof cat === "object" &&
    cat !== null &&
    typeof (cat as { name?: unknown }).name === "string";

  if (!populated) {
    throw new Error("serializeBusiness expected a populated category document");
  }

  const category = serializeCategory(doc.category as CategoryLike);

  return {
    id: toId(doc._id),
    name: doc.name,
    slug: doc.slug,
    about: doc.about,
    address: doc.address,
    contactPerson: doc.contactPerson,
    email: doc.email,
    phone: doc.phone ?? undefined,
    images: doc.images.map((i) => ({
      url: i.url,
      alt: i.alt ?? undefined,
    })),
    category,
    ratingAvg: doc.ratingAvg ?? 0,
    ratingCount: doc.ratingCount ?? 0,
    location: doc.location
      ? { type: "Point", coordinates: doc.location.coordinates }
      : undefined,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export interface BookingLike {
  _id: Types.ObjectId | string;
  business: Types.ObjectId | string | BusinessLike;
  user: Types.ObjectId | string;
  date: string;
  time: string;
  status: "booked" | "completed" | "cancelled";
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function serializeBooking(doc: BookingLike): Booking {
  const biz = doc.business as unknown;
  const businessIsPopulated =
    typeof biz === "object" &&
    biz !== null &&
    typeof (biz as { name?: unknown }).name === "string";

  return {
    id: toId(doc._id),
    businessId: businessIsPopulated
      ? toId((doc.business as BusinessLike)._id)
      : toId(doc.business as Stringifiable),
    userId: toId(doc.user),
    date: doc.date,
    time: doc.time,
    status: doc.status,
    business: businessIsPopulated
      ? serializeBusiness(doc.business as BusinessLike)
      : undefined,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export interface ReviewLike {
  _id: Types.ObjectId | string;
  business: Types.ObjectId | string;
  user: Types.ObjectId | string | { _id: Types.ObjectId; name?: string };
  rating: number;
  comment?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function serializeReview(doc: ReviewLike): Review {
  const u = doc.user as unknown;
  const userPopulated =
    typeof u === "object" &&
    u !== null &&
    typeof (u as { name?: unknown }).name === "string";

  return {
    id: toId(doc._id),
    businessId: toId(doc.business as Stringifiable),
    userId: userPopulated
      ? toId((doc.user as { _id: Types.ObjectId })._id)
      : toId(doc.user as Stringifiable),
    userName: userPopulated ? (doc.user as { name?: string }).name : undefined,
    rating: doc.rating,
    comment: doc.comment ?? undefined,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}
