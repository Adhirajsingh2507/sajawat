/**
 * Inventory service behavior (Milestone 1.3b) — create-for-product, adjustments
 * (add/remove/return/manual), negative guard, status derivation, movement audit,
 * in-stock map, history. Real Mongo via mms.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Inventory } from './inventory.model.js';
import { InventoryMovement } from './inventory-movement.model.js';
import { inventoryService } from './inventory.service.js';

let mongo: MongoMemoryServer;
let productId: string;
const ADMIN = new mongoose.Types.ObjectId().toString();

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Promise.all([Inventory.syncIndexes(), InventoryMovement.syncIndexes()]);
}, 60_000);

afterEach(async () => {
  await Promise.all([Inventory.deleteMany({}), InventoryMovement.deleteMany({})]);
});

beforeEach(() => {
  productId = new mongoose.Types.ObjectId().toString();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

it('createForProduct seeds quantity, derives status, and logs a movement', async () => {
  await inventoryService.createForProduct(productId, ADMIN, { quantity: 5, lowStockThreshold: 3 });
  const inv = await Inventory.findOne({ productId });
  expect(inv?.quantity).toBe(5);
  expect(inv?.availableQuantity).toBe(5);
  expect(inv?.status).toBe('in_stock');
  expect(await InventoryMovement.countDocuments({ productId })).toBe(1);
});

describe('adjust', () => {
  beforeEach(async () => {
    await inventoryService.createForProduct(productId, ADMIN, {
      quantity: 5,
      lowStockThreshold: 3,
    });
  });

  it('adds stock and records a positive movement', async () => {
    const res = await inventoryService.adjust(
      productId,
      { type: 'stock_added', quantity: 10 },
      ADMIN,
    );
    expect(res.quantity).toBe(15);
    expect(res.status).toBe('in_stock');
    const mv = await InventoryMovement.findOne({ productId, type: 'stock_added', quantity: 10 });
    expect(mv).not.toBeNull();
  });

  it('removes stock and rejects going negative', async () => {
    const res = await inventoryService.adjust(
      productId,
      { type: 'stock_removed', quantity: 4 },
      ADMIN,
    );
    expect(res.quantity).toBe(1);
    expect(res.status).toBe('low_stock'); // available 1 <= threshold 3

    await expect(
      inventoryService.adjust(productId, { type: 'stock_removed', quantity: 999 }, ADMIN),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('manual_adjustment sets the absolute quantity with a signed delta movement', async () => {
    const res = await inventoryService.adjust(
      productId,
      { type: 'manual_adjustment', quantity: 2 },
      ADMIN,
    );
    expect(res.quantity).toBe(2);
    expect(res.status).toBe('low_stock');
    const mv = await InventoryMovement.findOne({ productId, type: 'manual_adjustment' });
    expect(mv?.quantity).toBe(-3); // 2 - 5
  });

  it('404s adjusting a product with no inventory', async () => {
    const other = new mongoose.Types.ObjectId().toString();
    await expect(
      inventoryService.adjust(other, { type: 'stock_added', quantity: 1 }, ADMIN),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

it('getInStockMap reflects availability; history lists movements', async () => {
  await inventoryService.createForProduct(productId, ADMIN, { quantity: 0 });
  const map = await inventoryService.getInStockMap([productId]);
  expect(map.get(productId)).toBe(false);

  await inventoryService.adjust(productId, { type: 'stock_added', quantity: 7 }, ADMIN);
  const map2 = await inventoryService.getInStockMap([productId]);
  expect(map2.get(productId)).toBe(true);

  const hist = await inventoryService.history({ productId });
  expect(hist.total).toBe(1); // quantity 0 create wrote no movement; the +7 add did
});
