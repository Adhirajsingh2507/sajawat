import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as profile from './profile';

const BASE = 'http://localhost:4000/api/v1';

function mockFetch(data: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true, data }),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('profile service', () => {
  beforeEach(() => {
    document.cookie = 'sajawat_csrf=token123';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('PATCHes /auth/me and returns the updated user', async () => {
    const fetchMock = mockFetch({
      user: { id: 'u1', firstName: 'Aditi', lastName: 'S', email: 'a@x.test', role: 'customer' },
    });
    const user = await profile.updateProfile({
      firstName: 'Aditi',
      phone: '9876500000',
      address: { line1: '12 Jewel Lane', city: 'Jaipur' },
    });
    expect(user.firstName).toBe('Aditi');
    const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    expect(url).toBe(`${BASE}/auth/me`);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toMatchObject({
      firstName: 'Aditi',
      phone: '9876500000',
      address: { line1: '12 Jewel Lane', city: 'Jaipur' },
    });
  });
});
