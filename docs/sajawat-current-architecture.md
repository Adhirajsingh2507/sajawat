# SAJAWAT — CURRENT ARCHITECTURE SNAPSHOT

> Living document. Records the architecture **as actually implemented** through
> the latest completed milestone. The aspirational/target specs remain in
> `sajawat-system-architecture.md`; this file is the ground truth of what exists.

- **As of:** Milestone 0.7 complete (auth foundation)
- **Latest completed milestone:** 0.7 (JWT/Argon2/RBAC utilities, auth + CSRF middleware, auth rate limiter)
- **Phase:** 0 — Foundation (infrastructure only; no business features — no auth *endpoints* yet)

---

## 1. Approved Architecture Decisions (authoritative list)

| Area | Decision | Rationale | Status |
|------|----------|-----------|--------|
| Monorepo | **Turborepo 2.x** (`tasks` key) + **pnpm workspaces** | Incremental, cached builds; pnpm strictness | ✅ Implemented |
| Node | **Node 22 LTS** is the contract (`.nvmrc`, CI, Docker base) | LTS stability; ecosystem validation | ✅ Contract set |
| Package manager | **pnpm 9.15.0**, pinned via `packageManager` | Reproducible; Corepack in CI/Docker | ✅ Implemented |
| Language | **TypeScript strict** + extra strict flags | Type safety, "no any" | ✅ Implemented |
| Module system | **ESM + NodeNext** (Node packages), **Bundler** (apps/ui) | Forward-looking; native Node 22 ESM; no dual-package hazard | ✅ Implemented |
| Backend | **Express 5** (5.2.1) | Native async error propagation; ESM-friendly | ✅ Implemented (0.4) |
| Logging | **pino + pino-http** (9.14 / 10.5) | Fast, JSON-native (Cloud Run), redaction | ✅ Implemented (0.4) |
| Frontend | **Next.js 16** (App Router) | SSR/SSG for SEO, server components | ✅ Scaffolded |
| UI runtime | **React 19** | Latest stable | ✅ Scaffolded |
| Styling | **Tailwind CSS v4** | Utility-first, CSS-first config | ✅ Scaffolded |
| Package strategy | **AD-1 role-based** (see §2) | Right tool per consumer type | ✅ Implemented |
| Type sharing | **TypeScript project references** (composite for `shared`) | Incremental, ordered builds | ✅ Implemented |
| Workspace deps | **`workspace:*`** + package `exports` (no tsconfig `paths`) | Single source of truth for resolution | ✅ Implemented |
| Linting | **Single root ESLint flat config**, zero-warning policy | One source of truth; lint-staged ↔ turbo parity | ✅ Implemented |
| Commits | **Conventional Commits** via commitlint + Husky | Enforced hygiene | ✅ Implemented |
| Validation | **Zod** (3.25), request + env, `req.validatedData` | Runtime + compile-time safety | ✅ Implemented (0.4) |
| Database | **MongoDB Atlas + Mongoose 9** (single default connection) | One-DB service; simple model registration. **Mongoose 9 is the approved baseline** (0.5 plan said `^8`; approved post-review — greenfield, gates green, smoke passed) | ✅ Implemented (0.5) |
| DB connect | **Connect-before-listen** + bounded backoff; exit(1) on exhaustion; driver auto-reconnect after | Instance only serves once DB-ready; orchestrator restarts on hard failure | ✅ Implemented (0.5) |
| DB security | `strictQuery` + `sanitizeFilter`; URI never logged | NoSQL-injection defense + secret hygiene | ✅ Implemented (0.5) |
| Config loading | **Node-native `--env-file`** (no dotenv); layered `.env.<NODE_ENV>` → `.env` → `process.env` | Contract is Node 22; native flag suffices; cloud env wins | ✅ Implemented (0.6) |
| Config hardening | **Production guards** (no localhost `API_BASE_URL`/`CORS_ORIGINS`) + **pre-commit secret guard** | Fail-fast on leaked dev config; block committing real `.env*` | ✅ Implemented (0.6) |
| Auth tokens | **JWT via `jose`** — Bearer access (~15m) + httpOnly refresh cookie (~7d), distinct secrets, `type` claim, iss/aud bound | Stateless, ESM-native, CSRF-resistant transport | ✅ Utilities (0.7) |
| Password hashing | **Argon2id via `@node-rs/argon2`** (prebuilt, no node-gyp) | Strong KDF; Docker/Cloud-Run friendly | ✅ Implemented (0.7) |
| Authorization | **Centralized RBAC** catalog + matrix in `@sajawat/shared`; token carries role only | Single source; small tokens; typed `module:action` permissions | ✅ Implemented (0.7) |
| CSRF | Bearer API CSRF-immune; **double-submit guard** for cookie endpoints | Resolves D11 | ✅ Implemented (0.7) |
| Payments | **Razorpay** behind a `PaymentProvider` abstraction | Provider-agnostic | ⏳ Phase 1 |
| Messaging | **MSG91** (SMS) · **WhatsApp Business API** (Meta), provider-abstracted | Decided | ⏳ Phase 1 |
| Caching | **Redis** — Phase 2, planned, not implemented | Cache-aside, never a correctness dependency | ⏳ Phase 2 |

