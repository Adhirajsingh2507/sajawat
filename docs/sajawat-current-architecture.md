# SAJAWAT — CURRENT ARCHITECTURE SNAPSHOT

> Living document. Records the architecture **as actually implemented** through
> the latest completed milestone. The aspirational/target specs remain in
> `sajawat-system-architecture.md`; this file is the ground truth of what exists.

- **As of:** Phase 1 in progress through **Milestone 1.10a**; `origin/develop` = `ff14bf5` (1.10a).
- **Latest completed milestones:** **1.4c** storefront shopping UI, **1.7a/b** admin operations console, **1.8a/b** B2B enquiry + CRM + notifications, **1.9a** per-app nonce-based **CSP** (web+admin, closes D12), **1.9b** CI dependency + secret scanning, **1.10a** live-stack **business-journey E2E** (B2C COD + B2B enquiry). Both revenue funnels (B2C retail, B2B enquiry→CRM) are functional end-to-end. **143 API tests** + web/admin component tests + **3 full-stack E2E journeys** (gated on `E2E_FULL_STACK=1`) green.
- **Phase-0 foundation** (0.1–0.10a) remains the infrastructure baseline (§§1–14). **Automated CD (Cloud Run, 0.10b) is authored but unactivated (D16)**; staging auto-deploys on `develop` via WIF, production pipeline is unrun. A **manual** Cloud Run staging deploy is live (§15).
- **Note:** `main` HEAD `bbf068d` is a **post-0.10a administrative commit** (only `.claude/settings.local.json`; no app code), **kept in history (no rewrite)**. The §§1–18 foundation reflects the `ece7971` tree; §§19–20 record the Phase-1 domains built on `develop`.

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
| Containers | **Multi-stage `node:22-bookworm-slim`**, non-root, `turbo prune` + `pnpm deploy` / Next `standalone` | Slim, hardened, Cloud-Run-ready images | ✅ Implemented (0.8) |
| Local orchestration | **`docker-compose.yml`** (api+web+admin+`mongo:7`) — dev only | Integrated local runs + local MongoDB | ✅ Implemented (0.8) |
| Testing | **Vitest** (unit+integration) + **Supertest** on `createApp()` + **mongodb-memory-server** + **Playwright** (chromium smoke + **1.10a live-stack business journeys**, gated on `E2E_FULL_STACK=1`) | Fast, hermetic, ESM-native; tests run against source | ✅ Implemented (0.9; journeys 1.10a) |
| CI | **GitHub Actions** (`.github/workflows/ci.yml`): Corepack pnpm, **Node 22 pinned + guarded**, frozen install, Turbo-driven `lint/typecheck/build/test(+coverage)`, chromium e2e smoke, Docker build validation; pnpm/Turbo/mongod/Playwright caching; coverage artifacts | One CI provider; reproducible; matches Docker provisioning (AD-39…AD-46) | ✅ Implemented (0.10a) |
| CD | **Cloud Run + Artifact Registry + WIF + Secret Manager** (staging tag-auto / prod tag-gated) | Keyless OIDC, runtime secret injection, digest promotion, revision rollback (AD-47…AD-57) | 🚧 **Fully authored; activation pending (0.10b / D16 implementation-complete).** 0.10b.1 provisioning scripts (§16), 0.10b.2 `deploy-staging.yml` (§17), 0.10b.3 `deploy-production.yml` (§18) all authored + statically validated; **not yet run against GCP** and no deploy has succeeded. A **manual** staging deploy is live (§15). |
| CD env isolation | **Separate `staging` + `production` GCP projects** | IAM/secret/billing blast-radius isolation (AD-47) | 🚧 Scripted (0.10b.1) |
| CD identity | **Keyless WIF/OIDC**, repo-pinned, bound on GitHub Environment claim; per-service runtime SAs (only `api-run` reads secrets); least-privilege deployer SA | No long-lived keys; prod reviewer gate enforced at the identity layer (AD-48, AD-50, AD-51) | 🚧 Scripted (0.10b.1) |
| CD secrets | **Secret Manager** for `MONGODB_URI`/`JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` (values injected out-of-band via stdin); `JWT_ISSUER`/`JWT_AUDIENCE` plain Cloud Run env vars | Secrets never in git/argv/CI logs (AD-52) | 🚧 Containers scripted (0.10b.1) |
| CD tooling | **Idempotent gcloud scripts** (not Terraform), per-env config | Reproducible, low-overhead, operator-runnable (AD-53) | 🚧 Implemented (0.10b.1) |
| CD scope | **API-only** (staging + production); web/admin deferred | web/admin are starter boilerplate (D4) with no Cloud Run targets — no placeholder deploys (AD-54) | 🚧 Authored (0.10b.2/0.10b.3) |
| CD promotion | **Tag `v*` → staging-digest promotion** (copy into prod AR, deploy by digest); required-reviewer `production` Environment | Prod ships the exact bytes staging validated; no rebuild; reviewer gate at the identity layer (AD-56) | 🚧 Authored (0.10b.3) |
| CD safety | **Deploy by digest**, `--no-traffic --tag=candidate` → readiness gate → traffic shift → post-shift **automated rollback** | A bad revision never serves (pre-shift); prod restores the prior revision on post-shift failure (AD-55, AD-57) | 🚧 Authored (0.10b.2 pre-shift / 0.10b.3 rollback) |
| CI/CD DRY | **Reusable `_quality.yml`** gate shared by CI + staging + production deploy | One gate definition; deploys can't drift from CI | ✅ Implemented (0.10b.2) |
| Payments | **Razorpay** behind a `PaymentProvider` abstraction | Provider-agnostic | ✅ Implemented (1.6b) — dormant until keys (D18) |
| Messaging | **WhatsApp Business API** (Meta) behind a `NotificationProvider` abstraction (MSG91 SMS = future provider) | Decided; provider-abstracted | ✅ WhatsApp implemented (1.8a) — dormant until keys (D19) |
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
with credentials, per-IP global rate limiting. At the time, deferred: CSP
(belongs to the Next.js apps — **shipped in 1.9a**, §20.4), CSRF protection
(**done in 0.7**, double-submit), and auth/OTP-specific strict limiters (0.7) —
see open-debt.

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

