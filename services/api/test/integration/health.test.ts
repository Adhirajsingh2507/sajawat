import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../../src/app.js';

const app = createApp();
let mongod: MongoMemoryServer;

describe('health endpoints (against mongodb-memory-server)', () => {
  beforeAll(async () => {
    // Generous timeout: the mongod binary may download on first run.
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  }, 120_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  }, 30_000);

  it('liveness /health is dependency-free 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('readiness reports healthy when the DB is connected', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.db).toEqual({ state: 'connected', ok: true });
    expect(res.body.meta.requestId).toBeDefined();
  });

  it('readiness reports degraded 503 when the DB is down', async () => {
    await mongoose.disconnect();
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(503);
    expect(res.body.data.status).toBe('degraded');
    expect(res.body.data.db.ok).toBe(false);
  });
});
