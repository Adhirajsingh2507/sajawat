import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

describe('error envelope + body parsing', () => {
  it('unknown route → 404 envelope', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('malformed JSON → 400 envelope', async () => {
    const res = await request(app)
      .post('/api/v1/anything')
      .set('Content-Type', 'application/json')
      .send('{ not valid json');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('oversized body → 413 envelope', async () => {
    const big = `{"a":"${'x'.repeat(1_100_000)}"}`;
    const res = await request(app)
      .post('/api/v1/anything')
      .set('Content-Type', 'application/json')
      .send(big);
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});

describe('security headers + CORS', () => {
  it('sets helmet headers and hides x-powered-by', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('allows a configured origin', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://localhost:3000');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('silently denies an unknown origin (no ACAO header, no 5xx)', async () => {
    const res = await request(app).get('/health').set('Origin', 'http://evil.example');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
