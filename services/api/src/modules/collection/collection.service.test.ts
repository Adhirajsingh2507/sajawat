/**
 * Collection service behavior (Milestone 1.3a) — slug uniqueness, public scoping,
 * soft-delete. Real Mongo via mms.
 */
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Collection } from './collection.model.js';
import { collectionService } from './collection.service.js';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Collection.syncIndexes();
}, 60_000);

afterEach(async () => {
  await Collection.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

it('creates with a derived, uniquified slug', async () => {
  const first = await collectionService.create({ name: 'Wedding Collection' });
  expect(first.slug).toBe('wedding-collection');
  const second = await collectionService.create({ name: 'Wedding Collection' });
  expect(second.slug).toBe('wedding-collection-2');
});

it('getBySlugPublic returns active and 404s otherwise', async () => {
  await collectionService.create({ name: 'Festive', slug: 'festive' });
  await collectionService.create({ name: 'Draft', slug: 'draft', status: 'inactive' });
  expect((await collectionService.getBySlugPublic('festive')).name).toBe('Festive');
  await expect(collectionService.getBySlugPublic('draft')).rejects.toMatchObject({
    statusCode: 404,
  });
});

it('soft-deletes', async () => {
  const col = await collectionService.create({ name: 'Temp', slug: 'temp' });
  await collectionService.remove(col.id);
  await expect(collectionService.getByIdAdmin(col.id)).rejects.toMatchObject({ statusCode: 404 });
});
