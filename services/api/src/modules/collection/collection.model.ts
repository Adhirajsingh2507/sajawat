/**
 * Collection model (Milestone 1.3a). `baseSchemaPlugin` + opt-in soft-delete;
 * explicit indexes materialized by scripts/sync-indexes.ts.
 */
import mongoose from 'mongoose';
import type { Model } from 'mongoose';
import { baseSchemaPlugin } from '../../db/base-plugin.js';
import type { ICollection } from './collection.types.js';

const { Schema } = mongoose;

const collectionSchema = new Schema<ICollection>({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 140 },
  description: { type: String, trim: true, maxlength: 2000 },
  bannerImage: { type: String, trim: true, maxlength: 2048 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  deletedAt: { type: Date, default: null },
});

collectionSchema.plugin(baseSchemaPlugin);

collectionSchema.index({ slug: 1 }, { unique: true });
collectionSchema.index({ status: 1 });

export const Collection: Model<ICollection> =
  (mongoose.models.Collection as Model<ICollection> | undefined) ??
  mongoose.model<ICollection>('Collection', collectionSchema);
