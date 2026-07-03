/**
 * Vitest setup (Milestone 0.9) — runs before any test module imports.
 *
 * Sets the required env BEFORE `config/env.ts` is imported, so its fail-fast
 * validation passes deterministically and the harness self-provisions all
 * required vars (retires the D13 tests-half — no real `.env` needed).
 */
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL ??= 'silent';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-aaaaaaaaaaaaaaaaaaaaaaaaaa';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-bbbbbbbbbbbbbbbbbbbbbbbbb';
process.env.JWT_ISSUER ??= 'sajawat-api-test';
process.env.JWT_AUDIENCE ??= 'sajawat-clients-test';
// Placeholder URI: valid format so env validation passes. DB-backed integration
// tests spin up mongodb-memory-server and drive mongoose directly.
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/sajawat_test';
process.env.CORS_ORIGINS ??= 'http://localhost:3000,http://localhost:3001';
// Functional auth tests exercise many requests against the shared (very strict)
// auth limiter; raise it so they don't flake. The limiter itself is verified
// independently in test/integration/csrf-ratelimit.test.ts with its own limit.
process.env.AUTH_RATE_LIMIT_MAX ??= '1000';
// GOOGLE_CLIENT_ID is intentionally left UNSET by default so the 501
// "not configured" path is exercised; the google-enabled tests mock env.

// Pin the mongodb-memory-server binary to a build that runs everywhere
// (the default 8.x ubuntu2404 build SIGSEGVs on some hosts). Overridable in CI.
process.env.MONGOMS_VERSION ??= '6.0.14';
