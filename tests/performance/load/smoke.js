// 1-VU smoke for the load suite (1.10b.1): proves every scenario's requests and
// payload shapes work against a live stack before committing to a long
// high-VU run. Run this first; it's also the cheapest CI-adjacent sanity check.
//
//   PERF_PEAK_VUS is ignored here — this is always 1 VU, 1 iteration.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, JSON_HEADERS } from './lib/config.js';
import {
  register,
  authHeaders,
  freshCustomer,
  sampleAddress,
  findBuyableProductId,
} from './lib/api.js';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: { checks: ['rate>0.99'] }, // every assertion must pass
};

export default function () {
  // Reads.
  check(http.get(`${BASE_URL}/health`), { 'health ok': (r) => r.status === 200 });
  const list = http.get(`${BASE_URL}/products?limit=5`);
  check(list, { 'products list 200': (r) => r.status === 200 });
  check(http.get(`${BASE_URL}/products/search?q=ring`), { 'search 200': (r) => r.status === 200 });

  // Auth + revenue write path.
  const token = register(freshCustomer());
  check(null, { 'register returns token': () => Boolean(token) });
  if (!token) return;
  const headers = authHeaders(token);

  const productId = findBuyableProductId();
  if (productId) {
    const add = http.post(`${BASE_URL}/cart/items`, JSON.stringify({ productId, quantity: 1 }), {
      headers,
    });
    check(add, { 'add-to-cart ok': (r) => r.status === 200 || r.status === 201 });

    const order = http.post(
      `${BASE_URL}/checkout/cod`,
      JSON.stringify({ address: sampleAddress() }),
      { headers },
    );
    check(order, { 'cod order ok': (r) => r.status === 200 || r.status === 201 });
  }

  // B2B enquiry.
  const enq = http.post(
    `${BASE_URL}/enquiries`,
    JSON.stringify({
      name: 'Perf Buyer',
      company: 'Perf Traders',
      phone: '9876543210',
      email: `perf-enq+${Date.now()}@example.test`,
      city: 'Surat',
    }),
    { headers: { ...JSON_HEADERS, Authorization: headers.Authorization } },
  );
  check(enq, { 'enquiry created': (r) => r.status === 201 || r.status === 200 });

  sleep(0.5);
}
