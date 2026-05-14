import { Schema, model, Types, type Model } from "mongoose";
import { jsonTransform } from "./_transform";

export type BookingStatus = "booked" | "completed" | "cancelled";

export interface BookingDoc {
  business: Types.ObjectId;
  user: Types.ObjectId;
  /** ISO date YYYY-MM-DD. */
  date: string;
  /** 24-hour HH:MM. */
  time: string;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<BookingDoc>(
  {
    business: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    time: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    status: {
      type: String,
      enum: ["booked", "completed", "cancelled"],
      default: "booked",
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: jsonTransform({ business: "businessId", user: "userId" }),
    },
  }
);

// One business cannot be double-booked for the same date+time, but the
// constraint should only apply to *active* bookings — cancelled slots have
// to be re-bookable. A partial unique index gives us exactly that.
bookingSchema.index(
  { business: 1, date: 1, time: 1 },
  {
    unique: true,
    name: "business_date_time_active_unique",
    partialFilterExpression: { status: "booked" },
  }
);
// Fast lookups of "my bookings" sorted newest-first.
bookingSchema.index({ user: 1, createdAt: -1 });

export const Booking: Model<BookingDoc> = model<BookingDoc>(
  "Booking",
  bookingSchema
);
