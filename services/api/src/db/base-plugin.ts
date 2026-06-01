/**
 * Shared Mongoose schema plugin — the house style every domain model applies
 * (AD-5). No concrete model is registered in Milestone 0.5; this establishes the
 * convention so 0.6 domain schemas are uniform.
 *
 * Applies:
 *  - `timestamps: true` (createdAt / updatedAt).
 *  - A clean API serialization: `_id` -> `id`, and `__v` removed, on both
 *    `toJSON` and `toObject`. This keeps Mongoose internals out of API responses.
 *
 * Usage (from 0.6 onward):
 *   const productSchema = new Schema({ ... });
 *   productSchema.plugin(baseSchemaPlugin);
 *
 * Soft-delete convention (opt-in per collection that needs auditability): add a
 * `deletedAt: { type: Date, default: null }` field and filter on it in the
 * repository, rather than hard-deleting business-critical records.
 */
import type { Schema } from 'mongoose';

interface SerializedDoc {
  _id?: unknown;
  id?: unknown;
  __v?: unknown;
}

export function baseSchemaPlugin(schema: Schema): void {
  schema.set('timestamps', true);

  const transform = (_doc: unknown, ret: SerializedDoc): SerializedDoc => {
    if (ret._id !== undefined) {
      ret.id = ret._id;
      delete ret._id;
    }
    delete ret.__v;
    return ret;
  };

  schema.set('toJSON', { virtuals: true, versionKey: false, transform });
  schema.set('toObject', { virtuals: true, versionKey: false, transform });
}
