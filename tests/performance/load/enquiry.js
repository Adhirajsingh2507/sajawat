// B2B lead-funnel load test (1.10b.1): authenticated wholesale enquiry submit.
// The enquiry endpoint is gated (auth-required, D17) AND rate-limited per IP, so
// from a single host this primarily characterises the limiter + persist cost,
// not raw throughput — interpret accordingly (see README). Ramps to a small peak.

import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, ramp, CHECKOUT_THRESHOLDS } from './lib/config.js';
import { register, authHeaders, freshCustomer } from './lib/api.js';

export const options = {
  stages: ramp(Math.max(1, Math.round(Number(__ENV.PERF_PEAK_VUS || 1000) * 0.05))),
  // Accept throttling as expected here; gate only on latency, not the 429 rate.
  thresholds: { http_req_duration: ['p(95)<3000'] },
};

export default function () {
  const customer = freshCustomer();
  const token = register(customer);
  if (!token) return;

  const res = http.post(
    `${BASE_URL}/enquiries`,
    JSON.stringify({
      name: 'Perf Buyer',
      company: 'Perf Traders Pvt Ltd',
      phone: '9876543210',
      email: customer.email,
      city: 'Surat',
      quantity: 500,
    }),
    { headers: authHeaders(token), tags: { name: 'enquiries/submit' } },
  );
  // 201 created, or 429 when the per-IP limiter kicks in — both are "handled".
  check(res, {
    'enquiry handled': (r) => r.status === 201 || r.status === 200 || r.status === 429,
  });
}
