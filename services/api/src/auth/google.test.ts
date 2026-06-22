/**
 * Google ID-token verifier (Milestone 1.2) — direct unit tests for the helper
 * itself (the OAuth *flow* tests in `modules/auth/auth.google.test.ts` mock this
 * module away, so it was otherwise uncovered). `jose` is mocked so no network /
 * real keys are touched, and `config/env` is mocked to toggle the feature flag.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as EnvModule from '../config/env.js';

// Turn the feature ON by default (configured Client ID); individual tests can
// flip it off by mutating the (unfrozen) mock env object.
vi.mock('../config/env.js', async (importOriginal) => {
  const actual = await importOriginal<typeof EnvModule>();
  return {
    ...actual,
    env: { ...actual.env, GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com' },
  };
});

// Replace jose so the remote JWKS is never built and verification is controllable.
vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => 'mock-jwks'),
  jwtVerify: vi.fn(),
}));

import { jwtVerify } from 'jose';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../errors/app-error.js';
import { verifyGoogleIdToken } from './google.js';

const mockedVerify = vi.mocked(jwtVerify);
const mutableEnv = env as { GOOGLE_CLIENT_ID: string | undefined };
const configuredClientId = mutableEnv.GOOGLE_CLIENT_ID;

beforeEach(() => {
  mutableEnv.GOOGLE_CLIENT_ID = configuredClientId;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('verifyGoogleIdToken', () => {
  it('extracts the full identity from a valid token', async () => {
    mockedVerify.mockResolvedValue({
      payload: {
        sub: 'google-sub-123',
        email: 'buyer@example.com',
        email_verified: true,
        given_name: 'Aisha',
        family_name: 'Khan',
      },
      // The verifier only reads `payload`; the protected header is irrelevant.
    } as unknown as Awaited<ReturnType<typeof jwtVerify>>);

    await expect(verifyGoogleIdToken('token')).resolves.toEqual({
      sub: 'google-sub-123',
      email: 'buyer@example.com',
      emailVerified: true,
      firstName: 'Aisha',
      lastName: 'Khan',
    });

    // Bound to our Client ID as the audience + Google's issuers.
    expect(mockedVerify).toHaveBeenCalledWith('token', 'mock-jwks', {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: 'test-client-id.apps.googleusercontent.com',
    });
  });

  it('defaults optional name fields and treats a missing email_verified as false', async () => {
    mockedVerify.mockResolvedValue({
      payload: { sub: 'sub-2', email: 'no-name@example.com' },
    } as unknown as Awaited<ReturnType<typeof jwtVerify>>);

    await expect(verifyGoogleIdToken('token')).resolves.toEqual({
      sub: 'sub-2',
      email: 'no-name@example.com',
      emailVerified: false,
      firstName: undefined,
      lastName: undefined,
    });
  });

  it('rejects when jose fails to verify the signature/claims', async () => {
    mockedVerify.mockRejectedValue(new Error('bad signature'));
    await expect(verifyGoogleIdToken('token')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects a payload missing the subject', async () => {
    mockedVerify.mockResolvedValue({
      payload: { email: 'no-sub@example.com' },
    } as unknown as Awaited<ReturnType<typeof jwtVerify>>);
    await expect(verifyGoogleIdToken('token')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects a payload missing a (string) email', async () => {
    mockedVerify.mockResolvedValue({
      payload: { sub: 'sub-3' },
    } as unknown as Awaited<ReturnType<typeof jwtVerify>>);
    await expect(verifyGoogleIdToken('token')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws (defensively) when Google sign-in is not configured', async () => {
    mutableEnv.GOOGLE_CLIENT_ID = undefined;
    await expect(verifyGoogleIdToken('token')).rejects.toBeInstanceOf(UnauthorizedError);
    expect(mockedVerify).not.toHaveBeenCalled();
  });
});
