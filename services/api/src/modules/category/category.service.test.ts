/**
 * Category service behavior (Milestone 1.3a) — slug generation/uniqueness,
 * public-vs-admin scoping, update conflicts, soft-delete. Real Mongo via mms.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Category } from './category.model.js';
import { categoryService } from './category.service.js';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Category.syncIndexes();
}, 60_000);

afterEach(async () => {
  await Category.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('create', () => {
  it('derives a slug from the name', async () => {
    const cat = await categoryService.create({ name: 'Gold Necklaces' });
    expect(cat.slug).toBe('gold-necklaces');
    expect(cat.status).toBe('active');
  });

  it('uniquifies a clashing slug with a numeric suffix', async () => {
    await categoryService.create({ name: 'Earrings' });
    const second = await categoryService.create({ name: 'Earrings' });
    expect(second.slug).toBe('earrings-2');
  });

  it('honors an explicit slug', async () => {
    const cat = await categoryService.create({ name: 'Bridal Sets', slug: 'bridal' });
    expect(cat.slug).toBe('bridal');
  });
});

describe('public reads', () => {
  it('getBySlugPublic returns active and 404s on inactive/missing', async () => {
    await categoryService.create({ name: 'Active One', slug: 'active-one' });
    await categoryService.create({ name: 'Hidden', slug: 'hidden', status: 'inactive' });

    const found = await categoryService.getBySlugPublic('active-one');
    expect(found.name).toBe('Active One');

    await expect(categoryService.getBySlugPublic('hidden')).rejects.toMatchObject({
      statusCode: 404,
    });
    await expect(categoryService.getBySlugPublic('nope')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('listPublic excludes inactive; listAdmin includes it', async () => {
    await categoryService.create({ name: 'Visible', slug: 'visible' });
    await categoryService.create({ name: 'Inactive', slug: 'inactive', status: 'inactive' });

    const pub = await categoryService.listPublic({});
    expect(pub.total).toBe(1);

    const admin = await categoryService.listAdmin({});
    expect(admin.total).toBe(2);
  });
});

describe('update', () => {
  it('updates fields and rejects a slug already in use (409)', async () => {
    const a = await categoryService.create({ name: 'Alpha', slug: 'alpha' });
    await categoryService.create({ name: 'Beta', slug: 'beta' });

    const updated = await categoryService.update(a.id, { name: 'Alpha Prime', sortOrder: 5 });
    expect(updated.name).toBe('Alpha Prime');
    expect(updated.sortOrder).toBe(5);

    await expect(categoryService.update(a.id, { slug: 'beta' })).rejects.toMatchObject({
      statusCode: 409,
    });
  });
});

describe('remove (soft-delete)', () => {
  it('hides the category from subsequent reads', async () => {
    const cat = await categoryService.create({ name: 'Temp', slug: 'temp' });
    await categoryService.remove(cat.id);
    await expect(categoryService.getByIdAdmin(cat.id)).rejects.toMatchObject({ statusCode: 404 });
    const admin = await categoryService.listAdmin({});
    expect(admin.total).toBe(0);
  });
});
