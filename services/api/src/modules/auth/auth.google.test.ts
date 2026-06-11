/**
 * Google sign-in (Milestone 1.2) — enabled path. We mock `config/env` to supply
 * a GOOGLE_CLIENT_ID and mock the Google verifier so no network/credentials are
 * touched. Covers new-user creation, linking Google to an existing account, and
 * rejecting unverified emails.
 */
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import type * as EnvModule from '../../config/env.js';

// Turn the feature ON for this file by overriding only GOOGLE_CLIENT_ID.
vi.mock('../../config/env.js', async (importOriginal) => {
  const actual = await importOriginal<typeof EnvModule>();
  return {
    ...actual,
    env: { ...actual.env, GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com' },
  };
});
// Replace the real (network) verifier with a controllable mock.
vi.mock('../../auth/google.js', () => ({ verifyGoogleIdToken: vi.fn() }));

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ROLES } from '@sajawat/shared';
import { hashPassword } from '../../auth/password.js';
import { verifyGoogleIdToken } from '../../auth/google.js';
import { User } from '../user/user.model.js';
import { Session } from '../session/session.model.js';
import { authService } from './auth.service.js';

const mockedVerify = vi.mocked(verifyGoogleIdToken);
const ctx = { ip: '127.0.0.1', userAgent: 'vitest' };
let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await User.syncIndexes();
  await Session.syncIndexes();
}, 60_000);

afterEach(async () => {
  await User.deleteMany({});
  await Session.deleteMany({});
  mockedVerify.mockReset();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

it('creates a new customer from a verified Google identity', async () => {
  mockedVerify.mockResolvedValue({
    sub: 'google-1',
    email: 'new@example.com',
    emailVerified: true,
    firstName: 'New',
    lastName: 'User',
  });
  const { user, tokens } = await authService.googleLogin({ idToken: 'tok' }, ctx);
  expect(user.email).toBe('new@example.com');
  expect(user.role).toBe(ROLES.CUSTOMER);
  expect(tokens.accessToken).toBeTruthy();
  const dbUser = await User.findOne({ email: 'new@example.com' });
  expect(dbUser?.googleId).toBe('google-1');
});

it('links Google to a pre-existing password account without duplicating it', async () => {
  await User.create({
    firstName: 'Ex',
    lastName: 'Isting',
    email: 'exist@example.com',
    passwordHash: await hashPassword('Password123'),
    role: ROLES.CUSTOMER,
    customerType: 'b2c',
    isEmailVerified: false,
    isPhoneVerified: false,
    status: 'active',
  });
  mockedVerify.mockResolvedValue({
    sub: 'google-2',
    email: 'exist@example.com',
    emailVerified: true,
  });
  await authService.googleLogin({ idToken: 'tok' }, ctx);
  const dbUser = await User.findOne({ email: 'exist@example.com' });
  expect(dbUser?.googleId).toBe('google-2');
  expect(await User.countDocuments({ email: 'exist@example.com' })).toBe(1);
});

it('rejects an unverified Google email with 401', async () => {
  mockedVerify.mockResolvedValue({
    sub: 'google-3',
    email: 'unverified@example.com',
    emailVerified: false,
  });
  await expect(authService.googleLogin({ idToken: 'tok' }, ctx)).rejects.toMatchObject({
    statusCode: 401,
  });
});
