/**
 * Google ID-token verifier (Milestone 1.2) — Google Identity Services (GIS)
 * token flow. The frontend obtains a signed ID token from Google and posts it
 * to `/api/v1/auth/google`; here we verify it against Google's public keys with
 * our Client ID as the expected audience. Authentication only — no client
 * secret, no authorization-code/redirect flow (we never call Google APIs on the
 * user's behalf).
 *
 * Feature flag: callers must check `env.GOOGLE_CLIENT_ID` first (the route
 * returns 501 when unset). This module is replaced by a mock in tests, so it
 * never reaches the network there.
 */
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../errors/app-error.js';

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export interface GoogleIdentity {
  /** Google's stable subject id → stored as `User.googleId`. */
  sub: string;
  email: string;
  emailVerified: boolean;
  firstName?: string | undefined;
  lastName?: string | undefined;
}

/** Verify a Google ID token and extract the identity. Throws on any failure. */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity> {
  if (env.GOOGLE_CLIENT_ID === undefined) {
    // Defensive — the route guards on this and returns 501 before calling us.
    throw new UnauthorizedError('Google sign-in not configured');
  }

  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: GOOGLE_ISSUERS,
      audience: env.GOOGLE_CLIENT_ID,
    }));
  } catch {
    throw new UnauthorizedError('Invalid Google credential');
  }

  const email = typeof payload.email === 'string' ? payload.email : undefined;
  if (typeof payload.sub !== 'string' || email === undefined) {
    throw new UnauthorizedError('Invalid Google credential');
  }

  return {
    sub: payload.sub,
    email,
    emailVerified: payload.email_verified === true,
    firstName: typeof payload.given_name === 'string' ? payload.given_name : undefined,
    lastName: typeof payload.family_name === 'string' ? payload.family_name : undefined,
  };
}
