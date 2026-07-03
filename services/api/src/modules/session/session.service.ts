/**
 * Session service (Milestone 1.2) — issues, rotates, and revokes refresh
 * sessions, and mints the matching access/refresh JWTs. This is the heart of
 * D15 closure: every refresh token has a server-side row, so it can be revoked,
 * and rotation + reuse-detection defend against token theft.
 */
import { randomUUID } from 'node:crypto';
import type { Role } from '@sajawat/shared';
import { signAccessToken, signRefreshToken } from '../../auth/jwt.js';
import type { RefreshTokenClaims } from '../../auth/jwt.js';
import { durationToMs } from '../../auth/cookies.js';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../errors/app-error.js';
import { sessionRepository } from './session.repository.js';

export interface SessionContext {
  ip?: string | undefined;
  userAgent?: string | undefined;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

function refreshExpiry(): Date {
  return new Date(Date.now() + durationToMs(env.JWT_REFRESH_EXPIRES_IN));
}

/** Start a brand-new session (login / register / google) — new family. */
async function issue(userId: string, role: Role, ctx: SessionContext = {}): Promise<IssuedTokens> {
  const family = randomUUID();
  const jti = randomUUID();
  const refreshToken = await signRefreshToken({ sub: userId, jti, family });
  const accessToken = await signAccessToken({ sub: userId, role });
  await sessionRepository.create({
    userId,
    jti,
    family,
    expiresAt: refreshExpiry(),
    createdByIp: ctx.ip,
    userAgent: ctx.userAgent,
  });
  return { accessToken, refreshToken };
}

/**
 * Rotate a refresh token. The presented token must map to a live (non-revoked,
 * non-expired) session. Replaying an already-revoked token ⇒ theft ⇒ the whole
 * family is revoked. `role` is supplied by the caller (resolved from the live
 * user) so a stale role is never re-minted.
 */
async function rotate(
  claims: RefreshTokenClaims,
  role: Role,
  ctx: SessionContext = {},
): Promise<IssuedTokens> {
  const current = await sessionRepository.findByJti(claims.jti);
  if (current === null) {
    throw new UnauthorizedError('Session is no longer valid');
  }
  if (current.revokedAt != null) {
    await sessionRepository.revokeFamily(claims.family);
    throw new UnauthorizedError('Session reuse detected');
  }
  if (current.expiresAt.getTime() < Date.now()) {
    throw new UnauthorizedError('Session expired');
  }

  const newJti = randomUUID();
  const refreshToken = await signRefreshToken({
    sub: claims.sub,
    jti: newJti,
    family: claims.family,
  });
  const accessToken = await signAccessToken({ sub: claims.sub, role });
  await sessionRepository.create({
    userId: claims.sub,
    jti: newJti,
    family: claims.family,
    expiresAt: refreshExpiry(),
    createdByIp: ctx.ip,
    userAgent: ctx.userAgent,
  });
  await sessionRepository.updateById(String(current._id), {
    $set: { revokedAt: new Date(), replacedByJti: newJti },
  });
  return { accessToken, refreshToken };
}

/** Revoke a single session by its `jti` (logout). Idempotent. */
async function revoke(jti: string): Promise<void> {
  const current = await sessionRepository.findByJti(jti);
  if (current !== null && current.revokedAt == null) {
    await sessionRepository.updateById(String(current._id), { $set: { revokedAt: new Date() } });
  }
}

/** Revoke an entire token family (used when a user is disabled/deleted). */
async function revokeFamily(family: string): Promise<void> {
  await sessionRepository.revokeFamily(family);
}

export const sessionService = { issue, rotate, revoke, revokeFamily };
