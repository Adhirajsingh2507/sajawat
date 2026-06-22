// Auth/seed helpers shared by the k6 load scripts.
//
// The API uses hybrid auth: a Bearer access token (returned by login/register)
// for protected reads/writes, plus an httpOnly refresh cookie + a double-submit
// CSRF cookie/header for the cookie endpoints (refresh/logout). k6 keeps a
// per-VU cookie jar automatically; we surface the Bearer token + CSRF value.

import http from 'k6/http';
import { BASE_URL, JSON_HEADERS } from './config.js';

/** Pull the double-submit CSRF token out of a response's Set-Cookie jar. */
export function csrfFromJar(jar) {
  const c = jar.cookiesForURL(BASE_URL);
  const v = c['sajawat_csrf'];
  return Array.isArray(v) ? v[0] : (v ?? '');
}

export function authHeaders(token) {
  return { ...JSON_HEADERS, Authorization: `Bearer ${token}` };
}

/** Register a fresh customer; returns the access token (or null on failure). */
export function register(user) {
  const res = http.post(`${BASE_URL}/auth/register`, JSON.stringify(user), {
    headers: JSON_HEADERS,
    tags: { name: 'auth/register' },
  });
  return res.status === 200 || res.status === 201 ? res.json('data.accessToken') : null;
}

/** Log in; returns the access token (or null on failure / throttle). */
export function login(email, password) {
  const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({ email, password }), {
    headers: JSON_HEADERS,
    tags: { name: 'auth/login' },
  });
  return res.status === 200 ? res.json('data.accessToken') : null;
}

/** A unique, valid-looking customer for write scenarios. */
export function freshCustomer() {
  const uniq = `${__VU}-${__ITER}-${Date.now()}`;
  return {
    firstName: 'Perf',
    lastName: 'Buyer',
    email: `perf+${uniq}@example.test`,
    password: 'PerfPass1234',
  };
}

/** A valid COD shipping address. */
export function sampleAddress() {
  return {
    fullName: 'Perf Buyer',
    phone: '9876543210',
    line1: '1 Load Street',
    city: 'Jaipur',
    state: 'Rajasthan',
    postalCode: '302001',
    country: 'India',
  };
}

/**
 * Find a buyable product id from the public catalog. Used by k6 `setup()` so
 * every VU shares one deterministic, in-stock product without re-querying.
 */
export function findBuyableProductId() {
  const res = http.get(`${BASE_URL}/products?limit=20`, { tags: { name: 'products/list' } });
  if (res.status !== 200) return null;
  const items = res.json('data.items') || [];
  const inStock = items.find((p) => p.inStock !== false);
  return (inStock || items[0])?.id ?? null;
}
