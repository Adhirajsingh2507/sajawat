/**
 * Session Mongoose model (Milestone 1.2) — the persisted refresh-token store.
 *
 * No soft-delete: sessions are hard-managed via `revokedAt` + a TTL index on
 * `expiresAt` (Mongo prunes expired rows automatically). Indexes are declared
 * explicitly and materialized by `scripts/sync-indexes.ts` (prod autoIndex off).
 */
import mongoose from 'mongoose';
import type { Model } from 'mongoose';
import { baseSchemaPlugin } from '../../db/base-plugin.js';
import type { ISession } from './session.types.js';

const { Schema } = mongoose;

const sessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  jti: { type: String, required: true },
  family: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
  replacedByJti: { type: String, default: null },
  createdByIp: { type: String },
  userAgent: { type: String },
});

sessionSchema.plugin(baseSchemaPlugin);

sessionSchema.index({ jti: 1 }, { unique: true });
sessionSchema.index({ family: 1 });
sessionSchema.index({ userId: 1 });
// TTL: delete the document once `expiresAt` passes.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session: Model<ISession> =
  (mongoose.models.Session as Model<ISession> | undefined) ??
  mongoose.model<ISession>('Session', sessionSchema);