## 11. Containerization & Local Orchestration (Milestone 0.8)

Three independent, Cloud-Run-ready images; one process each, listening on
**8080** in-container. Build from the repo root.

| Image | Base | Build flow | Runtime |
|-------|------|-----------|---------|
| `api` | `node:22-bookworm-slim` | `turbo prune` → `pnpm install` (cached) → `turbo build` → **`pnpm deploy --prod`** | `node dist/index.js` |
| `web` | same | prune → install → `next build` (**`output:'standalone'`**) | `node apps/web/server.js` |
| `admin` | same | same | `node apps/admin/server.js` |

**Decisions (AD-23…AD-30):** glibc/slim base (argon2 prebuilts; **not Alpine**);
Next standalone + `outputFileTracingRoot`; API via `pnpm deploy`; `turbo prune
--docker` + BuildKit pnpm-store cache mounts (manifest-first layering); **honor
`$PORT`** (`env.PORT ?? API_PORT`; Next `HOSTNAME=0.0.0.0`); `NEXT_PUBLIC_*` are
**build-args** → frontend images are environment-specific; compose is **local-dev
only**; hardened (non-root `USER node`, no secrets baked, exec-form CMD for
SIGTERM, `HEALTHCHECK` via Node `fetch`, `HUSKY=0`).

**Cloud Run compatibility:** stateless, single port `$PORT`, JSON logs to stdout,
SIGTERM-graceful. The API opens its port only **after** the Mongo connect, so the
open socket is correct readiness — set a generous startup-probe timeout (DB
connect budget). Dockerfile `HEALTHCHECK` serves compose/local; Cloud Run probes
are configured in 0.10.

**Compose:** `api + web + admin + mongo:7`, healthchecks, `init:true`,
`depends_on: service_healthy`. API runs `NODE_ENV=staging` locally (skips the
AD-14 localhost guard *and* the dev-only pino-pretty devDep absent from the
`--prod` image). `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1`
(browser-facing host URL, not the internal `api` hostname).

**Verified (live):** all four services healthy; `/health` 200 on
api(4000)/web(3000)/admin(3001); readiness `healthy` db=connected (**API→Mongo**);
**Web→API** + **Admin→API** over the compose network; non-root (uid 1000) in all;
argon2id loads in-container; SIGTERM → graceful drain. Image sizes: api 360MB,
web/admin 401MB.

---

## 12. Testing Foundation (Milestone 0.9)

Harness for the existing code (no business domains yet → E2E is a smoke
scaffold). **61 Vitest + 2 Playwright = 63 tests green.**

**Topology**
- Shared base **`@sajawat/config/vitest/base.mts`** (AD-32): a Vite plugin that
  resolves NodeNext relative `.js` specifiers → `.ts` source, `@sajawat/*` →
  `src` aliases (tests run against source for true coverage), and coverage
  defaults. Per-package `vitest.config.ts` + `"test": "vitest run"`; **Turbo**
  orchestrates (`test` task: `^build`, outputs `coverage/**`).
- **Environments:** node (`api`, `shared`); **jsdom + React Testing Library**
  (`web`, `admin`).
- **AD-36 tsconfig split:** api `tsconfig.json` (lint/typecheck, includes
  `test/**` so the type-aware ESLint `projectService` covers tests) +
  `tsconfig.build.json` (emit `src` only); shared/apps exclude `*.test.*` from
  emit. Type-aware lint relaxed for test files (`no-unsafe-*`, `unbound-method`).

**Unit** (colocated `*.test.ts`): RBAC matrix (every role, allow/deny), password
policy, Argon2id hash/verify, JWT round-trips + **type-confusion** + tamper +
**expired access & refresh → 401**, cookie attributes, AppError/`clientErrorCode`.

**Integration** (Supertest on `createApp()`): `/health` + readiness
**healthy/degraded(503)** via `mongodb-memory-server`; 404/400(malformed
JSON)/413 envelopes; helmet headers + CORS allow/deny; `requireAuth`/
`requireRole`/`requirePermission` (401/403); CSRF double-submit; rate-limit 429.

**E2E** (AD-38): root `playwright.config.ts`, chromium-only, `webServer` starts
the built web app; `PLAYWRIGHT_BASE_URL` targets the `docker compose` stack
(Docker-aware mode). `tests/e2e/smoke.spec.ts` (homepage + `/health`).

**Coverage** (`@vitest/coverage-v8`): floors enforced on `src/auth` + `src/errors`
(api) and `src/auth` (shared) — current auth 87.9%, errors 92.6%, shared auth
100%; global ~66% (moderate, ratcheted as domains land). `pnpm test:coverage`.

**Environment:** `test/setup.ts` sets `NODE_ENV=test` + test JWT secrets +
placeholder `MONGODB_URI` + `MONGOMS_VERSION=6.0.14` (the default 8.x mongod
SIGSEGVs on some hosts) **before** any import — the harness self-provisions
required env (no real `.env`).

