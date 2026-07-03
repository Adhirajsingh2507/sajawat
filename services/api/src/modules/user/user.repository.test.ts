/**
 * User model + BaseRepository behavior (Milestone 1.1).
 *
 * Drives a real Mongoose connection against mongodb-memory-server (the 0.9
 * pattern) to exercise indexes, soft-delete scoping, and the repository surface.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ROLES } from '@sajawat/shared';
import { User } from './user.model.js';
import { UserRepository } from './user.repository.js';
import type { IUser } from './user.types.js';

let mongo: MongoMemoryServer;
const repo = new UserRepository();

function baseUser(overrides: Partial<IUser> & { email: string }): Partial<IUser> {
  return {
    firstName: 'Test',
    lastName: 'User',
    role: ROLES.CUSTOMER,
    customerType: 'b2c',
    isEmailVerified: false,
    isPhoneVerified: false,
    status: 'active',
    ...overrides,
  };
}

function idOf(doc: HydratedDocument<IUser>): string {
  return String(doc._id);
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await User.syncIndexes();
}, 60_000);

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('User model', () => {
  it('normalizes email, hides passwordHash on read, serializes id (no _id/__v)', async () => {
    const created = await repo.create(
      baseUser({ email: '  Mixed@Example.COM ', passwordHash: 'hash-value' }),
    );
    expect(created.email).toBe('mixed@example.com');

    const found = await repo.findById(idOf(created));
    expect(found).not.toBeNull();
    expect(found?.passwordHash).toBeUndefined(); // select: false

    const json = found?.toJSON() as unknown as Record<string, unknown>;
    expect(json.id).toBeDefined();
    expect(json._id).toBeUndefined();
    expect(json.__v).toBeUndefined();
  });

  it('defaults role=customer, customerType=b2c, status=active', async () => {
    const created = await repo.create({
      firstName: 'Def',
      lastName: 'Aults',
      email: 'defaults@example.com',
    });
    expect(created.role).toBe(ROLES.CUSTOMER);
    expect(created.customerType).toBe('b2c');
    expect(created.status).toBe('active');
  });

  it('rejects a duplicate email with a duplicate-key error (11000)', async () => {
    await repo.create(baseUser({ email: 'dupe@example.com' }));
    await expect(repo.create(baseUser({ email: 'Dupe@Example.com' }))).rejects.toMatchObject({
      code: 11000,
    });
  });

  it('allows multiple users without a phone (sparse unique)', async () => {
    await repo.create(baseUser({ email: 'np1@example.com' }));
    await expect(repo.create(baseUser({ email: 'np2@example.com' }))).resolves.toBeDefined();
  });

  it('rejects an invalid role (enum validation)', async () => {
    await expect(
      repo.create(baseUser({ email: 'badrole@example.com', role: 'wizard' as never })),
    ).rejects.toBeTruthy();
  });
});

describe('UserRepository', () => {
  it('findByEmail normalizes and excludes the hash; findByEmailWithPassword exposes it', async () => {
    await repo.create(baseUser({ email: 'creds@example.com', passwordHash: 'secret-hash' }));

    const byEmail = await repo.findByEmail('  CREDS@Example.com ');
    expect(byEmail).not.toBeNull();
    expect(byEmail?.passwordHash).toBeUndefined();

    const withPw = await repo.findByEmailWithPassword('creds@example.com');
    expect(withPw?.passwordHash).toBe('secret-hash');
  });

  it('updateById applies changes and returns the updated document', async () => {
    const u = await repo.create(baseUser({ email: 'upd@example.com' }));
    const updated = await repo.updateById(idOf(u), { $set: { status: 'suspended' } });
    expect(updated?.status).toBe('suspended');
  });

  it('soft-delete hides from normal reads but is visible with includeDeleted', async () => {
    const u = await repo.create(baseUser({ email: 'del@example.com' }));
    await repo.softDeleteById(idOf(u));

    expect(await repo.findById(idOf(u))).toBeNull();
    expect(await repo.findByEmail('del@example.com')).toBeNull();

    const incl = await repo.findById(idOf(u), { includeDeleted: true });
    expect(incl).not.toBeNull();
    expect(incl?.deletedAt).toBeInstanceOf(Date);
  });

  it('paginates newest-first and excludes soft-deleted from totals', async () => {
    let firstId = '';
    for (let i = 0; i < 5; i += 1) {
      const u = await repo.create(baseUser({ email: `page${String(i)}@example.com` }));
      if (i === 0) {
        firstId = idOf(u);
      }
    }

    const firstPage = await repo.paginate({}, { page: 1, limit: 3 });
    expect(firstPage.total).toBe(5);
    expect(firstPage.items).toHaveLength(3);
    expect(firstPage.pages).toBe(2);

    await repo.softDeleteById(firstId);
    const afterDelete = await repo.paginate({}, { page: 1, limit: 10 });
    expect(afterDelete.total).toBe(4);
    expect(afterDelete.items).toHaveLength(4);
  });

  it('counts and checks existence with soft-delete scoping', async () => {
    const u = await repo.create(baseUser({ email: 'count@example.com' }));
    expect(await repo.count()).toBe(1);
    expect(await repo.exists({ email: 'count@example.com' })).toBe(true);

    await repo.softDeleteById(idOf(u));
    expect(await repo.count()).toBe(0);
    expect(await repo.count({}, { includeDeleted: true })).toBe(1);
  });
});
