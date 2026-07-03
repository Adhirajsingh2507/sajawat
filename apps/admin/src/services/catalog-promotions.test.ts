import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as categories from './categories';
import * as collections from './collections';
import * as promotions from './promotions';

const BASE = 'http://localhost:4000/api/v1';

function mockFetch(data: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true, data }),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function lastCall(fetchMock: ReturnType<typeof vi.fn>) {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return {
    url,
    method: init.method ?? 'GET',
    body: init.body !== undefined ? (JSON.parse(init.body as string) as unknown) : undefined,
  };
}

describe('catalog + promotions admin services', () => {
  beforeEach(() => {
    document.cookie = 'sajawat_csrf=tkn';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('creates and deletes a category', async () => {
    const createMock = mockFetch({ id: 'c1' });
    await categories.createCategory({ name: 'Necklaces', status: 'active', sortOrder: 1 });
    const create = lastCall(createMock);
    expect(create).toMatchObject({ url: `${BASE}/admin/categories`, method: 'POST' });
    expect(create.body).toEqual({ name: 'Necklaces', status: 'active', sortOrder: 1 });

    const delMock = mockFetch(undefined);
    await categories.deleteCategory('c1');
    expect(lastCall(delMock)).toMatchObject({
      url: `${BASE}/admin/categories/c1`,
      method: 'DELETE',
    });
  });

  it('updates a collection via PATCH', async () => {
    const fetchMock = mockFetch({ id: 'col1' });
    await collections.updateCollection('col1', { status: 'inactive' });
    const call = lastCall(fetchMock);
    expect(call).toMatchObject({ url: `${BASE}/admin/collections/col1`, method: 'PATCH' });
    expect(call.body).toEqual({ status: 'inactive' });
  });

  it('lists promotions with trigger + status filters', async () => {
    const fetchMock = mockFetch({ items: [], total: 0, page: 1, limit: 50, pages: 0 });
    await promotions.listPromotions({ trigger: 'coupon', status: 'active' });
    expect(lastCall(fetchMock).url).toBe(`${BASE}/admin/promotions?trigger=coupon&status=active`);
  });

  it('creates a coupon promotion', async () => {
    const fetchMock = mockFetch({ id: 'pr1' });
    await promotions.createPromotion({
      name: 'Festive 10',
      trigger: 'coupon',
      code: 'FESTIVE10',
      rewardType: 'percentage',
      value: 10,
      maxDiscount: 500,
    });
    const call = lastCall(fetchMock);
    expect(call).toMatchObject({ url: `${BASE}/admin/promotions`, method: 'POST' });
    expect(call.body).toMatchObject({ trigger: 'coupon', code: 'FESTIVE10', value: 10 });
  });
});
