import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as contact from './contact';

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

describe('contact service', () => {
  beforeEach(() => {
    document.cookie = 'sajawat_csrf=token123';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reads public contact info from /settings/public', async () => {
    const fetchMock = mockFetch({ businessName: 'Sajawat', whatsappNumber: '+9199' });
    const info = await contact.getContactInfo();
    expect(info.businessName).toBe('Sajawat');
    expect(lastCall(fetchMock)).toMatchObject({ url: `${BASE}/settings/public`, method: 'GET' });
  });

  it('submits a contact message to /contact', async () => {
    const fetchMock = mockFetch({ id: 'lead1', stage: 'new' });
    const ack = await contact.submitContact({
      name: 'Aditi',
      email: 'a@x.test',
      phone: '9876500000',
      message: 'Hi',
    });
    expect(ack.id).toBe('lead1');
    const call = lastCall(fetchMock);
    expect(call).toMatchObject({ url: `${BASE}/contact`, method: 'POST' });
    expect(call.body).toEqual({
      name: 'Aditi',
      email: 'a@x.test',
      phone: '9876500000',
      message: 'Hi',
    });
  });
});
