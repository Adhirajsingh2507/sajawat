import { describe, it, expect } from 'vitest';
import { GET } from './route.js';

describe('admin /health route', () => {
  it('returns 200 with the service tag', async () => {
    const res = GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: 'ok', service: 'admin' });
  });
});
