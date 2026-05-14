import { Schema, model, Types, type Model } from "mongoose";
import { jsonTransform } from "./_transform";

export interface ReviewDoc {
  business: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<ReviewDoc>(
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
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: jsonTransform({ business: "businessId", user: "userId" }),
    },
  }
);

// One review per (user, business).
reviewSchema.index(
  { business: 1, user: 1 },
  { unique: true, name: "review_business_user_unique" }
);

export const Review: Model<ReviewDoc> = model<ReviewDoc>(
  "Review",
  reviewSchema
);
