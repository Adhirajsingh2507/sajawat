/**
 * COD checkout HTTP integration (Milestone 1.6a) — places an order from the cart,
 * decrements inventory atomically, snapshots items/address/discount, clears the
 * cart, supports cancel+restock, and enforces stock + coupon usage limits.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
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
import { Order } from '../../src/modules/order/order.model.js';
import { categoryService } from '../../src/modules/category/category.service.js';
import { productService } from '../../src/modules/product/product.service.js';
import { promotionService } from '../../src/modules/promotion/promotion.service.js';

const app = createApp();
let mongo: MongoMemoryServer;
let auth: string;
let productId: string;

const ADDRESS = {
  fullName: 'Test Buyer',
  phone: '9876543210',
  line1: '12 Jewel Street',
  city: 'Mumbai',
  state: 'MH',
  postalCode: '400001',
  country: 'India',
};

async function addToCart(quantity: number) {
  return request(app)
    .post('/api/v1/cart/items')
    .set('Authorization', auth)
    .send({ productId, quantity });
}
function stockOf(): Promise<number> {
  return Inventory.findOne({ productId }).then((i) => i?.quantity ?? -1);
}

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
    Order.syncIndexes(),
  ]);
  auth = `Bearer ${await accessTokenFor(ROLES.CUSTOMER, new mongoose.Types.ObjectId().toString())}`;
}, 60_000);

beforeEach(async () => {
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
});

afterEach(async () => {
  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    Inventory.deleteMany({}),
    InventoryMovement.deleteMany({}),
    Promotion.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('COD checkout', () => {
  it('places an order, decrements stock, snapshots, and clears the cart', async () => {
    await addToCart(2);
    const res = await request(app)
      .post('/api/v1/checkout/cod')
      .set('Authorization', auth)
      .send({ address: ADDRESS });
    expect(res.status).toBe(201);
    expect(res.body.data.paymentMethod).toBe('cod');
    expect(res.body.data.status).toBe('processing');
    expect(res.body.data.paymentStatus).toBe('pending');
    expect(res.body.data.total).toBe(2000);
    expect(res.body.data.items[0].quantity).toBe(2);
    expect(res.body.data.address.city).toBe('Mumbai');
    expect(res.body.data.orderNumber).toMatch(/^SAJ-/);

    expect(await stockOf()).toBe(3); // 5 - 2

    const cart = await request(app).get('/api/v1/cart').set('Authorization', auth);
    expect(cart.body.data.itemCount).toBe(0);

    const list = await request(app).get('/api/v1/orders').set('Authorization', auth);
    expect(list.body.data.total).toBe(1);
  });

  it('applies a coupon, then cancel restocks inventory', async () => {
    await promotionService.create({
      name: 'Save 100',
      trigger: 'coupon',
      code: 'SAVE100',
      rewardType: 'fixed',
      value: 100,
      minCartValue: 0,
    });
    await addToCart(1);
    await request(app)
      .post('/api/v1/cart/apply-coupon')
      .set('Authorization', auth)
      .send({ code: 'SAVE100' });

    const placed = await request(app)
      .post('/api/v1/checkout/cod')
      .set('Authorization', auth)
      .send({ address: ADDRESS });
    expect(placed.body.data.discount).toBe(100);
    expect(placed.body.data.total).toBe(900);
    expect(placed.body.data.appliedPromotion.code).toBe('SAVE100');
    expect(await stockOf()).toBe(4);

    const cancelled = await request(app)
      .post(`/api/v1/orders/${placed.body.data.id as string}/cancel`)
      .set('Authorization', auth);
    expect(cancelled.body.data.status).toBe('cancelled');
    expect(await stockOf()).toBe(5); // restocked
  });

  it('rejects checkout when stock is insufficient', async () => {
    await addToCart(10); // only 5 in stock
    const res = await request(app)
      .post('/api/v1/checkout/cod')
      .set('Authorization', auth)
      .send({ address: ADDRESS });
    expect(res.status).toBe(400);
    expect(await stockOf()).toBe(5); // unchanged
  });

  it('enforces a coupon usage limit across orders', async () => {
    await promotionService.create({
      name: 'Once',
      trigger: 'coupon',
      code: 'ONCE',
      rewardType: 'fixed',
      value: 50,
      minCartValue: 0,
      usageLimit: 1,
    });

    await addToCart(1);
    await request(app)
      .post('/api/v1/cart/apply-coupon')
      .set('Authorization', auth)
      .send({ code: 'ONCE' });
    const first = await request(app)
      .post('/api/v1/checkout/cod')
      .set('Authorization', auth)
      .send({ address: ADDRESS });
    expect(first.status).toBe(201);

    await addToCart(1);
    await request(app)
      .post('/api/v1/cart/apply-coupon')
      .set('Authorization', auth)
      .send({ code: 'ONCE' });
    const second = await request(app)
      .post('/api/v1/checkout/cod')
      .set('Authorization', auth)
      .send({ address: ADDRESS });
    expect(second.status).toBe(400);
  });

  it('401 without a token', async () => {
    const res = await request(app).post('/api/v1/checkout/cod').send({ address: ADDRESS });
    expect(res.status).toBe(401);
  });
});
