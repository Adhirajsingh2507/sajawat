/**
 * Catalog HTTP integration (Milestone 1.3a) — public reads + admin CRUD with
 * RBAC. Tokens are minted via the test helper (requirePermission checks the
 * role in the token), so no DB users are needed. mms backs the catalog data.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ROLES } from '@sajawat/shared';
import { createApp } from '../../src/app.js';
import { accessTokenFor } from '../helpers.js';
import { Category } from '../../src/modules/category/category.model.js';
import { Collection } from '../../src/modules/collection/collection.model.js';

const app = createApp();
let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Category.syncIndexes();
  await Collection.syncIndexes();
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('admin categories — RBAC', () => {
  it('401 without a token', async () => {
    const res = await request(app).post('/api/v1/admin/categories').send({ name: 'X' });
    expect(res.status).toBe(401);
  });

  it('403 for a customer (no category:write)', async () => {
    const token = await accessTokenFor(ROLES.CUSTOMER);
    const res = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X' });
    expect(res.status).toBe(403);
  });

  it('admin can create → it appears in the public list', async () => {
    const token = await accessTokenFor(ROLES.ADMIN);
    const created = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Necklaces' });
    expect(created.status).toBe(201);
    expect(created.body.data.slug).toBe('necklaces');

    const pub = await request(app).get('/api/v1/categories');
    expect(pub.status).toBe(200);
    expect(pub.body.data.items.some((c: { slug: string }) => c.slug === 'necklaces')).toBe(true);

    const id = created.body.data.id as string;
    const patched = await request(app)
      .patch(`/api/v1/admin/categories/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'inactive' });
    expect(patched.status).toBe(200);

    // now hidden from public
    const pub2 = await request(app).get('/api/v1/categories');
    expect(pub2.body.data.items.some((c: { slug: string }) => c.slug === 'necklaces')).toBe(false);

    const removed = await request(app)
      .delete(`/api/v1/admin/categories/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(removed.status).toBe(200);
  });
});

describe('public reads', () => {
  it('GET /categories/:slug 404s for an unknown slug', async () => {
    const res = await request(app).get('/api/v1/categories/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('collections — RBAC nuance (marketing can write collections, not categories)', () => {
  it('marketing creates a collection (201) but is forbidden from categories (403)', async () => {
    const token = await accessTokenFor(ROLES.MARKETING_TEAM);

    const col = await request(app)
      .post('/api/v1/admin/collections')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Festive Collection' });
    expect(col.status).toBe(201);
    expect(col.body.data.slug).toBe('festive-collection');

    const cat = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Blocked' });
    expect(cat.status).toBe(403);
  });
});
