import { describe, it, expect, vi } from 'vitest';
import type { Response } from 'express';
import { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } from './cookies.js';

function mockRes(): Response {
  return { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as Response;
}

describe('refresh cookie', () => {
  it('sets an httpOnly SameSite=Strict path-scoped cookie with a maxAge', () => {
    const res = mockRes();
    setRefreshCookie(res, 'the-token');
    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_COOKIE_NAME,
      'the-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        path: '/api/v1/auth',
        secure: false, // NODE_ENV=test → not production
        maxAge: 7 * 24 * 60 * 60 * 1000, // default 7d
      }),
    );
  });

  it('clears the cookie with the same path', () => {
    const res = mockRes();
    clearRefreshCookie(res);
    expect(res.clearCookie).toHaveBeenCalledWith(
      REFRESH_COOKIE_NAME,
      expect.objectContaining({ path: '/api/v1/auth' }),
    );
  });
});
