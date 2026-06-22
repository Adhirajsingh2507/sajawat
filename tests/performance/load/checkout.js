// Revenue-path load test (1.10b.1): register → add to cart → COD checkout.
// This is a WRITE path behind auth — heavier than reads and subject to stock
// contention, so it ramps to a smaller peak by default and uses the < 3s
// checkout SLO. Each iteration is a brand-new customer to avoid cart coupling.
//
// NOTE: the per-IP auth limiter throttles register/login from a single host —
// run the target stack with a raised AUTH_RATE_LIMIT_MAX / RATE_LIMIT_MAX for
// meaningful numbers (see tests/performance/README.md).

import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, ramp, CHECKOUT_THRESHOLDS } from './lib/config.js';
import {
  register,
  authHeaders,
  freshCustomer,
  sampleAddress,
  findBuyableProductId,
} from './lib/api.js';

// Checkout ramps to ~10% of the read peak by default (writes are costlier).
export const options = {
  stages: ramp(Math.max(1, Math.round(Number(__ENV.PERF_PEAK_VUS || 1000) * 0.1))),
  thresholds: CHECKOUT_THRESHOLDS,
};

export function setup() {
  const productId = findBuyableProductId();
  if (!productId) throw new Error('checkout load: no buyable product — seed one first.');
  return { productId };
}

export default function (data) {
  const token = register(freshCustomer());
  if (!token) return; // throttled or failed — counted by http_req_failed
  const headers = authHeaders(token);

  const add = http.post(
    `${BASE_URL}/cart/items`,
    JSON.stringify({ productId: data.productId, quantity: 1 }),
    { headers, tags: { name: 'cart/add' } },
  );
  check(add, { 'add-to-cart ok': (r) => r.status === 200 || r.status === 201 });

  const order = http.post(
    `${BASE_URL}/checkout/cod`,
    JSON.stringify({ address: sampleAddress() }),
    { headers, tags: { name: 'checkout/cod' } },
  );
  check(order, { 'cod order created': (r) => r.status === 200 || r.status === 201 });
}
