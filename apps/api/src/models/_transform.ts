/**
 * Standard JSON transform for our Mongoose models:
 * - rename `_id` to `id`
 * - drop `__v`
 * - drop sensitive `password` if present
 *
 * `transformRefs` lets a model also rename `field` to `fieldId` (e.g.
 * `business` -> `businessId`) when the relationship is an ObjectId.
 */
export function jsonTransform(transformRefs: Record<string, string> = {}) {
  return (_doc: unknown, ret: Record<string, unknown>) => {
    if (ret._id !== undefined) {
      ret.id = String(ret._id);
      delete ret._id;
    }
    delete ret.__v;
    delete ret.password;
    for (const [from, to] of Object.entries(transformRefs)) {
      const value = ret[from];
      if (value !== undefined && value !== null) {
        ret[to] =
          typeof (value as { toString?: () => string }).toString === "function"
            ? (value as { toString: () => string }).toString()
            : value;
        delete ret[from];
      }
    }
    return ret;
  };
}