---

## 2. AD-1 — Role-Based Package Consumption Strategy

A package is **compiled** if and only if it has a non-bundler (Node/API) consumer.

| Package | Kind | Strategy | Build? | Consumed by | Mechanism |
|---------|------|----------|--------|-------------|-----------|
| `@sajawat/types` | type-only | source | ❌ | all | `exports.types → ./src/index.ts`; **`import type`** only |
| `@sajawat/ui` | React TSX | source | ❌ | web, admin only | `transpilePackages: ['@sajawat/ui']` |
| `@sajawat/shared` | runtime (Zod/utils) | **compiled** → `dist` (ESM + d.ts) | ✅ | web, admin, **api** | normal resolution |
| `@sajawat/config` | tooling | none | ❌ | all (build-time) | `extends` / `exports` |

**Project references:** `services/api` → references composite `@sajawat/shared`; root `tsconfig.json` is a solution file referencing the composite projects. Source-only packages (`types`, `ui`) and the Next apps are typechecked standalone (`tsc --noEmit`); ordering is delegated to Turbo `^build`.

---

## 3. TypeScript Configuration

Shared bases in `@sajawat/config/typescript/`:

| Base | Used by | Key options |
|------|---------|-------------|
| `base.json` | (extended by all) | `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `isolatedModules`, ES2022 |
| `node.json` | `services/api` | NodeNext, `outDir dist` |
| `library.json` | `@sajawat/shared` | `composite`, NodeNext, emits `dist` |
| `react-library.json` | `@sajawat/ui` | Bundler, `jsx: react-jsx`, `noEmit` |
| `nextjs.json` | `apps/web`, `apps/admin` | Bundler, `jsx: preserve`, next plugin, `noEmit` |

**Note:** `verbatimModuleSyntax` mandates explicit `import type`, which is what makes the source-only `@sajawat/types` package safe (type-only imports erase at compile time).

---

## 4. ESLint Architecture (Milestone 0.3)

- **Single root `eslint.config.mjs`** (flat config) is the source of truth. ESLint v9 ascends from cwd, so both `turbo run lint` (per-package) and `lint-staged` (repo root) resolve the same config → no drift.
- Shared configs live in `@sajawat/config`: `eslint/base` (TS) and `eslint/react` (ui).
- `files`-scoping: `packages/**`+`services/**` → base; `packages/ui/**` → base + React; `apps/**` → `eslint-config-next` + cross-cutting rules.
- **Enforced rules:** `eslint:recommended`, `typescript-eslint:recommended` (incl. `no-explicit-any`), `consistent-type-imports`, **CJS-interop ban** (no named *value* imports from `express`/`mongoose`), `no-unused-vars` (`^_` escape), React hooks as errors.
- **Type-aware layer (0.4):** `@sajawat/config/eslint/type-checked` extends `typescript-eslint:recommendedTypeChecked` and adds `no-floating-promises` + `no-misused-promises`. Scoped to `services/api/**/*.ts` and wired via `languageOptions.parserOptions { projectService: true, tsconfigRootDir }` in the root config — no per-package `parserOptions.project` files (this was the reason D6 was originally deferred; now resolved).
- **CJS-interop selector refinement (0.4):** the `no-restricted-syntax` selectors now carry `[importKind!='type']` on both the `ImportDeclaration` and the `ImportSpecifier`, so type-only imports (`import type { Request } from 'express'`) are allowed while named *value* imports remain banned.
- **Zero-warning policy:** every workspace runs `eslint . --max-warnings 0`.
- `lint-staged` uses `eslint --fix --max-warnings 0 --no-warn-ignored`.
- **Next 16 removed build-time ESLint** (`next lint` and the `eslint` config key are gone) — linting is owned exclusively by the root config via Turbo.

---

## 5. Commit Hygiene

- **Husky v9** hooks: `pre-commit` → `lint-staged` + `turbo run typecheck`; `commit-msg` → `commitlint`.
- **commitlint** extends `config-conventional` with a custom `type-enum` and `scope-enum` (domain + surface + meta scopes). Subject-case restrictions enforced. Empty scope disallowed.

---

## 6. Runtime Topology (target — partially realized)

```
Customer (web :3000) ─┐
Admin    (admin :3001)─┼─→  API (Express :4000, /api/v1)  ─→  MongoDB Atlas
                       │            │
                       │            ├─→ Google Cloud Storage
                       │            ├─→ Razorpay / MSG91 / WhatsApp
                       └────────────┘   (all behind abstractions)
