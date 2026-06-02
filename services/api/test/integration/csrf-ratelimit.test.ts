import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { csrfGuard, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../../src/middleware/csrf.js';
import { createRateLimiter } from '../../src/middleware/rate-limit.js';
import { makeApp } from '../helpers.js';

describe('csrfGuard (double-submit)', () => {
  const app = makeApp((a) => {
    a.post('/protected', csrfGuard, (_req, res) => {
      res.json({ ok: true });
    });
  });

  it('403 when no CSRF token is present', async () => {
    const res = await request(app).post('/protected');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('403 when cookie and header mismatch', async () => {
    const res = await request(app)
      .post('/protected')
      .set('Cookie', `${CSRF_COOKIE_NAME}=aaa`)
      .set(CSRF_HEADER_NAME, 'bbb');
    expect(res.status).toBe(403);
  });

  it('passes when cookie and header match', async () => {
    const res = await request(app)
      .post('/protected')
      .set('Cookie', `${CSRF_COOKIE_NAME}=match-token`)
      .set(CSRF_HEADER_NAME, 'match-token');
    expect(res.status).toBe(200);
  });
});

describe('rate limiter', () => {
  const app = makeApp((a) => {
    a.get('/limited', createRateLimiter({ windowMs: 60_000, limit: 2 }), (_req, res) => {
      res.json({ ok: true });
    });
  });

  it('429 envelope after the limit is exceeded', async () => {
    await request(app).get('/limited').expect(200);
    await request(app).get('/limited').expect(200);
    const res = await request(app).get('/limited');
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});
