import { describe, it, expect, vi, afterEach } from 'vitest';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from './jwt.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('jwt access tokens', () => {
  it('round-trips sub + role', async () => {
    const token = await signAccessToken({ sub: 'user-1', role: 'admin' });
    await expect(verifyAccessToken(token)).resolves.toEqual({ sub: 'user-1', role: 'admin' });
  });

  it('rejects a tampered token', async () => {
    const token = await signAccessToken({ sub: 'user-1', role: 'admin' });
    await expect(verifyAccessToken(`${token}x`)).rejects.toThrow(/Invalid or expired/);
  });

  it('rejects a refresh token used as an access token (type claim)', async () => {
    const refresh = await signRefreshToken({ sub: 'user-1', jti: 'j1', family: 'f1' });
    await expect(verifyAccessToken(refresh)).rejects.toThrow(/Invalid/);
  });

  it('rejects an EXPIRED access token (401)', async () => {
    const token = await signAccessToken({ sub: 'user-1', role: 'admin' });
    vi.useFakeTimers();
    // Default access TTL is 15m; jump past it.
    vi.setSystemTime(Date.now() + 16 * 60 * 1000);
    await expect(verifyAccessToken(token)).rejects.toThrow(/Invalid or expired/);
  });
});

describe('jwt refresh tokens', () => {
  it('round-trips sub + jti + family', async () => {
    const token = await signRefreshToken({ sub: 'user-1', jti: 'j1', family: 'f1' });
    await expect(verifyRefreshToken(token)).resolves.toEqual({
      sub: 'user-1',
      jti: 'j1',
      family: 'f1',
    });
  });

  it('rejects an access token used as a refresh token (type claim)', async () => {
    const access = await signAccessToken({ sub: 'user-1', role: 'admin' });
    await expect(verifyRefreshToken(access)).rejects.toThrow(/Invalid/);
  });

  it('rejects an EXPIRED refresh token (401)', async () => {
    const token = await signRefreshToken({ sub: 'user-1', jti: 'j1', family: 'f1' });
    vi.useFakeTimers();
    // Default refresh TTL is 7d; jump past it.
    vi.setSystemTime(Date.now() + 8 * 24 * 60 * 60 * 1000);
    await expect(verifyRefreshToken(token)).rejects.toThrow(/Invalid or expired/);
  });
});