---

## 13. Toolchain Provisioning Caveat

- **CI/Docker (Node 22):** Corepack enables pnpm 9.15.0 the documented way.
- **This local machine (Node 25):** Corepack's bundled shim is incompatible with Node 25 (`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`); pnpm 9.15.0 was installed via an npm user-prefix instead. `engine-strict=false` so installs run on Node 25. The Node 22 contract is enforced in CI/Docker, advisory locally.

---

## 14. CI Pipeline (Milestone 0.10a)

GitHub Actions is the sole CI/CD provider (AD-39). One workflow today —
`.github/workflows/ci.yml` — runs on every `pull_request` and every `push` to
`main`/`develop`, with a `concurrency` group that cancels superseded runs and
least-privilege `permissions: contents: read`. **CD (Cloud Run) is deferred to
0.10b** and intentionally absent.

**Jobs**

| Job | Runner | Responsibility |
|-----|--------|----------------|
| `quality` | `ubuntu-22.04` | `corepack enable` → `setup-node` (`.nvmrc`, `cache: pnpm`) → **Node-22 guard** → `pnpm install --frozen-lockfile` → `turbo run lint typecheck build` → `turbo run test -- --coverage` → upload `coverage/` artifacts. |
| `e2e` | `ubuntu-22.04` | Cached chromium Playwright; build `@sajawat/web`; run the smoke spec (homepage + `/health`). No Mongo needed. |
| `docker` | `ubuntu-22.04` (matrix api/web/admin) | **Push events only.** `build-push-action` validates each 0.8 Dockerfile (`push: false`) with GHA layer cache (`type=gha`, per-service scope). |

**Decisions (AD-39 … AD-46, AD-49 … AD-50; AD-47/48 are 0.10b):**
- **AD-39** GitHub Actions as the single CI/CD provider.
- **AD-40** Node 22 enforced via `setup-node` + `.nvmrc` **and** an explicit guard
  step (fails if major ≠ 22). `engine-strict` stays `false` so local Node-25
  installs still work — enforcement is a **CI runtime pin**, not a strict toggle.
  **This is the D1 closure.**
- **AD-41** **Corepack** activates pnpm 9.15.0 from `packageManager` — identical to
  the 0.8 Docker path. Must run **before** `setup-node` (whose `cache: pnpm` needs
  pnpm on PATH).
- **AD-42** `pnpm install --frozen-lockfile` (lockfile authoritative; fail on drift).
- **AD-43** **Turbo drives the gates** (`--cache-dir=.turbo`, restored via
  `actions/cache`); Vercel Remote Cache deferred (no external token in Phase 0).
- **AD-44** Coverage is uploaded as a **build artifact**; Vitest threshold floors
  fail the job. No Codecov/third-party in Phase 0.
- **AD-45** Gate jobs need **no real secrets** — `test/setup.ts` self-provisions
  test env; only `MONGOMS_VERSION=6.0.14` is set (also keys the mongod binary
  cache). **This is the CI-side D13 closure.**
- **AD-46** Docker images are **build-validated** in CI (no push); push/deploy is
  0.10b. GHA layer cache keeps rebuilds cheap.
- **AD-49** (applies in 0.10b) frontend images are environment-specific
  (`NEXT_PUBLIC_*` baked at build); the API image is env-agnostic.
- **AD-50** (applies in 0.10b) branch→env mapping: PR ⇒ gates; `develop` ⇒ staging;
  `main` ⇒ production behind a GitHub Environment with a required reviewer.

**Caching:** pnpm store (`setup-node` `cache: pnpm`), Turbo (`.turbo`),
`mongodb-binaries` (keyed on `MONGOMS_VERSION`), Playwright browsers
(keyed on `pnpm-lock.yaml`), Docker layers (`type=gha`).

**Release / branching (D9):** annotated `vX.Y.0-phase0` per milestone; the
previously-untagged milestones (0.4.1 → 0.9) were retro-tagged at their recorded
commits, plus `v0.10.0-phase0`. `develop` was fast-forwarded to `main` in 0.10a;
it has since **drifted one commit behind** (`origin/develop` = `ece7971`, while
`origin/main` = the administrative `bbf068d`) — **re-synced to `main` before
Phase-1 work** (decision). First production release `v1.0.0` at the end of Phase 1.

---

## 15. Manual Cloud Run Staging Deploy (verified — NOT milestone 0.10b)

> A live staging service exists, but it was created by an **ad-hoc
> `gcloud run deploy`**, not by the automated CD pipeline that milestone 0.10b
> defines. This section records what is real so a future reader does not mistake
> the live URL for a finished CD story. **D16 stays open.**

- **Service URL:** `https://sajawat-api-staging-1019894285252.asia-south1.run.app`
- **Region:** `asia-south1` (Mumbai) · **GCP project number:** `1019894285252`
- **Image:** the 0.8 API image (`infrastructure/docker/api.Dockerfile`) built from the `ece7971` / `v0.10.0-phase0` tree.
- **Verified (by user):** `GET /health` ✅ · `GET /api/v1/health` ✅ (readiness) · **MongoDB Atlas connected** ✅. Confirms Cloud-Run-readiness from §11 (single `$PORT`, JSON stdout logs, SIGTERM-graceful, connect-before-listen) holds against real Atlas.

