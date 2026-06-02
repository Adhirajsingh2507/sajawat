import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { ROLES, PERMISSIONS } from '@sajawat/shared';
import { requireAuth, requireRole, requirePermission } from '../../src/middleware/auth.js';
import { makeApp, accessTokenFor } from '../helpers.js';

const app = makeApp((a) => {
  a.get('/me', requireAuth, (req, res) => {
    res.json({ id: req.user?.id, role: req.user?.role });
  });
  a.get('/admin-only', requireAuth, requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN), (_req, res) => {
    res.json({ ok: true });
  });
  a.get(
    '/product-write',
    requireAuth,
    requirePermission(PERMISSIONS.PRODUCT_WRITE),
    (_req, res) => {
      res.json({ ok: true });
    },
  );
});

describe('requireAuth', () => {
  it('401 without an Authorization header', async () => {
    const res = await request(app).get('/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('401 on a malformed header', async () => {
    const res = await request(app).get('/me').set('Authorization', 'Token abc');
    expect(res.status).toBe(401);
  });

  it('200 + req.user on a valid Bearer token', async () => {
    const token = await accessTokenFor(ROLES.ADMIN, 'user-42');
    const res = await request(app).get('/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'user-42', role: ROLES.ADMIN });
  });
});

describe('requireRole', () => {
  it('allows an admin', async () => {
    const token = await accessTokenFor(ROLES.ADMIN);
    const res = await request(app).get('/admin-only').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('403 for a customer', async () => {
    const token = await accessTokenFor(ROLES.CUSTOMER);
    const res = await request(app).get('/admin-only').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

describe('requirePermission', () => {
  it('allows a role that has the permission (admin → product:write)', async () => {
    const token = await accessTokenFor(ROLES.ADMIN);
    const res = await request(app).get('/product-write').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('403 for a role without it (customer)', async () => {
    const token = await accessTokenFor(ROLES.CUSTOMER);
    const res = await request(app).get('/product-write').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
