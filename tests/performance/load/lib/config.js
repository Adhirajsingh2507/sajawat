// Shared config for the k6 load scripts (Milestone 1.10b.1).
//
// All scripts target a LIVE stack (never CI). Override via env:
//   PERF_API_URL   base API (default local dev)   e.g. https://staging.../api/v1
//   PERF_WEB_URL   base web origin
//   PERF_PEAK_VUS  peak concurrency (default 1000; a smoke run sets 1)
//
// Per the testing-strategy doc: API p95 < 500ms; load = 100 / 500 / 1000 users.

export const BASE_URL = __ENV.PERF_API_URL || 'http://localhost:4000/api/v1';
export const WEB_URL = __ENV.PERF_WEB_URL || 'http://localhost:3000';

export const JSON_HEADERS = { 'Content-Type': 'application/json' };

const PEAK = Number(__ENV.PERF_PEAK_VUS || 1000);

/**
 * Staged ramp to the doc's 100 → 500 → 1000 concurrent users (scaled from the
 * configured peak), with warm-up and ramp-down so percentiles aren't skewed by
 * the cold start.
 */
export function ramp(peak = PEAK) {
  return [
    { duration: '30s', target: Math.max(1, Math.round(peak * 0.1)) }, // ~100
    { duration: '1m', target: Math.max(1, Math.round(peak * 0.5)) }, // ~500
    { duration: '1m', target: peak }, // 1000
    { duration: '30s', target: 0 }, // ramp-down
  ];
}

/** API SLOs: <1% errors, p95 under the 500ms target. */
export const API_THRESHOLDS = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<500'],
};

/** Checkout is a heavier write path — the doc allows < 3s. */
export const CHECKOUT_THRESHOLDS = {
  http_req_failed: ['rate<0.05'],
  http_req_duration: ['p(95)<3000'],
};
