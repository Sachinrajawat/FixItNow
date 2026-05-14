import { Schema, model, Types, type Model } from "mongoose";
import { slugify } from "./Category";
import { jsonTransform } from "./_transform";

export interface BusinessImage {
  url: string;
  alt?: string;
}

export interface BusinessDoc {
  name: string;
  slug: string;
  about: string;
  address: string;
  contactPerson: string;
  email: string;
  phone?: string;
  images: BusinessImage[];
  category: Types.ObjectId;
  owner?: Types.ObjectId;
  ratingAvg: number;
  ratingCount: number;
  location?: { type: "Point"; coordinates: [number, number] };
  createdAt: Date;
  updatedAt: Date;
}

const businessImageSchema = new Schema<BusinessImage>(
  {
    url: { type: String, required: true },
    alt: { type: String },
  },
  { _id: false }
);

const businessSchema = new Schema<BusinessDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      maxlength: 200,
      index: true,
    },
    about: { type: String, required: true, maxlength: 2000 },
    address: { type: String, required: true, maxlength: 300 },
    contactPerson: { type: String, required: true, maxlength: 160 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, maxlength: 40 },
    images: { type: [businessImageSchema], default: [] },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
  },
  {
    timestamps: true,
    toJSON: { transform: jsonTransform() },
  }
);

// --- Indexes ---
// Full-text search across name + about for the search bar.
businessSchema.index(
  { name: "text", about: "text" },
  { weights: { name: 5, about: 1 }, name: "business_text_idx" }
);
// Compound: category + ratingAvg desc for "top in <category>" queries.
businessSchema.index({ category: 1, ratingAvg: -1 });
// Geospatial for "near me" queries.
businessSchema.index({ location: "2dsphere" });

businessSchema.pre("validate", function (next) {
  if (this.name && !this.slug) {
    // Append a short hash so the slug is still unique even if two businesses
    // share a name. Real systems often append a city — Step 3 will revisit.
    const suffix = new Types.ObjectId().toHexString().slice(-6);
    this.slug = `${slugify(this.name)}-${suffix}`;
  }
  // Normalise an empty location so the GeoJSON sub-document is omitted.
  if (this.location && !this.location.coordinates?.length) {
    this.location = undefined;
  }
  next();
});

export const Business: Model<BusinessDoc> = model<BusinessDoc>(
  "Business",
  businessSchema
);
