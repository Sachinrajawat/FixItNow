import { Schema, model, type HydratedDocument, type Model } from "mongoose";
import bcrypt from "bcryptjs";
import type { UserRole } from "@fixitnow/types";
import { jsonTransform } from "./_transform";

export interface UserAttrs {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  image?: string | null;
}

export interface UserMethods {
  comparePassword(plain: string): Promise<boolean>;
}

export interface UserDoc extends UserAttrs, UserMethods {
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

interface UserModel extends Model<UserDoc, object, UserMethods> {
  build(attrs: UserAttrs): HydratedDocument<UserDoc, UserMethods>;
}

const userSchema = new Schema<UserDoc, UserModel, UserMethods>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["user", "owner", "admin"],
      default: "user",
      index: true,
    },
    image: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: { transform: jsonTransform() },
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (plain: string) {
  return bcrypt.compare(plain, this.password);
};

userSchema.statics.build = (attrs: UserAttrs) => new User(attrs);

export const User = model<UserDoc, UserModel>("User", userSchema);
