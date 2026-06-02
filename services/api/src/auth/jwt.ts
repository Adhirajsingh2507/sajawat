/**
 * JWT utilities (Milestone 0.7, AD-18/AD-21) — stateless sign/verify via `jose`.
 *
 * Two token types with **distinct secrets** and a `type` claim so a refresh
 * token can never be replayed as an access token. Issuer/audience are bound on
 * every verify. Refresh tokens carry `jti` + `family` so the Phase-1 session
 * store can implement rotation + reuse-detection (no server state here yet).
 */
import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';
import type { Role } from '@sajawat/shared';
import { isRole } from '@sajawat/shared';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../errors/app-error.js';

const ALG = 'HS256';
const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export interface AccessTokenClaims {
  /** user id */
  sub: string;
  role: Role;
}

export interface RefreshTokenClaims {
  /** user id */
  sub: string;
  /** unique token id (rotation/reuse-detection key) */
  jti: string;
  /** token family id (theft-detection group) */
  family: string;
}

export function signAccessToken(input: AccessTokenClaims): Promise<string> {
  return new SignJWT({ type: 'access', role: input.role })
    .setProtectedHeader({ alg: ALG })
    .setSubject(input.sub)
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
    .sign(accessSecret);
}

export function signRefreshToken(input: RefreshTokenClaims): Promise<string> {
  return new SignJWT({ type: 'refresh', family: input.family })
    .setProtectedHeader({ alg: ALG })
    .setSubject(input.sub)
    .setJti(input.jti)
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .sign(refreshSecret);
}

async function verify(token: string, secret: Uint8Array): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
    return payload;
  } catch {
    // Collapse all jose failures (bad signature, expired, wrong iss/aud) into a
    // single opaque 401 — never leak which check failed.
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  const payload = await verify(token, accessSecret);
  if (payload.type !== 'access' || typeof payload.sub !== 'string' || !isRole(payload.role)) {
    throw new UnauthorizedError('Invalid access token');
  }
  return { sub: payload.sub, role: payload.role };
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenClaims> {
  const payload = await verify(token, refreshSecret);
  if (
    payload.type !== 'refresh' ||
    typeof payload.sub !== 'string' ||
    typeof payload.jti !== 'string' ||
    typeof payload.family !== 'string'
  ) {
    throw new UnauthorizedError('Invalid refresh token');
  }
  return { sub: payload.sub, jti: payload.jti, family: payload.family };
}
