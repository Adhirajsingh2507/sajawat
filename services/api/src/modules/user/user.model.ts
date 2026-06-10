/**
 * User Mongoose model (Milestone 1.1) — the first real domain model.
 *
 * Applies `baseSchemaPlugin` (timestamps, `_id`->`id`, `__v` stripped) and the
 * opt-in soft-delete convention (`deletedAt`). Indexes are declared explicitly
 * via `schema.index()` (not inline on fields) to avoid duplicate-index warnings
 * and to keep the index contract in one readable block; they are materialized by
 * `scripts/sync-indexes.ts` (prod has `autoIndex` off — AD-7).
 *
 * Security: `passwordHash` is `select: false` so it never leaves the DB layer
 * unless a query explicitly opts in (see `UserRepository.findByEmailWithPassword`).
 */
import mongoose from 'mongoose';
import type { Model } from 'mongoose';
import { ROLES } from '@sajawat/shared';
import { baseSchemaPlugin } from '../../db/base-plugin.js';
import type { IUser, UserAddress } from './user.types.js';

const { Schema } = mongoose;

const addressSchema = new Schema<UserAddress>(
  {
    fullName: { type: String, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 20 },
    line1: { type: String, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100 },
    postalCode: { type: String, trim: true, maxlength: 20 },
    country: { type: String, trim: true, maxlength: 100 },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>({
  firstName: { type: String, required: true, trim: true, maxlength: 80 },
  lastName: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 20 },
  passwordHash: { type: String, select: false },
  googleId: { type: String, trim: true },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  customerType: { type: String, enum: ['b2c', 'b2b'], default: 'b2c' },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.CUSTOMER },
  status: { type: String, enum: ['active', 'suspended', 'deleted'], default: 'active' },
  address: { type: addressSchema, default: undefined },
  deletedAt: { type: Date, default: null },
});

userSchema.plugin(baseSchemaPlugin);

// Explicit index contract (materialized by scripts/sync-indexes.ts).
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ customerType: 1 });
userSchema.index({ status: 1 });

// Guard against model re-compilation under watch/test (OverwriteModelError).
export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser> | undefined) ?? mongoose.model<IUser>('User', userSchema);
