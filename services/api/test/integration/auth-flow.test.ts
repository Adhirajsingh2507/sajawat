/**
 * Auth HTTP integration (Milestone 1.2) — drives the real app + Mongo through
 * the full envelope: register → me → refresh → logout, plus CSRF, auth, and the
 * Google 501 guard. mongodb-memory-server backs the data layer.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../../src/app.js';
import { User } from '../../src/modules/user/user.model.js';
import { Session } from '../../src/modules/session/session.model.js';

const app = createApp();
let mongo: MongoMemoryServer;

/** Read a Set-Cookie value by name from a supertest response (throws if absent). */
function cookieValue(res: request.Response, name: string): string {
  const raw = res.headers['set-cookie'] ?? [];
  for (const entry of raw) {
    const pair = entry.split(';')[0] ?? '';
    const eq = pair.indexOf('=');
    if (pair.slice(0, eq) === name) {
      return pair.slice(eq + 1);
    }
  }
  throw new Error(`Set-Cookie "${name}" not present`);
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await User.syncIndexes();
  await Session.syncIndexes();
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('auth flow', () => {
  it('register → me → refresh → logout', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      firstName: 'Flow',
      lastName: 'Test',
      email: 'flow@example.com',
      password: 'Password123',
    });
    expect(reg.status).toBe(201);
    expect(reg.body.success).toBe(true);
    const accessToken = reg.body.data.accessToken as string;
    const rt = cookieValue(reg, 'sajawat_rt');
    const csrf = cookieValue(reg, 'sajawat_csrf');
    expect(accessToken).toBeTruthy();

    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('flow@example.com');

    const refreshed = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [`sajawat_rt=${rt}`, `sajawat_csrf=${csrf}`])
      .set('x-csrf-token', csrf);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.accessToken).toBeTruthy();
    const newRt = cookieValue(refreshed, 'sajawat_rt');

    const loggedOut = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', [`sajawat_rt=${newRt}`, `sajawat_csrf=${csrf}`])
      .set('x-csrf-token', csrf);
    expect(loggedOut.status).toBe(200);
  });

  it('refresh without a CSRF token → 403', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ firstName: 'C', lastName: 'S', email: 'csrf@example.com', password: 'Password123' });
    const rt = cookieValue(reg, 'sajawat_rt');
    const res = await request(app).post('/api/v1/auth/refresh').set('Cookie', `sajawat_rt=${rt}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('me without an access token → 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('login with a wrong password → 401', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ firstName: 'L', lastName: 'P', email: 'lp@example.com', password: 'Password123' });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'lp@example.com', password: 'Wrongpass1' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('register with an invalid body → 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('google → 501 NOT_IMPLEMENTED when GOOGLE_CLIENT_ID is unset', async () => {
    const res = await request(app).post('/api/v1/auth/google').send({ idToken: 'x' });
    expect(res.status).toBe(501);
    expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
  });
});
