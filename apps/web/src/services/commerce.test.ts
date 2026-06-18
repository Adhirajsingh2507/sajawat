import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as commerce from './commerce';

const BASE = 'http://localhost:4000/api/v1';

/** Build a fetch mock that returns the standard `{ success, data }` envelope. */
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

describe('commerce service', () => {
  beforeEach(() => {
    document.cookie = 'sajawat_csrf=token123';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('adds a cart item with productId and quantity', async () => {
    const fetchMock = mockFetch({ items: [], itemCount: 0 });
    await commerce.addCartItem('p1', 3);
    const call = lastCall(fetchMock);
    expect(call.url).toBe(`${BASE}/cart/items`);
    expect(call.method).toBe('POST');
    expect(call.body).toEqual({ productId: 'p1', quantity: 3 });
  });

  it('defaults quantity to 1 when omitted', async () => {
    const fetchMock = mockFetch({});
    await commerce.addCartItem('p1');
    expect(lastCall(fetchMock).body).toEqual({ productId: 'p1', quantity: 1 });
  });

  it('updates a cart item via PATCH on the encoded product path', async () => {
    const fetchMock = mockFetch({});
    await commerce.updateCartItem('p 1', 2);
    const call = lastCall(fetchMock);
    expect(call.url).toBe(`${BASE}/cart/items/p%201`);
    expect(call.method).toBe('PATCH');
    expect(call.body).toEqual({ quantity: 2 });
  });

  it('applies a coupon code', async () => {
    const fetchMock = mockFetch({});
    await commerce.applyCoupon('FESTIVE10');
    const call = lastCall(fetchMock);
    expect(call.url).toBe(`${BASE}/cart/apply-coupon`);
    expect(call.method).toBe('POST');
    expect(call.body).toEqual({ code: 'FESTIVE10' });
  });

  it('toggles a wishlist item with POST/DELETE on the product id', async () => {
    const addMock = mockFetch({ items: [] });
    await commerce.addWishlistItem('p1');
    expect(lastCall(addMock)).toMatchObject({ url: `${BASE}/wishlist/p1`, method: 'POST' });

    const delMock = mockFetch({ items: [] });
    await commerce.removeWishlistItem('p1');
    expect(lastCall(delMock)).toMatchObject({ url: `${BASE}/wishlist/p1`, method: 'DELETE' });
  });

  it('places a COD order at the COD checkout endpoint', async () => {
    const fetchMock = mockFetch({ id: 'o1' });
    const input = {
      address: {
        fullName: 'A',
        phone: '99999',
        line1: 'L1',
        city: 'C',
        state: 'S',
        postalCode: '111111',
        country: 'India',
      },
    };
    await commerce.checkoutCod(input);
    const call = lastCall(fetchMock);
    expect(call.url).toBe(`${BASE}/checkout/cod`);
    expect(call.method).toBe('POST');
    expect(call.body).toEqual(input);
  });

  it('lists orders with pagination query params', async () => {
    const fetchMock = mockFetch({ items: [], total: 0, page: 2, limit: 10, pages: 0 });
    await commerce.getOrders({ page: 2, limit: 10 });
    expect(lastCall(fetchMock).url).toBe(`${BASE}/orders?page=2&limit=10`);
  });

  it('cancels an order via POST on the cancel sub-path', async () => {
    const fetchMock = mockFetch({ id: 'o1', status: 'cancelled' });
    await commerce.cancelOrder('o1');
    const call = lastCall(fetchMock);
    expect(call.url).toBe(`${BASE}/orders/o1/cancel`);
    expect(call.method).toBe('POST');
  });
});
