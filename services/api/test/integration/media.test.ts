/**
 * Media upload endpoint (1.3-media) via Supertest on the real router. GCS is
 * unconfigured in tests (no GCS_BUCKET), so a valid upload takes the dormant
 * 501 path — exercising auth → multer → controller → service wiring without a
 * real bucket.
 */
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { ROLES } from '@sajawat/shared';
import { mediaAdminRouter } from '../../src/modules/media/media.routes.js';
import { accessTokenFor, makeApp } from '../helpers.js';

const app = makeApp((a) => {
  a.use('/api/v1/admin/media', mediaAdminRouter);
});

describe('POST /api/v1/admin/media', () => {
  it('401s without a token', async () => {
    const res = await request(app)
      .post('/api/v1/admin/media')
      .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0x00]), {
        filename: 'x.jpg',
        contentType: 'image/jpeg',
      });
    expect(res.status).toBe(401);
  });

  it('403s for a role without product:write', async () => {
    const token = await accessTokenFor(ROLES.CUSTOMER);
    const res = await request(app)
      .post('/api/v1/admin/media')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0x00]), { filename: 'x.jpg' });
    expect(res.status).toBe(403);
  });

  it('400s when no file is attached', async () => {
    const token = await accessTokenFor(ROLES.SUPER_ADMIN);
    const res = await request(app)
      .post('/api/v1/admin/media')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/file/i);
  });

  it('501s (dormant) when GCS is unconfigured, for an authorized upload', async () => {
    const token = await accessTokenFor(ROLES.SUPER_ADMIN);
    const res = await request(app)
      .post('/api/v1/admin/media')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0x00]), {
        filename: 'x.jpg',
        contentType: 'image/jpeg',
      });
    expect(res.status).toBe(501);
  });
});
