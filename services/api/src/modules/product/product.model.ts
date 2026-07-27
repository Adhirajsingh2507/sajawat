/**
 * Product model (Milestone 1.3b). `baseSchemaPlugin` + soft-delete; embedded
 * image/video/seo subdocs; explicit indexes incl. a text index for search.
 * Materialized by scripts/sync-indexes.ts.
 */
import mongoose from 'mongoose';
import type { Model } from 'mongoose';
import type { ProductImage, ProductSeo, ProductVideo } from '@sajawat/types';
import { baseSchemaPlugin } from '../../db/base-plugin.js';
import type { IProduct } from './product.types.js';

const { Schema } = mongoose;

const imageSchema = new Schema<ProductImage>(
  {
    url: { type: String, required: true, trim: true, maxlength: 2048 },
    alt: { type: String, trim: true, maxlength: 200 },
    position: { type: Number, default: 0 },
  },
  { _id: false },
);

const videoSchema = new Schema<ProductVideo>(
  { url: { type: String, required: true, trim: true, maxlength: 2048 } },
  { _id: false },
);

const seoSchema = new Schema<ProductSeo>(
  {
    title: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 300 },
    keywords: { type: [String], default: [] },
  },
  { _id: false },
);

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 220 },
  shortDescription: { type: String, trim: true, maxlength: 500 },
  description: { type: String, trim: true, maxlength: 8000 },
  sku: { type: String, required: true, trim: true, maxlength: 64 },
  barcode: { type: String, trim: true, maxlength: 64 },
  price: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, min: 0 },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  collectionIds: { type: [Schema.Types.ObjectId], ref: 'Collection', default: [] },
  images: { type: [imageSchema], default: [] },
  video: { type: videoSchema, default: undefined },
  seo: { type: seoSchema, default: () => ({}) },
  ogImage: { type: String, trim: true, maxlength: 2048 },
  status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
  isFeatured: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
});

productSchema.plugin(baseSchemaPlugin);

productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ barcode: 1 }, { unique: true, sparse: true });
productSchema.index({ categoryId: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ name: 'text', shortDescription: 'text' });

export const Product: Model<IProduct> =
  (mongoose.models.Product as Model<IProduct> | undefined) ??
  mongoose.model<IProduct>('Product', productSchema);
