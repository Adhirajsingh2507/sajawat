/**
 * Profile update HTTP integration (Account improvements) — PATCH /auth/me:
 * auth-gated self-service edit of name/phone/address, returning the updated
 * public user (now including the address). Register issues the access token we
 * reuse as the Bearer.
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
let token: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Promise.all([User.syncIndexes(), Session.syncIndexes()]);
  const reg = await request(app).post('/api/v1/auth/register').send({
    firstName: 'Aditi',
    lastName: 'Sharma',
    email: 'profile@example.test',
    password: 'Password123',
  });
  token = reg.body.data.accessToken as string;
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('PATCH /api/v1/auth/me', () => {
  it('401s without a token', async () => {
    const res = await request(app).patch('/api/v1/auth/me').send({ firstName: 'X' });
    expect(res.status).toBe(401);
  });

  it('rejects an empty body (400)', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('updates name, phone, and address and echoes them back', async () => {
    const res = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Aditi',
        phone: '9876500000',
        address: {
          line1: '12 Jewel Lane',
          city: 'Jaipur',
          state: 'Rajasthan',
          postalCode: '302001',
        },
      });
    expect(res.status).toBe(200);
    expect(res.body.data.user.phone).toBe('9876500000');
    expect(res.body.data.user.address.line1).toBe('12 Jewel Lane');
    expect(res.body.data.user.address.city).toBe('Jaipur');
  });
});
