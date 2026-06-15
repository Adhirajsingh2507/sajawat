/**
 * Razorpay online payment HTTP integration (Milestone 1.6b) — initiate (reserve)
 * → verify (commit + idempotent) and webhook-as-source-of-truth. The provider is
 * mocked so no network/keys are needed.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/payments/razorpay-provider.js', () => ({
  razorpayProvider: {
    isConfigured: () => true,
    publicKeyId: () => 'rzp_test_key',
    createOrder: vi.fn(() =>
      Promise.resolve({ providerOrderId: 'order_RZP1', amount: 100000, currency: 'INR' }),
    ),
    verifyPaymentSignature: () => true,
    verifyWebhookSignature: () => true,
  },
}));

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
import { Payment } from '../../src/modules/payment/payment.model.js';
import { categoryService } from '../../src/modules/category/category.service.js';
import { productService } from '../../src/modules/product/product.service.js';

const app = createApp();
let mongo: MongoMemoryServer;
let auth: string;
let productId: string;

const ADDRESS = {
  fullName: 'Buyer',
  phone: '9876543210',
  line1: '1 Gold Rd',
  city: 'Mumbai',
  state: 'MH',
  postalCode: '400001',
  country: 'India',
};

function inv(): Promise<{ quantity: number; reserved: number; available: number }> {
  return Inventory.findOne({ productId }).then((i) => ({
    quantity: i?.quantity ?? -1,
    reserved: i?.reservedQuantity ?? -1,
    available: i?.availableQuantity ?? -1,
  }));
}

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
    Payment.syncIndexes(),
  ]);
  auth = `Bearer ${await accessTokenFor(ROLES.CUSTOMER, new mongoose.Types.ObjectId().toString())}`;
}, 60_000);

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
    .set('Authorization', auth)
    .send({ productId, quantity: 2 });
});

afterEach(async () => {
  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    Inventory.deleteMany({}),
    InventoryMovement.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Payment.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('online payment', () => {
  it('initiate reserves stock and returns a gateway order; verify commits + is idempotent', async () => {
    const init = await request(app)
      .post('/api/v1/checkout')
      .set('Authorization', auth)
      .send({ address: ADDRESS });
    expect(init.status).toBe(201);
    expect(init.body.data.order.status).toBe('created');
    expect(init.body.data.payment.orderId).toBe('order_RZP1');
    expect(init.body.data.payment.amount).toBe(100000);

    expect(await inv()).toEqual({ quantity: 5, reserved: 2, available: 3 }); // reserved

    const verify = await request(app)
      .post('/api/v1/checkout/verify-payment')
      .set('Authorization', auth)
      .send({ razorpayOrderId: 'order_RZP1', razorpayPaymentId: 'pay_1', signature: 'sig' });
    expect(verify.status).toBe(200);
    expect(verify.body.data.paymentStatus).toBe('paid');
    expect(verify.body.data.status).toBe('processing');

    expect(await inv()).toEqual({ quantity: 3, reserved: 0, available: 3 }); // committed

    // idempotent: verifying again does not double-commit
    const again = await request(app)
      .post('/api/v1/checkout/verify-payment')
      .set('Authorization', auth)
      .send({ razorpayOrderId: 'order_RZP1', razorpayPaymentId: 'pay_1', signature: 'sig' });
    expect(again.status).toBe(200);
    expect(await inv()).toEqual({ quantity: 3, reserved: 0, available: 3 });

    // cart cleared after payment
    const cart = await request(app).get('/api/v1/cart').set('Authorization', auth);
    expect(cart.body.data.itemCount).toBe(0);
  });

  it('webhook payment.captured marks the order paid (source of truth)', async () => {
    await request(app)
      .post('/api/v1/checkout')
      .set('Authorization', auth)
      .send({ address: ADDRESS });

    const hook = await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('x-razorpay-signature', 'whatever')
      .send({
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_2', order_id: 'order_RZP1' } } },
      });
    expect(hook.status).toBe(200);

    const order = await Order.findOne({});
    expect(order?.paymentStatus).toBe('paid');
    expect(await inv()).toEqual({ quantity: 3, reserved: 0, available: 3 });
  });
});
