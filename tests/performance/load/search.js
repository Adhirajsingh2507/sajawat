// Headline read-throughput load test (1.10b.1): the public catalog + search
// path — the dominant traffic shape for a storefront. No auth, no per-IP write
// limits, so this is where the 100/500/1000-user ramp and the API p95 < 500ms
// SLO are most meaningful.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, ramp, API_THRESHOLDS } from './lib/config.js';

export const options = { stages: ramp(), thresholds: API_THRESHOLDS };

const TERMS = ['ring', 'gold', 'necklace', 'stud', 'bangle', 'pearl'];

export default function () {
  // Browse: list → category facets → search → PDP, like a real shopper.
  const list = http.get(`${BASE_URL}/products?limit=24`, { tags: { name: 'products/list' } });
  check(list, { 'list 200': (r) => r.status === 200 });

  http.get(`${BASE_URL}/categories`, { tags: { name: 'categories/list' } });

  const q = TERMS[Math.floor(Math.random() * TERMS.length)];
  const search = http.get(`${BASE_URL}/products/search?q=${q}`, {
    tags: { name: 'products/search' },
  });
  check(search, { 'search 200': (r) => r.status === 200 });

  // Drill into the first result's PDP when present.
  const items = list.status === 200 ? list.json('data.items') || [] : [];
  if (items.length > 0 && items[0].slug) {
    const pdp = http.get(`${BASE_URL}/products/${items[0].slug}`, {
      tags: { name: 'products/detail' },
    });
    check(pdp, { 'pdp 200': (r) => r.status === 200 });
  }

  sleep(1); // think-time between browse loops
}