**What is intentionally NOT present (the 0.10b deliverables — D16):**
- No `deploy-staging.yml` / `deploy-production.yml` (only `ci.yml` exists).
- No **Workload Identity Federation** (keyless OIDC) — the manual deploy used a developer/local credential, not a least-privilege CI deployer SA.
- No **Artifact Registry** config or SHA-tagged push pipeline.
- No **Secret Manager** wiring: the service's secrets (`MONGODB_URI`, `JWT_*`) were injected **by hand** at deploy time and are **not** captured as code/config. AD-13 (cloud uses Secret Manager, no container `.env`) is **honored in spirit but not yet codified**.
- No separate CI-deployer vs Cloud Run runtime SAs, no `develop`→staging / `main`→production mapping, no post-deploy readiness gate, no revision-rollback automation.

**Security note:** because the live secrets were placed manually and live only in
the running revision's config, they are not rotated, reviewed, or reproducible.
Sourcing them from Secret Manager + rotation is tracked in the **Phase-1.0
Operational Hardening (1.0-OH)** task (Atlas password rotation, JWT secret
rotation, exposed-test-credential replacement, Secret Manager verification,
documented rotation procedure). Per decision this is **non-blocking** for other
Phase-1 work but should land before any production deploy.

---

## 16. CD Infrastructure Automation (Milestone 0.10b.1)

> **Status:** scripts authored + statically validated (`bash -n` + `shellcheck
> -x` clean); **not yet executed against GCP** (operator-run). Deploy workflows
> now authored: staging (§17, 0.10b.2) and production (§18, 0.10b.3). **D16 is
> implementation-complete; closure pending operator activation.**

Idempotent `gcloud` provisioning scripts under `infrastructure/scripts/gcp/`,
parameterized per environment via committed **non-secret** config files. They
provision the GCP side of CD for **two separate projects** (AD-47) so a staging
compromise can never reach production identities or secrets.

**Decisions (AD-47 … AD-53):**
- **AD-47** Separate `staging` (`sajawat-staging`, project `1019894285252`) and `production` GCP projects.
- **AD-48** **Keyless WIF/OIDC** — GitHub Actions federates in; **no exported SA keys** anywhere.
- **AD-49** (applies in 0.10b.2) env-specific frontend images / env-agnostic API image.
- **AD-50** Branch/tag→env: `develop`→staging (auto), tag `v*`→production (required-reviewer GitHub Environment). The WIF deployer binding is scoped to the **GitHub Environment claim** (`staging`/`production`), so the production reviewer gate is enforced at the **identity layer**, not just by convention.
- **AD-51** **Per-service runtime SAs** (`sajawat-{api,web,admin}-run`); only `api-run` holds `secretmanager.secretAccessor` (scoped to the three secrets); web/admin runtimes read nothing. Deployer SA (`sajawat-deployer`) holds `artifactregistry.writer` (repo-scoped), `run.admin` (project), and `iam.serviceAccountUser` on the runtime SAs only.
- **AD-52** Secrets in **Secret Manager**: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`. Scripts create **empty containers**; **values are injected out-of-band via stdin** (`--data-file=-`), never in git, argv, or CI logs. `JWT_ISSUER`/`JWT_AUDIENCE` are **plain Cloud Run env vars** (set by the deploy workflow), not secrets.
- **AD-53** **Idempotent gcloud scripts** (not Terraform); describe-or-create + idempotent IAM bindings; **create/bind only, never delete**; explicit `--project` on every call; confirmation prompt echoing the target project.

**WIF design:** pool `github-pool` + OIDC provider `github-oidc` per project.
Provider attribute-condition pins `repository_owner == 'Adhirajsingh2507' &&
repository == 'Adhirajsingh2507/sajawat'` (rejects all other repos at the
provider). Attribute mapping exposes `repository`, `repository_owner`,
`environment`, `ref`. The deployer SA is bound (`workloadIdentityUser`) to
`principalSet://…/attribute.environment/<env>` — so only jobs declaring the
matching GitHub Environment can impersonate it.

**Script inventory (`infrastructure/scripts/gcp/`):** `lib.sh` (shared helpers,
config loader, WIF math, auth/cmd guards), `config.staging.sh` /
`config.production.sh` (non-secret), `00-bootstrap-project.sh` (optional, guarded
— project create + billing link), `01-enable-apis.sh`, `02-artifact-registry.sh`,
`03-secrets.sh` (containers + prints stdin injection commands),
`04-service-accounts.sh` (SAs + least-priv IAM), `05-workload-identity.sh` (pool/
provider/binding + prints the GitHub variables), `provision.sh <env>`
(orchestrator), `verify.sh <env>` (read-only assertions, non-zero on any gap),
`README.md` (runbook). All operator-run (Claude cannot authenticate to GCP).

**Outputs for 0.10b.2/0.10b.3** (printed by `05`, recorded as non-secret GitHub
variables): `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_WIF_PROVIDER`,
`GCP_DEPLOYER_SA`, `GCP_AR_IMAGE_PREFIX`.

---

## 17. CD — Staging Deploy Workflow (Milestone 0.10b.2, API-only)

> **Status:** workflows authored + statically validated (`actionlint 1.7.7`,
> embedded `shellcheck`, YAML parse, `bash -n` — all clean); **not yet activated**
> (needs 0.10b.1 run, secret values injected, and the `staging` GitHub
> Environment populated). **Verified:** the one run to date failed at WIF auth
> because the `staging` Environment has no variables. Production CD + rollback is
> now authored (§18, 0.10b.3).

**Scope decision (AD-54 — API-only).** `apps/web`/`apps/admin` are unmodified
`create-next-app` starter pages (D4) with no product UI and no Cloud Run
services. Per "no placeholder deployment complexity to satisfy future
architecture," the staging workflow deploys **the API only**. Frontend deploy
automation lands with the Phase-1 web (1.4) / admin (1.7) UIs; the workflow is
structured so adding them later is incremental (a parallel build + a deploy
block), not a rewrite.

