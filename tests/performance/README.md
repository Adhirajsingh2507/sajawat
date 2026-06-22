# Performance & load testing (Milestone 1.10b.1)

Two tools, both run against a **live stack** (web + API + Mongo) — never in unit
CI:

- **k6** — API load / throughput (`load/`). Encodes the doc's SLOs as
  thresholds, so a regression **fails the run**.
- **Lighthouse CI** — web Core Web Vitals on the public pages (`lighthouse/`).

Targets (from `docs/sajawat-testing-strategy.md` / `sajawat-deployment-plan.md`):
homepage/PDP < 2s, checkout < 3s, **API p95 < 500ms**; load at 100 / 500 / 1000
concurrent users across search, checkout, auth, and CRM.

## Prerequisites

1. **A running stack.** Local: bring up Mongo + API (`:4000`) + web (`:3000`)
   and seed a super-admin + at least one in-stock product (the 1.10a
   `tests/e2e/global-setup.ts` seed works, or `pnpm test:e2e:full` once).
2. **k6** installed — <https://grafana.com/docs/k6/latest/set-up/install-k6/>
   (`k6` is a standalone Go binary, not an npm dep).
3. **Lighthouse CI** — `npx @lhci/cli` (no install needed) or `pnpm add -g @lhci/cli`.
4. **Relax rate limits on the target stack** for load runs — the per-IP auth
   and enquiry limiters will otherwise throttle single-host traffic:
   `AUTH_RATE_LIMIT_MAX=1000000 RATE_LIMIT_MAX=1000000` on the API.

## Run

```bash
# 1) Always smoke first — 1 VU, validates every scenario's shapes against the API.
pnpm test:load:smoke

# 2) Headline read throughput (100→500→1000 ramp, API p95<500ms gate).
pnpm test:load

# 3) Individual scenarios (override the peak; default 1000):
PERF_PEAK_VUS=200 k6 run tests/performance/load/checkout.js
k6 run tests/performance/load/enquiry.js

# 4) Web vitals (public pages).
pnpm test:perf
```

Point at another stack with env vars:

```bash
PERF_API_URL=https://staging.example/api/v1 PERF_WEB_URL=https://staging.example \
  pnpm test:load
```

## Scenarios (`load/`)

| Script | Path under test | Gate |
|--------|-----------------|------|
| `smoke.js` | one of each (reads, register→cart→COD, enquiry) | all checks pass |
| `search.js` | catalog list, categories, search, PDP (public reads) | err<1%, p95<500ms |
| `checkout.js` | register → add to cart → COD checkout (auth write) | err<5%, p95<3s |
| `enquiry.js` | authenticated B2B enquiry submit | p95<3s (429s expected) |

`lib/config.js` holds the URLs, the staged ramp, and the threshold sets;
`lib/api.js` holds the register/login/CSRF/seed helpers.

## Caveats / known limits

- **Single-host load ≠ Cloud Run.** Laptop runs are *indicative*; record the
  staging run (with relaxed limiters) as the operator follow-up for the
  `v1.0.0` sign-off.
- **Login-gated storefront (D17).** Lighthouse profiles only public pages
  (`/login`, `/register`). Authenticated PDP/checkout page vitals need a
  Puppeteer auth script (follow-up); their *server* timings are covered by k6.
- **Write contention.** `checkout.js` registers a fresh user per iteration and
  draws down real stock — keep the seed product well-stocked or it will start
  failing on out-of-stock (a correct, expected signal).
