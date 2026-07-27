/**
 * Auth service behavior (Milestone 1.2) — register/login/refresh/logout/me and
 * the Google-disabled (501) path. Drives a real Mongo via mongodb-memory-server.
 * GOOGLE_CLIENT_ID is intentionally unset here (the 501 path); the enabled Google
 * flow is covered in auth.google.test.ts with a mocked verifier.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ROLES } from '@sajawat/shared';
import { verifyRefreshToken } from '../../auth/jwt.js';
import { User } from '../user/user.model.js';
import { Session } from '../session/session.model.js';
import { authService } from './auth.service.js';

let mongo: MongoMemoryServer;
const ctx = { ip: '127.0.0.1', userAgent: 'vitest' };

function register(email = 'user@example.com') {
  return authService.register(
    { firstName: 'Test', lastName: 'User', email, password: 'Password123' },
    ctx,
  );
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await User.syncIndexes();
  await Session.syncIndexes();
}, 60_000);

afterEach(async () => {
  await User.deleteMany({});
  await Session.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('register', () => {
  it('creates a customer/b2c account, issues tokens, and persists a session', async () => {
    const { user, tokens } = await register();
    expect(user.role).toBe(ROLES.CUSTOMER);
    expect(user.customerType).toBe('b2c');
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();
    expect(await Session.countDocuments()).toBe(1);
  });

  it('rejects a duplicate email with 409', async () => {
    await register('dup@example.com');
    await expect(register('Dup@example.com')).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('login', () => {
  it('succeeds with correct credentials', async () => {
    await register('login@example.com');
    const { user, tokens } = await authService.login(
      { email: 'login@example.com', password: 'Password123' },
      ctx,
    );
    expect(user.email).toBe('login@example.com');
    expect(tokens.accessToken).toBeTruthy();
  });

  it('rejects a wrong password with 401', async () => {
    await register('wrong@example.com');
    await expect(
      authService.login({ email: 'wrong@example.com', password: 'WrongPass1' }, ctx),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects an unknown email with 401', async () => {
    await expect(
      authService.login({ email: 'nobody@example.com', password: 'Password123' }, ctx),
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe('refresh rotation + reuse detection', () => {
  it('rotates the token and revokes the old jti', async () => {
    const { tokens } = await register('rotate@example.com');
    const rotated = await authService.refresh(tokens.refreshToken, ctx);
    expect(rotated.refreshToken).not.toBe(tokens.refreshToken);

    const oldClaims = await verifyRefreshToken(tokens.refreshToken);
    const old = await Session.findOne({ jti: oldClaims.jti });
    expect(old?.revokedAt).toBeTruthy();
    expect(old?.replacedByJti).toBeTruthy();
  });

  it('detects replay of a rotated token and revokes the whole family', async () => {
    const { tokens } = await register('reuse@example.com');
    await authService.refresh(tokens.refreshToken, ctx); // original now revoked
    await expect(authService.refresh(tokens.refreshToken, ctx)).rejects.toMatchObject({
      statusCode: 401,
    });
    const claims = await verifyRefreshToken(tokens.refreshToken);
    const stillActive = await Session.countDocuments({ family: claims.family, revokedAt: null });
    expect(stillActive).toBe(0);
  });
});

describe('logout', () => {
  it('revokes the session, blocks further refresh, and is idempotent', async () => {
    const { tokens } = await register('logout@example.com');
    await authService.logout(tokens.refreshToken);

    const claims = await verifyRefreshToken(tokens.refreshToken);
    const session = await Session.findOne({ jti: claims.jti });
    expect(session?.revokedAt).toBeTruthy();

    await expect(authService.refresh(tokens.refreshToken, ctx)).rejects.toMatchObject({
      statusCode: 401,
    });
    await expect(authService.logout(tokens.refreshToken)).resolves.toBeUndefined();
  });
});

describe('getMe', () => {
  it('returns the public user', async () => {
    const { user } = await register('me@example.com');
    const me = await authService.getMe(user.id);
    expect(me.email).toBe('me@example.com');
    expect(me.role).toBe(ROLES.CUSTOMER);
  });
});

describe('google (feature-flagged off)', () => {
  it('returns 501 when GOOGLE_CLIENT_ID is not configured', async () => {
    await expect(authService.googleLogin({ idToken: 'anything' }, ctx)).rejects.toMatchObject({
      statusCode: 501,
    });
  });
});

describe('updateProfile', () => {
  it('updates name, phone, and address; returns them on the public user', async () => {
    const { user } = await register('profile@example.com');
    const updated = await authService.updateProfile(user.id, {
      firstName: 'Aditi',
      phone: '9876500000',
      address: {
        line1: '12 Jewel Lane',
        city: 'Jaipur',
        state: 'Rajasthan',
        postalCode: '302001',
      },
    });
    expect(updated.firstName).toBe('Aditi');
    expect(updated.phone).toBe('9876500000');
    expect(updated.address?.line1).toBe('12 Jewel Lane');
    expect(updated.address?.city).toBe('Jaipur');
  });

  it('401s for an unknown user id', async () => {
    await expect(
      authService.updateProfile(new mongoose.Types.ObjectId().toString(), { firstName: 'X' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});
