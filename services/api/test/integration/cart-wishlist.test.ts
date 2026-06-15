/**
 * Cart + Wishlist HTTP integration (Milestone 1.5b) — live totals, coupon
 * application, wishlist, and auth. mms-backed; seeds a category/product/coupon.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ROLES } from '@sajawat/shared';
import { createApp } from '../../src/app.js';
import { accessTokenFor } from '../helpers.js';
import { Category } from '../../src/modules/category/category.model.js';
import { Product } from '../../src/modules/product/product.model.js';
import { Inventory } from '../../src/modules/inventory/inventory.model.js';
import { InventoryMovement } from '../../src/modules/inventory/inventory-movement.model.js';
import { Promotion } from '../../src/modules/promotion/promotion.model.js';
import { Cart } from '../../src/modules/cart/cart.model.js';
import { Wishlist } from '../../src/modules/wishlist/wishlist.model.js';
import { categoryService } from '../../src/modules/category/category.service.js';
import { productService } from '../../src/modules/product/product.service.js';
import { promotionService } from '../../src/modules/promotion/promotion.service.js';

const app = createApp();
let mongo: MongoMemoryServer;
let token: string;
let auth: string;
let productId: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Promise.all([
    Category.syncIndexes(),
    Product.syncIndexes(),
    Inventory.syncIndexes(),
    InventoryMovement.syncIndexes(),
    Promotion.syncIndexes(),
    Cart.syncIndexes(),
    Wishlist.syncIndexes(),
  ]);
  token = await accessTokenFor(ROLES.CUSTOMER, new mongoose.Types.ObjectId().toString());
  auth = `Bearer ${token}`;
  const admin = new mongoose.Types.ObjectId().toString();
  const cat = await categoryService.create({ name: 'Rings' });
  const product = await productService.create(
    {
      name: 'Gold Ring',
      sku: 'GR-1',
      price: 1000,
      categoryId: cat.id,
      status: 'active',
      quantity: 5,
    },
    admin,
  );
  productId = product.id;
  await promotionService.create({
    name: 'Save 200',
    trigger: 'coupon',
    code: 'save200',
    rewardType: 'fixed',
    value: 200,
    minCartValue: 0,
  });
}, 60_000);

afterEach(async () => {
  await Promise.all([Cart.deleteMany({}), Wishlist.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('cart', () => {
  it('add → live subtotal → coupon → update → remove', async () => {
    const added = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', auth)
      .send({ productId, quantity: 2 });
    expect(added.status).toBe(201);
    expect(added.body.data.subtotal).toBe(2000);
    expect(added.body.data.itemCount).toBe(2);
    expect(added.body.data.items[0].inStock).toBe(true);

    const couponed = await request(app)
      .post('/api/v1/cart/apply-coupon')
      .set('Authorization', auth)
      .send({ code: 'save200' });
    expect(couponed.status).toBe(200);
    expect(couponed.body.data.discount).toBe(200);
    expect(couponed.body.data.total).toBe(1800);
    expect(couponed.body.data.appliedPromotion.code).toBe('SAVE200');

    const updated = await request(app)
      .patch(`/api/v1/cart/items/${productId}`)
      .set('Authorization', auth)
      .send({ quantity: 1 });
    expect(updated.body.data.subtotal).toBe(1000);
    expect(updated.body.data.total).toBe(800); // coupon still applies

    const removed = await request(app)
      .delete(`/api/v1/cart/items/${productId}`)
      .set('Authorization', auth);
    expect(removed.body.data.itemCount).toBe(0);
  });

  it('rejects an invalid coupon with 400', async () => {
    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', auth)
      .send({ productId, quantity: 1 });
    const res = await request(app)
      .post('/api/v1/cart/apply-coupon')
      .set('Authorization', auth)
      .send({ code: 'NOPE' });
    expect(res.status).toBe(400);
  });

  it('401 without a token', async () => {
    const res = await request(app).get('/api/v1/cart');
    expect(res.status).toBe(401);
  });
});

describe('wishlist', () => {
  it('adds and removes a product', async () => {
    const added = await request(app)
      .post(`/api/v1/wishlist/${productId}`)
      .set('Authorization', auth);
    expect(added.status).toBe(201);
    expect(added.body.data.items).toHaveLength(1);
    expect(added.body.data.items[0].id).toBe(productId);

    const removed = await request(app)
      .delete(`/api/v1/wishlist/${productId}`)
      .set('Authorization', auth);
    expect(removed.body.data.items).toHaveLength(0);
  });
});
