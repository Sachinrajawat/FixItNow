/**
 * Shared domain types for FixItNow.
 *
 * In Phase 2 these will be derived from the API's Zod schemas (the single
 * source of truth). For now they reflect what the Hygraph CMS returns.
 */

export type Id = string;

export interface Category {
  id: Id;
  name: string;
  bgcolor?: { hex: string };
  icon: { url: string };
}

export interface BusinessImage {
  url: string;
}

export interface Business {
  id: Id;
  name: string;
  about?: string;
  address?: string;
  contactPerson?: string;
  email?: string;
  images?: BusinessImage[];
  category?: { name: string };
}

export interface Booking {
  id: Id;
  /** Stored as DD-MM-YYYY in Hygraph. */
  date: string;
  time: string;
  userEmail?: string;
  userName?: string;
  businessList?: Pick<
    Business,
    "name" | "contactPerson" | "address" | "images"
  >;
}

export type BookingTabType = "booked" | "completed";
