import { Schema, model, type Model } from "mongoose";
import { jsonTransform } from "./_transform";

export interface CategoryDoc {
  name: string;
  slug: string;
  iconUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

const categorySchema = new Schema<CategoryDoc>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      maxlength: 80,
      index: true,
    },
    iconUrl: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: { transform: jsonTransform() },
  }
);

categorySchema.pre("validate", function (next) {
  if (this.name && !this.slug) this.slug = slugify(this.name);
  next();
});

export const Category: Model<CategoryDoc> = model<CategoryDoc>(
  "Category",
  categorySchema
);

export { slugify };
