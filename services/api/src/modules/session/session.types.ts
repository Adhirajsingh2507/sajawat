/**
 * Session (persisted refresh token) types — Milestone 1.2.
 *
 * One document per issued refresh token. This is the server-side store that
 * makes refresh tokens revocable (closes D15): rotation marks the old row
 * revoked + points to its replacement; replay of a revoked `jti` is treated as
 * theft and the whole `family` is revoked. TTL on `expiresAt` auto-prunes.
 *
 * This is the Mongo implementation of the `SessionStore` concept; a Redis-backed
 * store can replace it in Phase 2 without changing callers (cache-aside rule).
 */
import type { Types } from 'mongoose';

export interface ISession {
  userId: Types.ObjectId | string;
  /** Refresh-token id (rotation / reuse-detection key). Unique. */
  jti: string;
  /** Token family (theft-detection group); preserved across rotations. */
  family: string;
  /** Absolute expiry; a TTL index prunes the row after this instant. */
  expiresAt: Date;
  /** Set when rotated or logged out; a revoked row must never be accepted. */
  revokedAt?: Date | null;
  /** The `jti` that superseded this one (rotation audit trail). */
  replacedByJti?: string | null;
  createdByIp?: string | undefined;
  userAgent?: string | undefined;
  createdAt?: Date;
  updatedAt?: Date;
}