```
Realized today: web + admin scaffolds build & run; **`services/api` is a running Express 5 server** (`/health`, `/api/v1/health`) with structured logging, request IDs, env validation, error hierarchy, and a Zod validation middleware. **MongoDB Atlas connectivity + DB readiness are wired (0.5):** the API connects to Atlas (Mongoose) at boot and the readiness route reflects DB health.

---

## 7. API Foundation (Milestone 0.4)

App factory pattern: `createApp()` (`src/app.ts`) builds the wired Express
instance without binding a port; `src/index.ts` listens and owns process
lifecycle. The same factory is reusable by Supertest in 0.9.

**Module map (`services/api/src`)**

| Path | Responsibility |
|------|----------------|
| `config/env.ts` | Zod-validated, frozen env. **Fail-fast**: invalid config writes a readable report to stderr and `process.exit(1)`. Exposes `env`, `isProduction/isDevelopment/isTest`. |
| `config/logger.ts` | pino logger; JSON in prod (Cloud Run), pino-pretty in dev; field redaction (`authorization`, `cookie`, `*.password`, `*.token`, `*.secret`, tokens). |
| `errors/app-error.ts` | `AppError` base (statusCode, machine `code`, optional field `details`, `isOperational`) + subclasses (BadRequest, Validation, Unauthorized, Forbidden, NotFound, Conflict, TooManyRequests, InternalServer); `clientErrorCode(status)` maps 4xx → code. |
| `http/respond.ts` | Response envelope. `sendSuccess()` + `buildErrorEnvelope()`; every response carries `meta.requestId` + `meta.timestamp`. |
| `middleware/request-logger.ts` | pino-http; mints/honors `x-request-id` (echoed in response header, attached as `req.id`); status→level mapping (5xx→error, 4xx→warn, else info). |
| `middleware/security.ts` (0.4.1) | `securityHeaders` = helmet (CSP **off** — JSON API; `crossOriginResourcePolicy: cross-origin`); `corsMiddleware` = env-driven allow-list (`CORS_ORIGINS`), `credentials: true`, no-Origin requests allowed, unknown browser origins silently denied (no 5xx). |
| `middleware/rate-limit.ts` (0.4.1) | `createRateLimiter(overrides)` factory (defaults from `RATE_LIMIT_WINDOW_MS`/`RATE_LIMIT_MAX`, draft-7 headers, 429→`TooManyRequestsError`); `globalRateLimiter` (per-IP, **skips** `/health` and `/api/v1/health`). |
| `middleware/validate.ts` | `validate(schema)` parses `{ body, query, params }` and writes to **`req.validatedData`** (never `req.query`/`req.params`, read-only in Express 5); failures → `ValidationError` with per-field details. |
| `middleware/not-found.ts` | Terminal 404 → `NotFoundError` (standard envelope, not Express HTML). |
| `middleware/error-handler.ts` | Single global handler. `AppError` passes through; `ZodError` → validation; exposed `http-errors` 4xx (body-parser) → correct status; everything else → non-operational `InternalServerError` (message masked in prod). |
| `routes/health.routes.ts` | `GET /api/v1/health` enveloped readiness (service, env, uptime). DB check added 0.5. |
| `types/express.d.ts` | Augments `Express.Request` with `validatedData?` (`req.id`/`req.log` come from pino-http's own augmentation). |

**Middleware order:** request-logger (+ request id) → **helmet → cors → global
rate limiter (0.4.1)** → body parsers (1mb cap) → `/health` liveness (minimal,
unversioned) → `/api/v1/*` → 404 → global error handler (last). cors is placed
before the limiter so OPTIONS preflight is short-circuited (204) and not
counted. **Response envelopes:** success `{ success:true, data, meta }`; error
`{ success:false, error:{ code, message, details? }, meta }`.

**Security posture (0.4.1):** helmet secure headers, env-driven CORS allow-list
with credentials, per-IP global rate limiting. **Still deferred:** CSP (belongs
to the Next.js apps), CSRF protection, and auth/OTP-specific strict limiters
(0.7) — see open-debt.

**Dev/runtime:** `dev` = `tsx watch --env-file-if-exists=.env.development`;
`start` = `node --env-file-if-exists=.env dist/index.js`; `build` = `tsc`.
Graceful shutdown on SIGTERM/SIGINT (drain + 10s failsafe); `unhandledRejection`
logged, `uncaughtException` fatal-logged + exit.

---

## 8. Database Layer (Milestone 0.5)

MongoDB Atlas via **Mongoose 9**, single default connection (`mongoose.connect`).
No business collections yet — 0.5 ships the **connection foundation + conventions**;
domain models land from 0.6.

**Module map (`services/api/src/db`)**

| Path | Responsibility |
|------|----------------|
| `db/connection.ts` | `connectToDatabase()` — bounded exponential backoff + jitter on the *initial* connect (attempts/base delay from env); throws on exhaustion (caller fatal-logs + exits). `disconnectFromDatabase()` for graceful shutdown. Connection events (`connected`/`disconnected`/`reconnected`/`error`) → structured logs. Globals: `strictQuery`, `sanitizeFilter`, `autoIndex = !isProduction`. **URI credentials are stripped before logging.** |
| `db/health.ts` | `checkDatabaseHealth()` — cheap `connection.readyState` label gate + bounded `admin().ping()` deep check (raced against a ~1s timeout so a stalled server can't hang the response). Returns `{ state, ok }`. |
| `db/base-plugin.ts` | `baseSchemaPlugin` — house style for 0.6 schemas: `timestamps`, `toJSON`/`toObject` transform (`_id`→`id`, strip `__v`). Soft-delete (`deletedAt`) is a documented opt-in convention. No model registered in 0.5. |
| `db/index.ts` | Barrel: `connectToDatabase`, `disconnectFromDatabase`, `checkDatabaseHealth`, `baseSchemaPlugin`, `DbHealth`/`DbConnectionState` types. |

**Connection decisions (AD-2…AD-10):**
- **AD-2** single default connection (revisit if a 2nd DB appears).
- **AD-3** connect-before-listen with retry; exit(1) on exhaustion; **auto-reconnect after** the first success — later disconnects never crash the process.
- **AD-4** liveness `/health` stays DB-independent (200 always); readiness `/api/v1/health` reports `healthy`/`degraded` and **503** when the DB is down.
- **AD-5** domain-colocated schemas (no central `models/`); shared `baseSchemaPlugin`.
- **AD-6** repository pattern *contract* locked; the generic `BaseRepository` is implemented in 0.6 alongside the first real model (avoids speculative abstraction).
- **AD-7** `autoIndex` off in prod; indexes created via explicit `syncIndexes()` per model when collections land.
- **AD-8** Mongoose/MongoDB errors normalized centrally in the global error handler: `ValidationError`→400 (+field details), `CastError`→400, dup-key `E11000`→409, `DocumentNotFoundError`→404. New `ServiceUnavailableError` (503, `SERVICE_UNAVAILABLE`).
- **AD-9** `strictQuery` + `sanitizeFilter` (NoSQL-injection defense); URI never logged; Mongoose query-debug logging is dev-only/opt-in.
- **AD-10** `MONGODB_URI` required + tunable pool/timeout/retry env vars.

**Boot order (`src/index.ts`):** validate env → `await connectToDatabase()` → `createApp()` → `app.listen`. **Graceful shutdown:** re-entrancy-guarded async `shutdown()` — drain HTTP (`server.close`) → `disconnectFromDatabase()` → exit(0), with a 10s failsafe.

**Verified (live smoke):** initial connect (attempt 1/5) + connected log (host only, no creds); `/health` 200; readiness 200 `healthy` (`db: connected/ok`); after stopping Mongo, `/health` stays 200 while readiness flips to **503 `degraded`** (`db: disconnected/ok:false`) with a "disconnected; will reconnect" warning (no crash); SIGTERM → "Drained HTTP + database; exiting"; fail-fast on missing/malformed `MONGODB_URI` (exit 1).

---

## 9. Configuration & Environment Strategy (Milestone 0.6)

Node-native env loading (no dotenv dependency). Full reference:
`sajawat-environment-guide.md`.

**Loading precedence (low → high)** — empirically verified on Node:
```
.env.<NODE_ENV>   →   .env (optional local override)   →   process.env (platform)
```
- Later `--env-file` overrides earlier; a var already in `process.env` is never
  overridden by a file → **Cloud Run + Secret Manager always win**.
- API scripts: `dev` loads `.env.development`→`.env`; `start` loads
  `.env.production`→`.env`; both use `--env-file-if-exists` so cloud (no files) is
  a no-op. `.env.<NODE_ENV>` is canonical; `.env` is an optional personal override.
- **Next.js apps** use Next's own loader (NOT `--env-file`); `NEXT_PUBLIC_*` →
  browser, non-secret only. Per-app `.env.example` templates document the surface.

**Decisions (AD-11 … AD-15):**
- **AD-11** Node-native `--env-file`, no new dependency.
- **AD-12** Layered precedence above; `.env.<NODE_ENV>` canonical + optional `.env` override.
- **AD-13** Cloud uses Google Secret Manager + Cloud Run env; **no `.env` files in containers**. `.env.staging`/`.env.production` are local-simulation only (gitignored). GCP binding lands in 0.8/0.10.
- **AD-14** Production guards in `config/env.ts`: fail-fast if `API_BASE_URL` or any `CORS_ORIGINS` entry is localhost when `NODE_ENV==='production'`.
- **AD-15** Next-native loading + per-app `.env.example` (`apps/web`, `apps/admin`).

**Secret hygiene:** only `*.example` templates are committed. A pre-commit guard
(`scripts/check-staged-secrets.sh`, wired into `.husky/pre-commit`) blocks any
staged real `.env*`. Root + per-app `.gitignore` negate `!.env.example`.

**Verified (live smoke):** AD-14 prod+localhost → fail-fast (both violations,
exit 1); AD-12 `.env` overrides `.env.development`, `process.env` beats both;
secret guard blocks a staged `.env.development`, allows `.env.example`;
`git add --dry-run` confirms per-app `.env.example` trackable while `.env.local`
stays ignored.

---

## 10. Auth Foundation (Milestone 0.7)

**Stateless primitives + middleware only** — no auth endpoints, no `User`/`Role`/
session collections, no OAuth/OTP/2FA (all Phase 1). Validated by the 0.7 live
smoke; unit tests land in 0.9.

**Module map**

| Path | Responsibility |
|------|----------------|
| `@sajawat/shared` `auth/roles.ts` | `ROLES`, `PERMISSIONS` (`module:action`), `ROLE_PERMISSIONS` matrix, `hasPermission`, `getPermissionsForRole`, `isRole`. **Centralized RBAC source** (api + admin UI). |
| `@sajawat/shared` `auth/password-policy.ts` | `passwordSchema` (Zod: ≥8, ≤128, letter+number). |
| `services/api` `auth/jwt.ts` | `signAccessToken`/`signRefreshToken`/`verifyAccessToken`/`verifyRefreshToken` (jose, HS256). Distinct secrets; `type` claim; iss/aud bound; refresh carries `jti`+`family`. Failures → opaque `UnauthorizedError`. |
| `auth/password.ts` | `hashPassword`/`verifyPassword` (Argon2id, OWASP cost m=19456/t=2/p=1). |
| `auth/cookies.ts` | `setRefreshCookie`/`clearRefreshCookie` — httpOnly, Secure-in-prod, SameSite=Strict, path `/api/v1/auth`. |
| `auth/rbac.ts` | API bridge re-exporting the shared catalog (single import point). |
| `middleware/auth.ts` | `requireAuth` (Bearer→verify→`req.user`), `requireRole(...)`, `requirePermission(...)` → 401/403 via the global handler. Route-level only. |
| `middleware/csrf.ts` | `issueCsrfToken` + `csrfGuard` (double-submit, constant-time compare) for cookie endpoints. |
| `middleware/rate-limit.ts` | + `authRateLimiter` (very strict, from `createRateLimiter`). |

**Token strategy:** access = Bearer header (client memory, ~15m); refresh =
httpOnly+Secure+SameSite=Strict cookie (~7d), rotation-ready. **Issuance/login/
refresh endpoints + the rotating session store = Phase 1** (tracked: **D15** — no
server-side revocation yet).

**Wiring:** `cookie-parser` added after body parsers in `app.ts`; `req.user`
augmented in `types/express.d.ts`; logger redaction extended with `*.otp`.
`JWT_*` graduated to **required** env (≥32 chars, access≠refresh, iss/aud
required) with fail-fast validation.

**Verified (smoke):** Argon2id hash/verify (correct→true, wrong→false); access &
refresh sign/verify round-trips (jti/family preserved); **type-confusion
rejected** both ways; tampered token rejected; RBAC matrix
(admin/customer/super_admin/inventory_staff); env fail-fast on missing/short/
identical secrets and missing iss/aud.

---

## 11. Toolchain Provisioning Caveat

- **CI/Docker (Node 22):** Corepack enables pnpm 9.15.0 the documented way.
- **This local machine (Node 25):** Corepack's bundled shim is incompatible with Node 25 (`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`); pnpm 9.15.0 was installed via an npm user-prefix instead. `engine-strict=false` so installs run on Node 25. The Node 22 contract is enforced in CI/Docker, advisory locally.