**Files (`.github/workflows/`):**
- `_quality.yml` — **reusable** (`workflow_call`) lint/typecheck/build/test gate, extracted from the 0.10a `ci.yml` and shared by both `ci.yml` and `deploy-staging.yml` (one definition, zero drift). Carries the `MONGOMS_VERSION` pin and `contents: read`.
- `ci.yml` — refactored: its `quality` job now `uses: ./.github/workflows/_quality.yml`; `e2e` + `docker` unchanged.
- `deploy-staging.yml` — three jobs: **verify** (`uses: _quality.yml`) → **build** → **deploy**.

**Pipeline (`deploy-staging.yml`):**
- **Trigger:** `push: develop` (+ `workflow_dispatch`). `concurrency: deploy-staging`, `cancel-in-progress: false` (queue, never half-deploy). `permissions: contents: read` + `id-token: write`.
- **build** (`environment: staging`): WIF auth (`google-github-actions/auth@v2` with `vars.GCP_WIF_PROVIDER` + `vars.GCP_DEPLOYER_SA`) → `gcloud auth configure-docker` → `docker/build-push-action@v6` builds `infrastructure/docker/api.Dockerfile` from repo root, pushes `…/api:<git-sha>`, exposes the `@sha256` **digest** as a job output.
- **deploy** (`environment: staging`): WIF auth → `gcloud run deploy $API_SERVICE --image …/api@<digest> --service-account api-run --no-traffic --tag=candidate --allow-unauthenticated --min-instances=0 --set-secrets MONGODB_URI/JWT_ACCESS_SECRET/JWT_REFRESH_SECRET=:latest --set-env-vars NODE_ENV=staging,JWT_ISSUER,JWT_AUDIENCE,CORS_ORIGINS,API_BASE_URL`.
- **Readiness gate (AD-55):** resolve the candidate tag URL (`https://candidate---<base>`), poll `GET /api/v1/health` for HTTP 200 (readiness returns 503 until Mongo is up) up to 30×5s ≈ 2.5 min, then `gcloud run services update-traffic --to-tags candidate=100`. A failed gate **fails the job and never shifts traffic** — the prior revision keeps serving (rollback is the default state). Full *post-shift* automated rollback is 0.10b.3.

**Identity & secrets:** keyless WIF only; the job's `environment: staging`
supplies the OIDC `environment` claim the deployer-SA binding requires (fails
closed if omitted). App secrets come from Secret Manager via the `api-run`
runtime SA; **no** GitHub secrets, **no** long-lived keys, nothing secret in
logs. `JWT_ISSUER`/`JWT_AUDIENCE` are plain env vars (AD-52).

**Legacy staging service is disposable (no in-place migration).** The
hand-deployed staging service carried incompatible legacy config — `JWT_ISSUER`/
`JWT_AUDIENCE` bound as *secret* env vars (Cloud Run rejects changing a key's TYPE
in place) and a foreign runtime SA (`sajawat-runtime-staging`, which the deployer
SA cannot `actAs`). Rather than migrate that service in place (which surfaced one
landmine after another), it is treated as **disposable**: the operator deletes it
once, and the workflow recreates a clean service. `gcloud run deploy` is
**create-or-update**, so the first pipeline run provisions the service from
scratch with `JWT_ISSUER`/`JWT_AUDIENCE` as plain literals (AD-52) and the
provisioned `api-run` runtime SA. The earlier secret→literal conversion logic was
therefore **removed** from `deploy-staging.yml`. (Production has no pre-existing
service, so it is always a clean create; its workflow is unchanged this milestone
and is slated for the same simplification.)

**Branch hygiene:** `develop` was re-synced to `main` (`eeb6c00`) before authoring
so the `develop` trigger reflects current code (target topology: `main` source of
truth → `develop` synced → feature branches off `develop`).

**Required `staging` Environment variables (non-secret):** `GCP_PROJECT_ID`,
`GCP_REGION`, `GCP_WIF_PROVIDER`, `GCP_DEPLOYER_SA`, `GCP_AR_IMAGE_PREFIX`,
`API_SERVICE`, `API_RUNTIME_SA`, `APP_JWT_ISSUER`, `APP_JWT_AUDIENCE`,
`APP_CORS_ORIGINS`, `APP_API_BASE_URL`.

---

## 18. CD — Production Deploy Workflow (Milestone 0.10b.3, API-only) — closes D16

> **Status:** `deploy-production.yml` authored + statically validated
> (`actionlint 1.7.7` with integrated `shellcheck`, YAML parse, `bash -n` on all
> embedded scripts — all clean). **D16 is implementation-complete but NOT yet
> closed:** closure requires operator activation (provisioning, the `production`
> GitHub Environment with a required reviewer, prod secret injection, the
> cross-project reader grant, one successful staging deploy to produce a
> promotable digest, one gated production deploy, and one rollback drill). See the
> D16 closure criteria in `sajawat-open-debt.md`.

**Trigger & promotion model.** Pushing an annotated release tag `v*` (or
`workflow_dispatch` with an existing tag) fires the workflow — the explicit
staging→production promotion path (AD-50: `develop`⇒staging auto, tag `v*`⇒
production gated). Promotion is operator-initiated by cutting a tag; it is never
automatic from `develop`. A tag can only be deployed if the commit it points at
was already built **and** deployed to staging, so production only ever ships a
staging-validated artifact.

