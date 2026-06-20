import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as orders from './orders';
import * as products from './products';
import * as inventory from './inventory';

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

describe('admin services', () => {
  beforeEach(() => {
    document.cookie = 'sajawat_csrf=tkn';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('lists orders with status + paymentStatus filters', async () => {
    const fetchMock = mockFetch({ items: [], total: 0, page: 1, limit: 20, pages: 0 });
    await orders.listOrders({ page: 2, status: 'processing', paymentStatus: 'pending' });
    expect(lastCall(fetchMock).url).toBe(
      `${BASE}/admin/orders?page=2&status=processing&paymentStatus=pending`,
    );
  });

  it('omits undefined filters from the orders query', async () => {
    const fetchMock = mockFetch({ items: [], total: 0, page: 1, limit: 20, pages: 0 });
    await orders.listOrders({ status: undefined, paymentStatus: undefined });
    expect(lastCall(fetchMock).url).toBe(`${BASE}/admin/orders`);
  });

  it('patches order status', async () => {
    const fetchMock = mockFetch({ id: 'o1', status: 'packed' });
    await orders.updateOrderStatus('o1', 'packed');
    const call = lastCall(fetchMock);
    expect(call).toMatchObject({ url: `${BASE}/admin/orders/o1/status`, method: 'PATCH' });
    expect(call.body).toEqual({ status: 'packed' });
  });

  it('patches order payment', async () => {
    const fetchMock = mockFetch({ id: 'o1', paymentStatus: 'paid' });
    await orders.updateOrderPayment('o1', 'paid');
    const call = lastCall(fetchMock);
    expect(call).toMatchObject({ url: `${BASE}/admin/orders/o1/payment`, method: 'PATCH' });
    expect(call.body).toEqual({ paymentStatus: 'paid' });
  });

  it('creates a product (POST) and deletes one (DELETE)', async () => {
    const createMock = mockFetch({ id: 'p1' });
    await products.createProduct({ name: 'Ring', sku: 'R1', price: 999, categoryId: 'c1' });
    expect(lastCall(createMock)).toMatchObject({ url: `${BASE}/admin/products`, method: 'POST' });

    const delMock = mockFetch(undefined);
    await products.deleteProduct('p1');
    expect(lastCall(delMock)).toMatchObject({ url: `${BASE}/admin/products/p1`, method: 'DELETE' });
  });

  it('adjusts inventory via PATCH on the product path', async () => {
    const fetchMock = mockFetch({ productId: 'p1', quantity: 5 });
    await inventory.adjustInventory('p1', { type: 'stock_added', quantity: 5, reason: 'shipment' });
    const call = lastCall(fetchMock);
    expect(call).toMatchObject({ url: `${BASE}/admin/inventory/p1`, method: 'PATCH' });
    expect(call.body).toEqual({ type: 'stock_added', quantity: 5, reason: 'shipment' });
  });

  it('builds the inventory history query with a productId filter', async () => {
    const fetchMock = mockFetch({ items: [], total: 0, page: 1, limit: 30, pages: 0 });
    await inventory.getHistory({ page: 1, productId: 'p1' });
    expect(lastCall(fetchMock).url).toBe(`${BASE}/admin/inventory/history?page=1&productId=p1`);
  });
});
