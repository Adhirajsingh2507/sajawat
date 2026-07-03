/**
 * Product service behavior (Milestone 1.3b) — create (refs, slug, sku,
 * salePrice, inventory auto-create), public scoping/filters/search, update
 * conflicts, soft-delete. Real Mongo via mms.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Category } from '../category/category.model.js';
import { Collection } from '../collection/collection.model.js';
import { categoryService } from '../category/category.service.js';
import { Product } from './product.model.js';
import { Inventory } from '../inventory/inventory.model.js';
import { InventoryMovement } from '../inventory/inventory-movement.model.js';
import { productService } from './product.service.js';
import type { CreateProductBody } from './product.validation.js';

let mongo: MongoMemoryServer;
let categoryId: string;
let categorySlug: string;
const ADMIN = new mongoose.Types.ObjectId().toString();

async function makeProduct(over: Partial<CreateProductBody> = {}) {
  return productService.create(
    {
      name: 'Gold Necklace',
      sku: `SKU-${Math.random().toString(36).slice(2, 8)}`,
      price: 1000,
      categoryId,
      ...over,
    },
    ADMIN,
  );
}

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
}, 60_000);

afterEach(async () => {
  await Promise.all([
    Product.deleteMany({}),
    Inventory.deleteMany({}),
    InventoryMovement.deleteMany({}),
    Category.deleteMany({}),
    Collection.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

// fresh category before each test
beforeEach(async () => {
  const cat = await categoryService.create({ name: 'Necklaces' });
  categoryId = cat.id;
  categorySlug = cat.slug;
});

describe('create', () => {
  it('derives slug, defaults to draft, and auto-creates an out-of-stock inventory row', async () => {
    const p = await makeProduct();
    expect(p.slug).toBe('gold-necklace');
    expect(p.status).toBe('draft');
    const inv = await Inventory.findOne({ productId: p.id });
    expect(inv?.status).toBe('out_of_stock');
    expect(inv?.quantity).toBe(0);
  });

  it('seeds inventory + a stock_added movement when quantity is given', async () => {
    const p = await makeProduct({ quantity: 10, lowStockThreshold: 3 });
    const inv = await Inventory.findOne({ productId: p.id });
    expect(inv?.quantity).toBe(10);
    expect(inv?.status).toBe('in_stock');
    const mv = await InventoryMovement.findOne({ productId: p.id });
    expect(mv?.type).toBe('stock_added');
    expect(mv?.quantity).toBe(10);
  });

  it('rejects salePrice >= price (400)', async () => {
    await expect(makeProduct({ price: 100, salePrice: 100 })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('rejects a duplicate SKU (409)', async () => {
    await makeProduct({ sku: 'DUP-1' });
    await expect(makeProduct({ sku: 'DUP-1' })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects an invalid categoryId (400)', async () => {
    const bad = new mongoose.Types.ObjectId().toString();
    await expect(makeProduct({ categoryId: bad })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('uniquifies slug on name clash', async () => {
    const a = await makeProduct({ name: 'Ruby Ring', sku: 'R1' });
    const b = await makeProduct({ name: 'Ruby Ring', sku: 'R2' });
    expect(a.slug).toBe('ruby-ring');
    expect(b.slug).toBe('ruby-ring-2');
  });
});

describe('public reads', () => {
  it('listPublic returns only active and reflects inStock', async () => {
    await makeProduct({ name: 'Active In Stock', sku: 'A1', status: 'active', quantity: 5 });
    await makeProduct({ name: 'Active No Stock', sku: 'A2', status: 'active' });
    await makeProduct({ name: 'Draft', sku: 'D1', status: 'draft' });

    const res = await productService.listPublic({});
    expect(res.total).toBe(2);
    const inStockFlags = res.items.map((p) => p.inStock).sort();
    expect(inStockFlags).toEqual([false, true]);
  });

  it('filters by category slug and by featured flag', async () => {
    await makeProduct({ name: 'Featured', sku: 'F1', status: 'active', isFeatured: true });
    await makeProduct({ name: 'Plain', sku: 'P1', status: 'active' });

    const byCat = await productService.listPublic({ category: categorySlug });
    expect(byCat.total).toBe(2);

    const onlyFeatured = await productService.listPublic({ featured: true });
    expect(onlyFeatured.total).toBe(1);
    expect(onlyFeatured.items[0]?.name).toBe('Featured');

    const unknownCat = await productService.listPublic({ category: 'no-such-category' });
    expect(unknownCat.total).toBe(0);
  });

  it('search finds active products by name (text index)', async () => {
    await makeProduct({ name: 'Diamond Solitaire', sku: 'DS1', status: 'active' });
    await makeProduct({ name: 'Gold Bangle', sku: 'GB1', status: 'active' });
    const res = await productService.search('Diamond', {});
    expect(res.total).toBe(1);
    expect(res.items[0]?.name).toBe('Diamond Solitaire');
  });

  it('getBySlugPublic 404s for a draft or missing product', async () => {
    await makeProduct({ name: 'Hidden Draft', sku: 'H1', slug: 'hidden-draft' });
    await expect(productService.getBySlugPublic('hidden-draft')).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(productService.getBySlugPublic('nope')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('update + remove', () => {
  it('rejects a slug already in use (409) and soft-deletes', async () => {
    const a = await makeProduct({ name: 'Alpha', sku: 'AL1', slug: 'alpha' });
    await makeProduct({ name: 'Beta', sku: 'BE1', slug: 'beta' });

    await expect(productService.update(a.id, { slug: 'beta' })).rejects.toMatchObject({
      statusCode: 409,
    });

    await productService.remove(a.id);
    await expect(productService.getByIdAdmin(a.id)).rejects.toMatchObject({ statusCode: 404 });
  });
});