**Files (`.github/workflows/`):** `deploy-production.yml` — two jobs: **verify**
(`uses: ./.github/workflows/_quality.yml`, the same DRY gate as CI + staging,
read from the tagged tree) → **deploy** (`environment: production`).

**Pipeline (`deploy-production.yml` → `deploy` job):**
- Resolve `TAG` → checkout that ref → `git rev-parse HEAD` → commit `SHA` (uniform across tag-push and dispatch).
- WIF auth as the **production** deployer SA (job is `environment: production`); `setup-gcloud`; one `configure-docker` (the single `REGION-docker.pkg.dev` host fronts both projects' repos).
- **Resolve + promote (AD-56):** `gcloud artifacts docker images describe ${STAGING_AR_IMAGE_PREFIX}/api:${SHA}` → staging digest (fail-fast with a clear message if absent — enforces "tag must point at a staging-built commit"); `gcloud artifacts docker images copy ${STAGING}/api@<digest> ${PROD}/api:${SHA}`; re-`describe` the **production** tag → authoritative `PROD_DIGEST`.
- **Capture rollback target:** the revision currently serving 100% (empty on the first prod deploy).
- **Deploy candidate (AD-55):** `gcloud run deploy $API_SERVICE --image ${PROD}/api@${PROD_DIGEST} --service-account api-run --no-traffic --tag=candidate --allow-unauthenticated --min-instances=1 --set-secrets MONGODB_URI/JWT_ACCESS_SECRET/JWT_REFRESH_SECRET=:latest --set-env-vars NODE_ENV=production,JWT_ISSUER,JWT_AUDIENCE,CORS_ORIGINS,API_BASE_URL`.
- **Readiness gate (pre-shift):** poll the candidate tag URL `GET /api/v1/health` for 200 (30×5s ≈ 2.5 min). Fail → exit, **no traffic shifted**, prior revision keeps serving, **no rollback needed**.
- **Traffic shift:** `update-traffic --to-tags candidate=100` (records `shifted=true`).
- **Post-shift validation:** poll the **live** base URL (`/api/v1/health` + `/health`) 6×5s — tests what users now hit, not the candidate tag.
- **Automated rollback (AD-57)** — `if: failure() && steps.shift.outputs.shifted == 'true'`: `update-traffic --to-revisions ${PREV_REVISION}=100`, re-assert health on the restored revision, then keep the job red and emit a `::warning::` (bad candidate left in place for post-mortem; no delete). If `PREV_REVISION` is empty (first-ever prod deploy) it emits a `::error::` demanding manual intervention rather than crashing.

**Decisions added in 0.10b.3:**
- **AD-56 — Digest promotion, not rebuild.** Production deploys the byte-identical image staging validated. The `deploy` job copies the staging digest into the **production** Artifact Registry (preserving AD-47 isolation) and deploys from the prod-local digest. The only cross-project crossing is a **deploy-time image READ**: the production deployer SA is granted repo-scoped `roles/artifactregistry.reader` on the **staging** repo (operator action). There are **no cross-project runtime pulls** — production Cloud Run pulls solely from the production repo via its own `api-run` runtime SA. (Rejected alternative: granting prod runtime SA cross-project read — breaks runtime isolation.)
- **AD-57 — Automated post-shift rollback.** Staging (0.10b.2) only had *pre-shift* abort (a bad candidate never gets traffic). Production adds *post-shift* recovery: if validation fails after the 100% shift, traffic is automatically restored to the previously-serving revision and re-health-checked, and the job fails loudly. This is the capability that completes the D16 "rollback" requirement.
- **Production runtime sizing.** `--allow-unauthenticated` (public storefront API) and `--min-instances=1` (avoid cold-start on first real traffic); staging stays `--min-instances=0` for cost.

**Identity & secrets:** keyless WIF only; `environment: production` supplies the
`production` OIDC claim the deployer-SA binding requires AND triggers the GitHub
required-reviewer gate — the reviewer gate is thus enforced at the **identity
layer** (a compromised workflow cannot mint the prod claim without a human
approving the job). App secrets come from production Secret Manager via the
`api-run` runtime SA; **no** GitHub secrets, **no** long-lived keys, nothing
secret in logs. `JWT_ISSUER`/`JWT_AUDIENCE` remain plain env vars (AD-52).
Production has no pre-existing Cloud Run service, so its first deploy is always a
clean create-from-scratch (no secret-typed env vars to convert). The production
workflow still carries the now-removed-from-staging conversion block as dead code;
it is harmless on a fresh service and is slated for the same removal in a later
production-focused change (unchanged this milestone).

**Required `production` Environment configuration:** required reviewer(s);
deployment policy restricted to **tags matching `v*`**; variables `GCP_PROJECT_ID`,
`GCP_REGION`, `GCP_WIF_PROVIDER`, `GCP_DEPLOYER_SA`, `GCP_AR_IMAGE_PREFIX`
(production), **`STAGING_AR_IMAGE_PREFIX`** (promotion source), `API_SERVICE`,
`API_RUNTIME_SA`, `APP_JWT_ISSUER`, `APP_JWT_AUDIENCE`, `APP_CORS_ORIGINS`,
`APP_API_BASE_URL` (production values, distinct from staging).

**Versioning:** Phase-0 closeout is tagged **`v0.10.1-phase0`** (continues the D9
`vX.Y.Z-phase0` scheme); it is both the milestone marker and the first artifact
promoted through this pipeline. `v1.0.0` remains reserved for the first Phase-1
production release.

---

## 19. Phase 1 — Implemented Domains (1.1–1.6)

Backend domain modules follow **Controller → Service → Repository** with flat files
per `modules/<domain>/` (AD: flat module layout, not the per-type subfolders in
folder-structure.md). All extend `BaseRepository` (AD-6) on `baseSchemaPlugin`.
Public DTOs live in **`@sajawat/types`** (type-only); runtime mappers stay in the API.

| Module | Models | Public/Customer | Admin (RBAC) |
|---|---|---|---|
| **user** (1.1) | `User` (role enum AD-20, `customerType`, soft-delete) + `BaseRepository` | — | (seed-admin) |
| **auth / session** (1.2) | `Session` (refresh store, TTL, rotation+reuse-detection → closes **D15**) | `/auth` register/login/refresh-token/logout/me/google | — |
| **category, collection** (1.3a) | `Category`, `Collection` (slug-unique, soft-delete) | `GET /categories`,`/collections` (+`/:slug`) | CRUD (`category:write`/`collection:write`) |
| **product, inventory** (1.3b) | `Product` (text index, embedded media refs), `Inventory` (1:1, derived `availableQuantity`/status), `InventoryMovement` (audit) | `GET /products` (filter/sort/page), `/search`, `/featured`,`/best-sellers`,`/new-arrivals`, `/:slug` (`inStock` joined) | product CRUD + inventory adjust/history |
| **cart, wishlist** (1.5) | `Cart` (1/user), `Wishlist` (1/user) | `/cart` (add/update/remove, apply/remove coupon — **totals recomputed live**), `/wishlist` | — |
| **promotion** (1.5a) | `Promotion` (automatic/coupon, %/fixed, limits) + **discount calculator** (coupon-wins-else-best-automatic, AD-1.5D) | (applied at cart) | CRUD (`coupon:write`) |
| **order, payment** (1.6) | `Order` (embedded item/address/promotion snapshots), `Payment` | `/checkout/cod`, `/checkout` + `/verify-payment` (online), `/orders` (list/detail/cancel) | `/admin/orders` list/detail/status/payment |

**Key cross-cutting decisions (Phase 1):**
- **AD-1.5D** — single discount per cart: a valid entered coupon wins, else the best active automatic promotion (no stacking). Discounts recomputed server-side every read.
- **Inventory integrity** — atomic conditional `$inc` (no-oversell); **reserve-on-create → commit-on-pay** for online, **commit at placement** for COD, **release/restock** on failure/cancel. No multi-doc transactions (works on Atlas + in-memory test server); every change writes an `InventoryMovement`.
- **Payments (PAYMENT RULES)** — `PaymentProvider` abstraction; `RazorpayProvider` (fetch + `node:crypto`, no SDK) config-gated → **501 until keys**. Idempotency via an atomic `pending→paid` order transition shared by client-verify and the raw-body-HMAC **webhook (source of truth)**. Never paid without a verified signature/webhook.
- **`sanitizeFilter` interaction (AD-9)** — developer operators (`$in`, `$text`, `$gte`) are wrapped in `mongoose.trusted()` at the trusted repository layer.
- **Storefront** — fully **login-gated** (D17, owner decision): client-auth app with silent refresh-on-load; SEO intentionally dropped behind the gate. Design system in `@sajawat/ui`.

**Built since (see §20):** 1.4c storefront shopping UI, 1.7a/b admin console, 1.8a/b B2B + CRM + notifications.

**Still deferred (tracked):** audit-log + account-lockout, reviews/blog/CMS/analytics/email-SMS notifications/2FA/OTP-login (Phase 2+ or future milestones), GCS media upload (1.3-media), web deploy automation, production CD drill (**D16**), live Razorpay (**D18**) + WhatsApp (**D19**) drills, and remaining 1.10 launch readiness (perf/load, observability/alerting, backups). **Closed since:** frontend CSP D12-web/admin (1.9a, §20.4).

---

## 20. Phase 1 — Storefront, Admin Console, B2B, CSP & E2E (1.4c, 1.7, 1.8, 1.9, 1.10a)

The frontends that turn the 1.1–1.6 backend into shippable funnels, plus the B2B
backend. All UI follows the **service-layer rule** (components never call
`apiFetch`; per-module `services/*.ts`), **server-authoritative state** (no
optimistic UI, no client-side totals), and reuses the `@sajawat/ui` design
system. Apps replace the Next starter (closes **D4**).

### 20.1 Storefront shopping UI — 1.4c (`apps/web`, commit `3086904`)
- **`CommerceProvider`** (`features/commerce/commerce-context.tsx`) exposing `useCart`/`useWishlist`; bootstraps on auth, clears on sign-out; every mutation replaces state with the returned DTO. `commerce.ts` service layer.
- Header cart/wishlist count badges; PDP add-to-cart + wishlist; `ProductCard` wishlist overlay.
- Routes (under the gated `(shop)` group): `/cart`, `/wishlist`, `/checkout`, `/account` hub + `/account/orders` + order detail (cancel).
- **Checkout:** COD is the live path; **Razorpay online is wired-but-dormant** — `razorpay.ts` loads the SDK + opens the modal, but the backend 501s without keys, so the UI catches it and falls back to COD.
- Shared `CheckoutRequest`/`VerifyPaymentRequest` DTOs added to `@sajawat/types`. `@/` alias wired into the web vitest config.

### 20.2 Admin operations console — 1.7a/b (`apps/admin`, commits `05cc7db`, `296052a`)
- **Shell + gate:** `(console)` layout, sidebar/topbar, role-aware `AuthProvider` (silent refresh), **staff-role gate** (any role except `customer`; a customer gets a 403 screen), **permission-driven nav** + a `Can`/`useCan` helper off `@sajawat/shared` (`hasPermission`). The API enforces every action; client RBAC is convenience only.
- **1.7a:** Orders (list with status/paymentStatus filters; detail with PATCH status + PATCH payment, surfacing API guard errors), Products (CRUD; **image-URL inputs** since GCS upload is deferred), Inventory (adjust + movement history), Dashboard (permission-scoped count cards).
- **1.7b:** Categories, Collections, Promotions/coupons (list + inline create/edit panel + delete).
- DTOs added to `@sajawat/types`: `AdminProduct`, `AdminInventory`, `AdminInventoryMovement`, `AdminCategory`, `AdminCollection`, `AdminPromotion`. **No DB/API changes** — pure UI over existing `/admin/*` endpoints. (Minor accepted duplication: a couple of these structurally mirror the API module's internal admin types.)
- CSP shipped in **1.9a** (per-app nonce, §20.4) — **D12-admin closed**.

### 20.3 B2B enquiry + CRM + notifications — 1.8a/b (commits `4abc328`, `ead87a7`)
- **Settings module** (`modules/settings`): singleton document (`key:'global'`, upserted on first read), `GET/PATCH /admin/settings` (`SETTINGS_MANAGE`, super-admin only) holding `adminWhatsappNumber` + business name/support email.
- **NotificationProvider abstraction** (`notifications/`): `NotificationProvider` interface + `WhatsAppProvider` (Meta Cloud API via `fetch`, no SDK), **config-gated/dormant** — `isConfigured()` false without keys → `sendText` returns a *skipped* result, never throws. `notification.service.ts` resolves the recipient from settings and is **best-effort** (awaited but swallow-on-error → cannot roll back a saved lead). Mirrors the `PaymentProvider` pattern. (D19: live send untested; only the dormant-skip branch is covered.)
- **CRM module** (`modules/crm`): `CrmLead` (embedded staff notes, `assignedTo`/`submittedBy`, soft-delete). **Gated, rate-limited `POST /enquiries`** (auth-required per D17) → persist + fire the WhatsApp alert. Admin `GET/PATCH /admin/crm/leads` (`CRM_READ`/`CRM_WRITE`; PATCH does stage / assignment / append-note). DTOs (`AdminLead`, `EnquiryRequest`, `EnquiryAck`, `LeadNote`, `LeadStage`) in `@sajawat/types`.
- **Frontend (1.8b):** gated `/wholesale` enquiry form (`apps/web`); admin **CRM pipeline board** (kanban grouped by stage) + lead detail (stage/assign/notes) + **Settings** page.
- **AD-1.8A — CRM stage set reconciled to the spec's 7 stages.** Implemented stages: `new → contacted → follow_up → quotation_sent → negotiation → won/lost`, matching the PRD / database-design / admin-spec / crm-spec pipeline (`quotation_sent` added post-1.8b across the API model + validation, the shared `LeadStage` type, and the admin board/labels/badge; no data migration — existing leads keep their stage). **Still deferred (broader CRM, future milestone):** a separate `crm_activities`/timeline collection, follow-ups + reminders, full quotation management (quote numbers/PDFs), B2C contact-form leads, customer timeline, dashboard widgets, and reports. 1.8 ships the minimal lead + notes + stage + assignment model; "Quotation Sent" is a pipeline stage only (no quote object behind it yet).

### 20.4 Frontend CSP + security hardening — 1.9a/b (commits `acfa416`, `bb0aa87`)
- **1.9a — strict nonce-based CSP (web + admin).** Each app's `proxy.ts` (Next middleware) generates a per-request nonce and injects a strict `Content-Security-Policy` plus the standard security headers; the root layouts are per-request (async) and thread the nonce onto inline scripts. Closes **D12-web** and **D12-admin** — no `unsafe-inline` for scripts. Files: `apps/web/src/proxy.ts` + `apps/web/src/app/layout.tsx`, `apps/admin/src/proxy.ts` + `apps/admin/src/app/layout.tsx`.
- **1.9b — supply-chain scanning + dependency remediation.** `ci.yml` gains dependency + secret scanning; `package.json`/lockfile remediated to clear flagged advisories; open-debt updated. No app-code or schema changes.

### 20.5 Launch-readiness E2E — 1.10a (commits `82cf8b5`, `ff14bf5`)
- **Live-stack business journeys** (`tests/e2e/customer-journey.spec.ts`): three serial tests on one authenticated page tell one story — **register → browse → add to cart → COD checkout → order confirmed → B2B wholesale enquiry** — driving the real web + API + Mongo stack. Replaces the 0.9 web-only smoke scaffold for the revenue paths (smoke stays for CI).
- **Gating:** the whole group `test.skip`s unless `E2E_FULL_STACK=1`; run via `pnpm test:e2e:full` (sets the flag + `PLAYWRIGHT_BASE_URL`). CI keeps the web-only `smoke.spec.ts` (no Mongo/API needed). Verified green end-to-end against a local stack.
- **Deterministic seed** (`tests/e2e/global-setup.ts`): idempotent admin-API seed of an in-stock product (create-or-top-up), no-op unless the flag is set, **fail-fast** on any seed write so failures surface at the API seam, not deep in a test. Requires a seeded super-admin.
- **Defects fixed by the journey:** API CORS `allowedHeaders` now includes `x-csrf-token` (`CSRF_HEADER_NAME`) — returning users attach the double-submit token on every authenticated request, and omitting it failed the cross-origin preflight (`services/api/src/middleware/security.ts`); checkout `Field` now emits `htmlFor`/`id` pairs (a11y + `getByLabel`).
