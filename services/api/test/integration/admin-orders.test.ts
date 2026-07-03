/**
 * Admin order management HTTP integration (Milestone 1.6c) — RBAC, list/detail,
 * status + payment-status transitions, and cancel-restocks.
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
import { Cart } from '../../src/modules/cart/cart.model.js';
import { Order } from '../../src/modules/order/order.model.js';
import { categoryService } from '../../src/modules/category/category.service.js';
import { productService } from '../../src/modules/product/product.service.js';

const app = createApp();
let mongo: MongoMemoryServer;
let customerAuth: string;
let adminAuth: string;
let orderId: string;

const ADDRESS = {
  fullName: 'Buyer',
  phone: '9876543210',
  line1: '1 Gold Rd',
  city: 'Mumbai',
  state: 'MH',
  postalCode: '400001',
  country: 'India',
};
const stockOf = (productId: string) =>
  Inventory.findOne({ productId }).then((i) => i?.quantity ?? -1);

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Promise.all([
    Category.syncIndexes(),
    Product.syncIndexes(),
    Inventory.syncIndexes(),
    InventoryMovement.syncIndexes(),
    Cart.syncIndexes(),
    Order.syncIndexes(),
  ]);
  customerAuth = `Bearer ${await accessTokenFor(ROLES.CUSTOMER, new mongoose.Types.ObjectId().toString())}`;
  adminAuth = `Bearer ${await accessTokenFor(ROLES.ADMIN, new mongoose.Types.ObjectId().toString())}`;
}, 60_000);

let productId: string;
beforeEach(async () => {
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
    new mongoose.Types.ObjectId().toString(),
  );
  productId = product.id;
  await request(app)
    .post('/api/v1/cart/items')
    .set('Authorization', customerAuth)
    .send({ productId, quantity: 2 });
  const order = await request(app)
    .post('/api/v1/checkout/cod')
    .set('Authorization', customerAuth)
    .send({ address: ADDRESS });
  orderId = order.body.data.id as string;
});

afterEach(async () => {
  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    Inventory.deleteMany({}),
    InventoryMovement.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('admin orders', () => {
  it('403 for a customer (no order:read)', async () => {
    const res = await request(app).get('/api/v1/admin/orders').set('Authorization', customerAuth);
    expect(res.status).toBe(403);
  });

  it('admin lists all orders with userId', async () => {
    const res = await request(app).get('/api/v1/admin/orders').set('Authorization', adminAuth);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(typeof res.body.data.items[0].userId).toBe('string');
  });

  it('admin advances status and updates payment status', async () => {
    const shipped = await request(app)
      .patch(`/api/v1/admin/orders/${orderId}/status`)
      .set('Authorization', adminAuth)
      .send({ status: 'shipped' });
    expect(shipped.status).toBe(200);
    expect(shipped.body.data.status).toBe('shipped');

    const paid = await request(app)
      .patch(`/api/v1/admin/orders/${orderId}/payment`)
      .set('Authorization', adminAuth)
      .send({ paymentStatus: 'paid' });
    expect(paid.body.data.paymentStatus).toBe('paid');
  });

  it('admin cancel restocks inventory', async () => {
    expect(await stockOf(productId)).toBe(3);
    const cancelled = await request(app)
      .patch(`/api/v1/admin/orders/${orderId}/status`)
      .set('Authorization', adminAuth)
      .send({ status: 'cancelled' });
    expect(cancelled.body.data.status).toBe('cancelled');
    expect(await stockOf(productId)).toBe(5);
  });
});
