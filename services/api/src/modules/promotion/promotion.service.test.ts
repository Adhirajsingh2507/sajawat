/**
 * Promotion behavior (Milestone 1.5a) — pure discount math + DB-backed CRUD and
 * the cart-discount resolution rule (coupon-wins-else-best-automatic).
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Promotion } from './promotion.model.js';
import { computeDiscount, isEligible, promotionService } from './promotion.service.js';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Promotion.syncIndexes();
}, 60_000);

afterEach(async () => {
  await Promotion.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('computeDiscount (pure)', () => {
  it('percentage, capped by maxDiscount and subtotal', () => {
    expect(computeDiscount({ rewardType: 'percentage', value: 10, maxDiscount: null }, 1000)).toBe(
      100,
    );
    expect(computeDiscount({ rewardType: 'percentage', value: 50, maxDiscount: 200 }, 1000)).toBe(
      200,
    );
    expect(computeDiscount({ rewardType: 'fixed', value: 5000, maxDiscount: null }, 1000)).toBe(
      1000,
    );
  });
});

describe('isEligible (pure)', () => {
  const base = { status: 'active' as const, minCartValue: 500, startDate: null, endDate: null };
  it('respects status, threshold, and date window', () => {
    expect(isEligible(base, 600)).toBe(true);
    expect(isEligible(base, 400)).toBe(false);
    expect(isEligible({ ...base, status: 'inactive' }, 600)).toBe(false);
    const future = new Date(Date.now() + 86_400_000);
    expect(isEligible({ ...base, startDate: future }, 600)).toBe(false);
  });
});

describe('admin create', () => {
  it('requires a code for coupon promotions and rejects duplicates', async () => {
    await expect(
      promotionService.create({
        name: 'No code',
        trigger: 'coupon',
        rewardType: 'fixed',
        value: 100,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });

    await promotionService.create({
      name: 'Festive',
      trigger: 'coupon',
      code: 'festive10',
      rewardType: 'percentage',
      value: 10,
    });
    await expect(
      promotionService.create({
        name: 'Dup',
        trigger: 'coupon',
        code: 'FESTIVE10',
        rewardType: 'fixed',
        value: 50,
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects a percentage value out of range', async () => {
    await expect(
      promotionService.create({
        name: 'Bad',
        trigger: 'automatic',
        rewardType: 'percentage',
        value: 150,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('normalizes coupon code to uppercase', async () => {
    const p = await promotionService.create({
      name: 'Save',
      trigger: 'coupon',
      code: 'save5',
      rewardType: 'fixed',
      value: 5,
    });
    expect(p.code).toBe('SAVE5');
  });
});

describe('resolveCartDiscount', () => {
  it('applies a valid coupon over automatic rules', async () => {
    await promotionService.create({
      name: 'Auto 10%',
      trigger: 'automatic',
      rewardType: 'percentage',
      value: 10,
      minCartValue: 0,
    });
    await promotionService.create({
      name: 'Coupon 300',
      trigger: 'coupon',
      code: 'BIG300',
      rewardType: 'fixed',
      value: 300,
      minCartValue: 0,
    });
    const res = await promotionService.resolveCartDiscount(1000, 'BIG300');
    expect(res?.amount).toBe(300);
    expect(res?.code).toBe('BIG300');
  });

  it('falls back to the best automatic rule when the coupon is invalid', async () => {
    await promotionService.create({
      name: 'Auto 10%',
      trigger: 'automatic',
      rewardType: 'percentage',
      value: 10,
      minCartValue: 0,
    });
    await promotionService.create({
      name: 'Auto 20%',
      trigger: 'automatic',
      rewardType: 'percentage',
      value: 20,
      minCartValue: 0,
    });
    const res = await promotionService.resolveCartDiscount(1000, 'NOPE');
    expect(res?.amount).toBe(200); // best automatic (20%)
    expect(res?.code).toBeNull();
  });

  it('returns null when nothing applies', async () => {
    await promotionService.create({
      name: 'High bar',
      trigger: 'automatic',
      rewardType: 'percentage',
      value: 10,
      minCartValue: 5000,
    });
    expect(await promotionService.resolveCartDiscount(1000)).toBeNull();
  });

  it('assertCouponApplies throws for an invalid or ineligible code', async () => {
    await promotionService.create({
      name: 'Min1000',
      trigger: 'coupon',
      code: 'MIN1000',
      rewardType: 'fixed',
      value: 100,
      minCartValue: 1000,
    });
    await expect(promotionService.assertCouponApplies('MIN1000', 500)).rejects.toMatchObject({
      statusCode: 400,
    });
    await expect(promotionService.assertCouponApplies('UNKNOWN', 2000)).rejects.toMatchObject({
      statusCode: 400,
    });
    await expect(promotionService.assertCouponApplies('MIN1000', 2000)).resolves.toBeUndefined();
  });
});
