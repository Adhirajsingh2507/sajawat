/**
 * Products + Inventory HTTP integration (Milestone 1.3b) — public reads,
 * product admin CRUD with RBAC, and admin inventory adjust + history. Tokens via
 * the test helper; mms backs the data.
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
import { Product } from '../../src/modules/product/product.model.js';
import { Inventory } from '../../src/modules/inventory/inventory.model.js';
import { InventoryMovement } from '../../src/modules/inventory/inventory-movement.model.js';
import { categoryService } from '../../src/modules/category/category.service.js';

const app = createApp();
let mongo: MongoMemoryServer;
let adminToken: string;
let categoryId: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Promise.all([
    Category.syncIndexes(),
    Collection.syncIndexes(),
    Product.syncIndexes(),
    Inventory.syncIndexes(),
    InventoryMovement.syncIndexes(),
  ]);
  adminToken = await accessTokenFor(ROLES.ADMIN, new mongoose.Types.ObjectId().toString());
  const cat = await categoryService.create({ name: 'Rings' });
  categoryId = cat.id;
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('product admin CRUD + RBAC', () => {
  it('401 without token; 403 for inventory_staff (no product:write); 201 for admin', async () => {
    const payload = { name: 'Solitaire', sku: 'SOL-1', price: 5000, categoryId, status: 'active' };

    const anon = await request(app).post('/api/v1/admin/products').send(payload);
    expect(anon.status).toBe(401);

    const staffToken = await accessTokenFor(ROLES.INVENTORY_STAFF);
    const staff = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${staffToken}`)
      .send(payload);
    expect(staff.status).toBe(403);

    const created = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...payload, quantity: 4 });
    expect(created.status).toBe(201);
    expect(created.body.data.slug).toBe('solitaire');

    // appears in the public list with inStock=true
    const pub = await request(app).get('/api/v1/products');
    expect(pub.status).toBe(200);
    const found = pub.body.data.items.find((p: { slug: string }) => p.slug === 'solitaire');
    expect(found?.inStock).toBe(true);
  });
});

describe('public product reads', () => {
  it('GET /products/:slug 404s for unknown; static routes resolve before :slug', async () => {
    const unknown = await request(app).get('/api/v1/products/no-such-product');
    expect(unknown.status).toBe(404);

    // /search must not be captured by /:slug
    const search = await request(app).get('/api/v1/products/search?q=Solitaire');
    expect(search.status).toBe(200);
    expect(search.body.data.items.some((p: { slug: string }) => p.slug === 'solitaire')).toBe(true);
  });
});

describe('admin inventory', () => {
  it('inventory_staff can adjust stock and read history; customer is forbidden', async () => {
    // resolve the product id created earlier
    const list = await request(app)
      .get('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`);
    const productId = list.body.data.items.find((p: { slug: string }) => p.slug === 'solitaire')
      ?.id as string;
    expect(productId).toBeTruthy();

    const staffToken = await accessTokenFor(
      ROLES.INVENTORY_STAFF,
      new mongoose.Types.ObjectId().toString(),
    );
    const adjust = await request(app)
      .patch(`/api/v1/admin/inventory/${productId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ type: 'stock_added', quantity: 6 });
    expect(adjust.status).toBe(200);
    expect(adjust.body.data.quantity).toBe(10); // 4 seeded + 6

    const history = await request(app)
      .get(`/api/v1/admin/inventory/history?productId=${productId}`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(history.status).toBe(200);
    expect(history.body.data.total).toBeGreaterThanOrEqual(2);

    const customerToken = await accessTokenFor(ROLES.CUSTOMER);
    const forbidden = await request(app)
      .patch(`/api/v1/admin/inventory/${productId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ type: 'stock_added', quantity: 1 });
    expect(forbidden.status).toBe(403);
  });
});
