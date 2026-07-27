/**
 * Category model (Milestone 1.3a). `baseSchemaPlugin` + opt-in soft-delete;
 * explicit indexes materialized by scripts/sync-indexes.ts.
 */
import mongoose from 'mongoose';
import type { Model } from 'mongoose';
import { baseSchemaPlugin } from '../../db/base-plugin.js';
import type { ICategory } from './category.types.js';

const { Schema } = mongoose;

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 140 },
  description: { type: String, trim: true, maxlength: 2000 },
  image: { type: String, trim: true, maxlength: 2048 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  sortOrder: { type: Number, default: 0 },
  // Self-reference for one-level nesting (top-level = null). The service enforces
  // that a parent is itself top-level, so the tree never exceeds two levels.
  parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  deletedAt: { type: Date, default: null },
});

categorySchema.plugin(baseSchemaPlugin);

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ status: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ parentId: 1 });

export const Category: Model<ICategory> =
  (mongoose.models.Category as Model<ICategory> | undefined) ??
  mongoose.model<ICategory>('Category', categorySchema);
