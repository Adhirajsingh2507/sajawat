# SAJAWAT — PROJECT STATE & HANDOFF

> Authoritative state snapshot for resuming work. Read this first, then
> `sajawat-current-architecture.md` and `sajawat-open-debt.md`.

---

## 1. Project State

- **Project:** Sajawat Jewellery — luxury jewelry e-commerce (B2C + B2B leads + CRM + admin).
- **Current status:** Phase 0 (Foundation) in progress — infrastructure only, **no business features**.
- **Current milestone:** **0.8 complete** (Docker & local orchestration). Next up: **0.9 (testing foundation: Vitest, Supertest, Playwright)** — not yet planned.
- **As of:** Milestone 0.8 commit on branch `main` (Phase 0 ~80% — 0.1–0.8 done; **0.9–0.10 remain**).
- **Phase 0 status:** foundation in place — monorepo, TS, ESLint/Prettier, Express 5 API, security middleware, MongoDB Atlas, env strategy, auth primitives, **containerization (Docker + compose)**. Remaining: **0.9** testing · **0.10** CI/CD. Mongoose 9 is the **approved baseline**. (Auth endpoints/session store + domain models are Phase 1.)

### Milestone commit hashes
| Milestone | Commit |
|-----------|--------|
| 0.4 | `388044f` |
| 0.4.1 | `7c0c748` |
| 0.5 | `a498ca3` |
| 0.6 | `c05d2af` |
| 0.7 | `805798e` |
| 0.8 | (this commit — see `git log`) |

### Completed milestones
- ✅ **0.1** — Monorepo skeleton
- ✅ **0.2** — TypeScript foundation, project references, commit hygiene
- ✅ **0.3** — ESLint flat config, zero-warning policy, workspace-wide lint
- ✅ **0.4** — API foundation (Express 5 app factory, pino + request IDs, `/health` + `/api/v1/health`, error hierarchy + global handler, response envelope, Zod request/env validation, type-aware ESLint layer)
- ✅ **0.4.1** — Security hardening (helmet, env-driven CORS w/ credentials, global per-IP rate limiter + factory)
- ✅ **0.5** — MongoDB Atlas connection (Mongoose 9, retry/backoff), readiness DB check (503 when down), graceful disconnect, Mongoose error normalization, schema conventions
- ✅ **0.6** — Per-environment configuration strategy (Node-native layered `--env-file`, per-env + per-app templates, AD-14 production guards, pre-commit secret guard, Environment Guide). **Scoped to env only — domain/repository deferred to Phase 1 per AD-6.**
- ✅ **0.7** — Auth foundation (jose JWT utils, `@node-rs/argon2` Argon2id, centralized RBAC in `@sajawat/shared`, `requireAuth`/`requireRole`/`requirePermission`, double-submit CSRF, auth rate limiter). **Stateless primitives + middleware only — endpoints/session store + User/Role models are Phase 1.**
- ✅ **0.8** — Docker & local orchestration (multi-stage `node:22-bookworm-slim` images for api/web/admin via `turbo prune` + `pnpm deploy` / Next `standalone`; `docker-compose.yml` with `mongo:7`; `$PORT` Cloud Run support; non-root; health checks). Verified: full stack healthy, Web→API / Admin→API / API→Mongo, graceful shutdown.

### Pending milestones
- ⏳ **0.9** — Testing foundation (Vitest, Playwright, Supertest)
- ⏳ **0.10** — CI/CD (GitHub Actions: Node 22 + Corepack, lint/typecheck/test/build, deploy)

### Repository structure (top level)
```
apps/{web,admin}   services/api   packages/{ui,types,shared,config}
docs/   scripts/   tests/{e2e,integration,performance}
infrastructure/{docker,deployment,monitoring,backups,scripts}
.husky/   .github/(pending 0.10)
```

### Installed technologies
Turborepo · pnpm · TypeScript · ESLint (flat + type-aware layer) · Prettier · Husky · commitlint · lint-staged · Next.js 16 · React 19 · Tailwind CSS v4 · **Express 5 · pino + pino-http · Zod · tsx (API foundation)** · **helmet · cors · express-rate-limit (0.4.1 security)** · **Mongoose 9 (0.5 MongoDB Atlas)**. (0.6 added **no** runtime deps — Node-native `--env-file`.) · **jose · @node-rs/argon2 · cookie-parser (0.7 auth)**. (0.8 added **no** runtime deps — Docker multi-stage on `node:22-bookworm-slim`, `turbo prune` + `pnpm deploy` / Next `standalone`, `docker-compose` with `mongo:7`.)

### Architecture decisions
See `sajawat-current-architecture.md` §1–2 for the authoritative list (Turborepo, Node 22, pnpm, TS strict, ESM+NodeNext, Express 5, pino, Next/React/Tailwind, AD-1 role-based packages, project references, `workspace:*`, root ESLint, Conventional Commits, Zod validation).

### Approved deviations from original plan
1. **pnpm via npm user-prefix locally** (Corepack broken on Node 25) — contract remains Corepack/Node 22 in CI/Docker.
2. **`engine-strict=false`** (was planned `true`) so installs run on Node 25.
3. **pino instead of Winston** (0.1 summary mentioned Winston) — performance + JSON + redaction.
4. **Express 5 instead of 4** — native async error propagation.
5. **Env config foundation folded into 0.4** (Zod-validated, Node `--env-file`); the **full per-environment strategy completed in 0.6** (layering, per-app templates, prod guards, secret guard, Environment Guide).
6. **Single root ESLint config** (not per-package) — required for lint-staged/turbo parity under ESLint v9 flat-config resolution.
7. **Mongoose 9 is the approved baseline** (the 0.5 plan anticipated `^8`; an unpinned install pulled `^9.6.3`). Reviewed and **approved** for a greenfield project with no models/repository yet: gates green, live smoke passed, Atlas + Node 22 compatibility acceptable. No downgrade.
8. **0.6 scoped to environment strategy only** — the "first domain module" once associated with 0.6 is **deferred to Phase 1**; `BaseRepository` (AD-6) is built against the first real model then, avoiding a speculative abstraction.

### Important implementation notes
- `verbatimModuleSyntax` ⇒ always use `import type` for type-only imports.
- CJS deps (Express/Mongoose) ⇒ **default import + destructure** (lint-enforced; named imports blocked).
- Express 5: `req.query`/`req.params` are **read-only** — validated data goes to `req.validatedData`.
- `@sajawat/shared` is compiled to `dist`; consumers read built output (build runs before typecheck via Turbo `^build`).
- Cross-package resolution = package name + `exports` (no tsconfig `paths`); only `@/*` internal alias in apps.
- ESLint is a single root config; `turbo run lint` and `lint-staged` both resolve it.

### Known limitations
- `services/api` runs as a real Express 5 server, connects to MongoDB Atlas (0.5), ships **auth primitives + middleware** (0.7), and is **containerized** (0.8); still no auth *endpoints*, business modules, automated tests, or CI.
- Auth is stateless — **no session/refresh store yet** (D15): no server-side revocation/rotation until Phase 1.
- No business collections/models yet (first `User`/`Role` model lands in Phase 1).
- Apps contain default Next.js starter content.
- Local (non-Docker) toolchain runs on Node 25; the **Docker images use the contracted Node 22** (Corepack pnpm).

### Next recommended action
Plan and implement **Milestone 0.9** (testing foundation): Vitest (unit/integration) with `@sajawat/*`→`src` aliases and NodeNext `.js`-resolution smoke; Supertest against the `createApp()` factory; `mongodb-memory-server` + test JWT secrets (addresses D13); Playwright e2e scaffold. Convert the throwaway 0.7 auth smoke + 0.5/0.8 manual checks into real test suites and replace the placeholder `test` scripts (D8).

---

## 2. Milestone Tracking

### Completed

#### Milestone 0.1 — Monorepo skeleton
- **Goal:** Buildable Turborepo + pnpm workspace skeleton; no features.
- **Implemented:** Root `package.json`/`pnpm-workspace.yaml`/`turbo.json`/`.npmrc`/`.nvmrc`/`.gitignore`/`.env.example`; 7 workspace skeletons (`@sajawat/*`); Next.js 16 + Tailwind v4 apps (web :3000, admin :3001); shared Prettier config; root CLAUDE.md foundation section; doc updates (carts collection, users.address, Redis Phase 2, Express route-ordering rule); moved `sajawat-claude.md → .claude/`.
- **Key decisions:** Turborepo (`tasks` key), pnpm 9.15.0 pinned, Node 22 contract, `@sajawat/*` namespace, manual setup (no `create-turbo`).
- **Risks discovered:** Node 25 vs 22 contract; Corepack broken on Node 25.
- **Resolution:** pnpm installed via npm prefix; `.nvmrc`/engines pin 22; Corepack used in CI/Docker.

#### Milestone 0.2 — TypeScript foundation, project references, commit hygiene
- **Goal:** Real strict TS across the repo; solve cross-package consumption (R1); add commit gates; README.
- **Implemented:** Shared TS bases in `@sajawat/config/typescript/*`; per-package tsconfigs; `@sajawat/shared` composite → `dist` (ESM); project references (`api → shared`) + root solution tsconfig; **AD-1** role-based consumption (`transpilePackages: ['@sajawat/ui']`); `workspace:*` deps; Husky `pre-commit`+`commit-msg`; commitlint; lint-staged; root README; created `scripts/`, `tests/`, `infrastructure/`.
- **Key decisions:** AD-1 (compile only packages with a non-bundler consumer); `exports` over tsconfig `paths`; ESM+NodeNext; strict flag set incl. `verbatimModuleSyntax`.
- **Risks discovered:** R1 cross-package; lint-staged ESLint couldn't resolve a root eslint (K4); composite/noEmit nuances.
- **Resolution:** Compiled-`shared` strategy verified (dist emitted); lint-staged ESLint deferred to 0.3 (Prettier-only interim).

#### Milestone 0.3 — ESLint flat config, zero-warning, workspace-wide lint
- **Goal:** Strict flat-config linting everywhere, zero warnings, re-enable ESLint in lint-staged.
- **Implemented:** Single root `eslint.config.mjs`; shared `@sajawat/config/eslint/{base,react}`; rules: `consistent-type-imports`, CJS-interop ban (express/mongoose), `typescript-eslint:recommended` (no-explicit-any), React hooks as errors; `--max-warnings 0` across 8 workspaces; ESLint re-enabled in lint-staged (`--no-warn-ignored`); removed per-app configs.
- **Key decisions:** One root config (ESLint v9 ascends from cwd → turbo/lint-staged parity); apps ascend to root; Next 16 dropped build-time lint.
- **Risks discovered:** Next 16 removed the `eslint` NextConfig key (typecheck failure); flat-config "File ignored" warning broke `--max-warnings 0` in lint-staged.
- **Resolution:** Removed invalid `ignoreDuringBuilds`; added `--no-warn-ignored`. All gates green; rules proven via throwaway probe.

#### Milestone 0.4 — API foundation
- **Goal:** Turn the `services/api` skeleton into a running, observable, type-safe Express 5 server with the cross-cutting primitives every future module depends on. No business features.
- **Implemented:** deps (express 5.2.1, pino 9.14, pino-http 10.5, zod 3.25; dev: @types/express 5, pino-pretty 13, tsx 4.22); `config/env.ts` (Zod, fail-fast, frozen) + `config/logger.ts` (pino, dev-pretty, redaction); `errors/app-error.ts` (AppError hierarchy + `clientErrorCode`); `http/respond.ts` (success/error envelopes w/ requestId); middleware: `request-logger` (pino-http + `x-request-id`), `validate` (Zod → `req.validatedData`), `not-found`, `error-handler` (AppError/ZodError/http-errors 4xx mapping, prod masking); `routes/health.routes.ts`; `app.ts` factory + `index.ts` (listen, graceful shutdown, process error traps); `types/express.d.ts`; scripts (`dev` tsx watch, `start`, `build`). **Type-aware ESLint:** new `@sajawat/config/eslint/type-checked` scoped to `services/api` via `projectService`; CJS-interop selector refined to allow type-only express/mongoose imports.
- **Key decisions:** app factory (Supertest-ready); liveness `/health` (minimal, unversioned) vs enveloped readiness `/api/v1/health`; validated input to `req.validatedData` (Express 5 read-only query/params); fail-fast env; pino-http named import (NodeNext); explicit `Router` annotation (TS2742).
- **Risks discovered / resolved:** pino-http default not callable under NodeNext → named import; `Router` type not portable → explicit annotation; body-parser 4xx initially masked as 500 → exposed-`http-errors` mapping.
- **Verification:** typecheck + lint (zero-warning, type-aware) + build + format all green (8/8 workspaces); live smoke: `/health` 200, `/api/v1/health` enveloped 200, inbound `x-request-id` honored, 404 envelope, malformed JSON → 400, oversized body → 413, SIGTERM graceful shutdown, dev pino-pretty output. Resolves debt **D6**; reduces **D8** (api `dev` now real).

#### Milestone 0.4.1 — Security hardening
- **Goal:** Add the baseline HTTP security middleware that should exist before any route serves traffic (gap surfaced after 0.4). No business features.
- **Implemented:** deps (helmet 8.2.0, cors 2.8.6, express-rate-limit 8.5.2; dev @types/cors 2.8.19); `middleware/security.ts` (helmet w/ CSP off + CORP cross-origin; env-driven CORS allow-list, credentials, silent deny of unknown origins); `middleware/rate-limit.ts` (`createRateLimiter` factory + `globalRateLimiter` skipping health, 429→`TooManyRequestsError`); env additions `CORS_ORIGINS` (parsed→deduped array), `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`; wired into `app.ts` (logger → helmet → cors → limiter → parsers → routes); `.env.example` updated.
- **Key decisions:** CSP disabled (JSON API; CSP belongs to Next apps); cors before limiter (preflight short-circuits, uncounted); limiter before body parsing; health endpoints exempt from limiting; factory pattern so 0.7 auth limits reuse defaults.
- **Verification:** typecheck + lint + build + format green; live smoke confirmed helmet headers (HSTS, X-Content-Type-Options, X-Frame-Options, CORP; `x-powered-by` absent), CORS allow (localhost:3000/3001 + credentials) / silent deny (evil.com) / preflight 204, rate-limit draft-7 headers + `429 TOO_MANY_REQUESTS` envelope after limit, `/health` + `/api/v1/health` skipped.
- **Still deferred (tracked):** CSP (frontend), CSRF (D11), auth/OTP strict limiters (0.7).

#### Milestone 0.5 — MongoDB Atlas connection + DB health
- **Goal:** Wire MongoDB Atlas (Mongoose) into the API with a resilient connection lifecycle and DB-aware readiness — connection foundation + conventions only; no business collections.
- **Implemented:** dep `mongoose ^9.6.3`; `src/db/{connection,health,base-plugin,index}.ts`. `connectToDatabase()` (bounded exponential backoff + jitter on initial connect, throws on exhaustion), `disconnectFromDatabase()`, connection-event logging, globals `strictQuery`/`sanitizeFilter`/`autoIndex=!prod`, **credential-stripped URI logging**. `checkDatabaseHealth()` (readyState gate + bounded `admin().ping()`). `baseSchemaPlugin` (timestamps + `_id`→`id`/strip `__v` transform; soft-delete convention). **Env:** `MONGODB_URI` now **required** (scheme-validated) + tunables (`MONGODB_DB_NAME`, pool min/max, server-selection/socket timeouts, retry attempts/base). **Errors:** new `ServiceUnavailableError` (503/`SERVICE_UNAVAILABLE`); global handler now normalizes Mongoose `ValidationError`/`CastError`/`DocumentNotFoundError` + dup-key `E11000`. **Routes:** `/api/v1/health` extended with `db` sub-status, returns **503** when not ready. **Lifecycle:** `index.ts` connect-before-listen; re-entrancy-guarded async shutdown closes Mongoose.
- **Key decisions:** AD-2 single default connection; AD-3 connect-before-listen + retry, exit on exhaustion, auto-reconnect after; AD-4 liveness DB-independent vs readiness 503; AD-5 domain-colocated schemas + shared plugin; AD-6 repository contract locked, `BaseRepository` deferred to 0.6; AD-7 `autoIndex` off in prod; AD-8 centralized Mongoose error mapping; AD-9 `strictQuery`+`sanitizeFilter`+no-URI-logging; AD-10 required `MONGODB_URI` + tunables.
- **Risks discovered / resolved:** mongoose resolved to `^9` (not planned `^8`) — compatible; mongoose 9 `readyState` enum tripped `no-unsafe-enum-comparison` on a literal compare → fixed via `mongoose.ConnectionStates.disconnected`.
- **Verification:** typecheck + lint (zero-warning, type-aware) + build + format all green (8/8 workspaces). Live smoke (Dockerized `mongo:7`): connect attempt 1/5 → connected (host only, no creds); `/health` 200; readiness 200 `healthy`; Mongo stopped → `/health` stays 200, readiness **503 `degraded`** (no crash, reconnect warning logged); SIGTERM → graceful "Drained HTTP + database; exiting"; fail-fast on missing/malformed `MONGODB_URI` (exit 1). New debt **D13** (`MONGODB_URI` required → tests/CI must provide), **D14** (readiness-503 logs at error level under sustained outage).

#### Milestone 0.6 — Per-environment configuration strategy
- **Goal:** Complete the per-environment config strategy (phase-0 "Environment Variables: Dev/Staging/Prod, Separate Files" + "Environment Guide"). **Scope locked to env only** — no domain models, no `BaseRepository` (deferred to Phase 1 per AD-6). Zero business features.
- **Implemented:** **No new deps** (Node-native `--env-file`, AD-11). Layered loading (AD-12): API scripts load `.env.<NODE_ENV>` then `.env` (optional local override wins), platform `process.env` beats both; `--env-file-if-exists` so cloud (no files) is a no-op. `config/env.ts` **AD-14 production guards** (fail-fast if `API_BASE_URL`/`CORS_ORIGINS` are localhost in prod). Annotated root `.env.example` (loading model + `[secret]` tags; frontend vars relocated to per-app templates). New per-app templates `apps/web/.env.example` + `apps/admin/.env.example` (AD-15, `NEXT_PUBLIC_*` only). **R-2 pre-commit secret guard** `scripts/check-staged-secrets.sh` (blocks staged real `.env*`, allows `*.example`), wired into `.husky/pre-commit`. `.gitignore` (root + per-app) negates `!.env.example`, adds `.env.test`. New doc `docs/sajawat-environment-guide.md`.
- **Key decisions:** AD-11 Node-native, no dotenv; AD-12 base→per-env→`.env`→process.env precedence (empirically verified); AD-13 cloud uses Secret Manager, no container `.env`; AD-14 prod localhost guards; AD-15 Next-native loading + per-app templates. Naming standardized on `.env.<NODE_ENV>` with `.env` as optional local override.
- **Verification:** typecheck + lint + build + format green (8/8). Live smoke: AD-14 prod+localhost → fail-fast (both violations, exit 1); AD-12 `.env` overrides `.env.development`, `process.env` beats both; secret guard blocks a staged `.env.development` but allows `.env.example`; `git add --dry-run` confirms per-app `.env.example` trackable while `.env.local` stays ignored.

#### Milestone 0.7 — Auth foundation
- **Goal:** Ship the stateless auth primitives + middleware (phase-0 "JWT/Password/Role utilities, no UI"). **No** auth endpoints, `User`/`Role`/session models, or OAuth/OTP/2FA (Phase 1).
- **Implemented:** deps `jose ^6`, `@node-rs/argon2 ^2`, `cookie-parser ^1.4` (+ `@types`). **`@sajawat/shared/auth`:** RBAC catalog (`ROLES`, `PERMISSIONS`, `ROLE_PERMISSIONS`, `hasPermission`, `isRole`) + `passwordSchema` (added `zod` dep). **`services/api/auth`:** `jwt.ts` (sign/verify access+refresh, distinct secrets, `type` claim, iss/aud bound, refresh `jti`/`family`), `password.ts` (Argon2id), `cookies.ts` (refresh cookie httpOnly/Secure/SameSite=Strict), `rbac.ts` (bridge). **Middleware:** `auth.ts` (`requireAuth`/`requireRole`/`requirePermission`), `csrf.ts` (double-submit + constant-time compare), `rate-limit.ts` `authRateLimiter`. **Wiring:** `cookie-parser` in `app.ts`; `req.user` in `types/express.d.ts`; `*.otp` redaction. **Env:** `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` (required ≥32, distinct via superRefine), `JWT_ISSUER`/`JWT_AUDIENCE` (required), `JWT_*_EXPIRES_IN` defaults, `AUTH_RATE_LIMIT_*`.
- **Key decisions:** AD-16 stateless only; AD-17 hybrid transport (Bearer access + httpOnly refresh cookie); AD-18 jose; AD-19 @node-rs/argon2; AD-20 centralized RBAC in shared, token carries role only; AD-21 distinct secrets + type claim + rotation-ready claims; AD-22 double-submit CSRF for cookie endpoints.
- **Risks discovered / resolved:** `@node-rs/argon2` `Algorithm` is an ambient const enum (forbidden under `verbatimModuleSyntax`) → dropped explicit `algorithm`, rely on argon2id default with explicit cost params.
- **Verification:** typecheck + lint (type-aware) + build + format green (8/8). Live smoke (9 checks): Argon2id hash/verify; access+refresh round-trips (jti/family preserved); type-confusion rejected both ways; tampered token rejected; RBAC matrix; env fail-fast on missing/short/identical secrets + missing iss/aud. **Resolves D11**; adds **D15** (stateless refresh — no revocation until Phase-1 store).

#### Milestone 0.8 — Docker & local orchestration
- **Goal:** Containerize all three deployables with Cloud-Run-ready, hardened multi-stage images + a local integrated stack. No business features.
- **Implemented:** **No runtime deps.** 3 Dockerfiles in `infrastructure/docker/` (api/web/admin) on `node:22-bookworm-slim` (AD-23, glibc for argon2 prebuilts), Corepack pnpm. Build backbone: `turbo prune --docker` → manifest-first `pnpm install` (BuildKit store cache) → build. **API**: `pnpm deploy --prod` bundle, `node dist/index.js`. **Web/Admin**: Next `output: 'standalone'` (+`outputFileTracingRoot`), copy `standalone`+`static`+`public`. `$PORT` support (AD-27: `env.PORT ?? API_PORT`; Next `HOSTNAME=0.0.0.0`). Minimal `/health` routes in both apps. `.dockerignore`; root `docker-compose.yml` (api+web+admin+`mongo:7`, healthchecks, `init:true`, depends_on healthy). Non-root `USER node`, exec-form CMD, `HEALTHCHECK` via Node `fetch`, `HUSKY=0` in build.
- **Key decisions:** AD-23 slim/glibc; AD-24 Next standalone; AD-25 pnpm deploy; AD-26 turbo prune + cache mounts; AD-27 `$PORT`; AD-28 `NEXT_PUBLIC_*` build-args (env-specific images); AD-29 compose local-only with `mongo:7`; AD-30 hardening. Compose API runs `NODE_ENV=staging` (avoids the AD-14 localhost guard *and* the dev-only pino-pretty devDep absent from the prod image).
- **Verification:** repo gates green (8/8). Built all three (api 360MB, web/admin 401MB). `docker compose up`: all healthy; `/health` 200 on api(4000)/web(3000)/admin(3001); readiness `healthy` db=connected (**API→Mongo**); **Web→API** + **Admin→API** over the compose network 200/healthy; non-root (uid 1000) in all; argon2id loads in-container; SIGTERM → graceful "Drained HTTP + database; exiting".

### Planned

| Milestone | Goal (summary) |
|-----------|----------------|
| 0.9 | Vitest (unit/integration), Supertest, Playwright e2e; Vitest `@sajawat/*`→`src` aliases; smoke-test NodeNext `.js` resolution. |
| 0.10 | GitHub Actions: Node 22 + Corepack, install → lint → typecheck → test → build; staging auto / prod manual; enforce Node 22 (addresses D1). |

---

## 3. Architecture Snapshot

Full detail in `sajawat-current-architecture.md`. Quick index of approved decisions:

Turborepo 2.x · Node 22 LTS (contract) · pnpm 9.15.0 · TypeScript strict (+extra flags) · ESM + NodeNext · Express 5 (0.4) · pino (0.4) · Next.js 16 · React 19 · Tailwind v4 · AD-1 role-based packages · TS project references · `workspace:*` + `exports` · single root ESLint flat config (zero-warning) · Conventional Commits (commitlint + Husky) · pino logging w/ redaction (0.4) · Zod validation (0.4).

---

## 4. Technical Debt Register

Authoritative copy in `sajawat-open-debt.md`. Open items:

| ID | Severity | Description | Planned Resolution | Milestone |
|----|----------|-------------|--------------------|-----------|
| D1 | Medium | `engine-strict=false`; Node 22 advisory locally. | Enforce in CI/Docker. | 0.10 |
| D3 | Low | Local pnpm via npm prefix (Corepack broken on Node 25). | Documented; CI uses Corepack. | — |
| D4 | Low | Next.js starter boilerplate in apps. | Replace at Phase 1 UI. | Phase 1 |
| D5 | Low | `.prettierignore` excludes all Markdown. | Optionally narrow scope. | optional |
| D7 | Low | `@sajawat/config` lint-exempt. | Accepted. | — |
| D8 | Low | Residual placeholder scripts (api/web/admin `test`, config lint/typecheck). | Replace as capabilities land. | 0.9 |
| D9 | Low | No git tags / release versioning. | Adopt tagging (see §6). | 0.10 |
| D10 | Low | `services/api` `dist/` git-ignored; API not consumed by another workspace. | Accepted; revisit if imported elsewhere. | — |
| D13 | Low | Required env now includes `MONGODB_URI` (0.5) + `JWT_*` secrets (0.7) — tests/CI must each provide them. | test secrets + `mongodb-memory-server` (0.9); inject in CI (0.10). | 0.9 / 0.10 |
| D14 | Low | Readiness 503 logs at error level (pino-http 5xx→error) — noisy under sustained DB outage. | Optionally downgrade/skip readiness-probe logging. | optional |
| D15 | Medium | Stateless refresh tokens (0.7) — no server-side revocation/rotation until a Phase-1 session store; leaked refresh valid until expiry. Accepted. | Phase-1 session/refresh store (rotation + reuse-detection); claims already carry `jti`/`family`. | Phase 1 |

(D6 — non-type-aware ESLint — **resolved in 0.4**. helmet/cors/rate-limit gap **resolved in 0.4.1**. **D11 (CSRF) resolved in 0.7** via hybrid Bearer transport + double-submit guard. CSP remains a frontend concern (D12).)

---

## 5. Repository Inventory

### apps/
- `web/` — `@sajawat/web` (Next 16, :3000): `next.config.ts` (transpilePackages + **`output:'standalone'`**, 0.8), `tsconfig.json`, `src/app/{layout,page}.tsx` + `src/app/health/route.ts` (0.8), `postcss.config.mjs`, `.env.example` (0.6, `NEXT_PUBLIC_*`), `.gitignore` (`!.env.example`), `package.json`.
- `admin/` — `@sajawat/admin` (Next 16, :3001): same layout (+ `.env.example`, `health/route.ts`, standalone).

### services/
- `api/` — `@sajawat/api` (Express 5, ESM/NodeNext): `src/{index,app}.ts`, `config/{env,logger}.ts`, `db/{connection,health,base-plugin,index}.ts`, `auth/{jwt,password,cookies,rbac}.ts` (0.7), `errors/app-error.ts`, `http/respond.ts`, `middleware/{request-logger,security,rate-limit,validate,auth,csrf,not-found,error-handler}.ts`, `routes/health.routes.ts`, `types/express.d.ts`; `tsconfig.json` (node base, references shared, emits `dist`); `package.json`. Runs `/health` + `/api/v1/health` behind helmet + CORS + rate limiting + cookie-parser; connects to MongoDB Atlas (Mongoose 9). Auth utilities + middleware present; **endpoints Phase 1**.

### packages/
- `ui/` — `@sajawat/ui` (source TSX): `src/index.ts`, `tsconfig.json` (react-library).
- `types/` — `@sajawat/types` (type-only): `src/index.ts`, `tsconfig.json` (noEmit).
- `shared/` — `@sajawat/shared` (compiled): `src/index.ts`, `src/auth/{roles,password-policy,index}.ts` (0.7 RBAC catalog + password policy; `zod` dep), `tsconfig.json` (composite), emits `dist/`.
- `config/` — `@sajawat/config` (tooling): `prettier/index.js`, `eslint/{base,react}.mjs`, `typescript/{base,node,library,react-library,nextjs}.json`, `package.json` (exports map).

### docs/
Specs (source of truth): `sajawat-prd.md`, `-system-architecture.md`, `-database-design.md`, `-api-design.md`, `-security-design.md`, `-phase-0-foundation.md`, `-folder-structure.md`, `-coding-standards.md`, `-testing-strategy.md`, `-deployment-plan.md`, `-roadmap.md`, `-environment-guide.md` (0.6), plus brand/business/admin/crm/ui-ux specs. **Handoff docs:** `sajawat-project-state.md` (this), `sajawat-current-architecture.md`, `sajawat-open-debt.md`.

### scripts/
- `check-staged-secrets.sh` (0.6 — pre-commit guard blocking staged real `.env*`). `.gitkeep` (dev/seed scripts — to be populated).

### tests/
- `e2e/`, `integration/`, `performance/` (`.gitkeep`; Playwright/Vitest/Supertest in 0.9).

### infrastructure/
- `docker/` — **`api.Dockerfile`, `web.Dockerfile`, `admin.Dockerfile`** (0.8, multi-stage `node:22-bookworm-slim`). `deployment/`, `monitoring/`, `backups/`, `scripts/` (`.gitkeep`; CI deploy in 0.10).

### Root
`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.json` (solution), `eslint.config.mjs`, `prettier.config.js`, `commitlint.config.cjs`, `.lintstagedrc.json`, `.npmrc`, `.nvmrc`, `.gitignore`, `.prettierignore`, `.dockerignore` (0.8), `.env.example`, `docker-compose.yml` (0.8), `README.md`, `CLAUDE.md`, `.husky/{pre-commit,commit-msg}`. `scripts/check-staged-secrets.sh`.

---

## 6. Git Snapshot

- **Current branch:** `main`
- **Tags:** none
- **Working tree (before this handoff commit):** clean; the only changes are these three handoff docs.
- **Latest commits (3 exist):**
  ```
  6df12ff feat(config): milestone 0.3 eslint flat config, zero-warning, workspace-wide lint
  c301edc feat(repo): milestone 0.2 typescript foundation, project refs, commit hygiene
  2e3fe4d chore(phase-0): milestone 0.1 monorepo skeleton
  ```
- **Uncommitted / modified / staged:** only `docs/sajawat-project-state.md`, `docs/sajawat-current-architecture.md`, `docs/sajawat-open-debt.md` (this handoff).
- **`develop` branch:** created in 0.1; `main` is currently ahead (milestone commits landed on `main`). Recommend reconciling before team workflow (see below).

### Recommended tagging strategy (D9)
- **Scheme:** SemVer-ish phase tags during Phase 0: `v0.1.0-phase0`, `v0.2.0-phase0`, `v0.3.0-phase0`, … one annotated tag per completed milestone. First production release at end of Phase 1 → `v1.0.0`.
- **Action now:** tag the three completed milestones retroactively:
  - `git tag -a v0.1.0-phase0 2e3fe4d -m "Milestone 0.1"`
  - `git tag -a v0.2.0-phase0 c301edc -m "Milestone 0.2"`
  - `git tag -a v0.3.0-phase0 6df12ff -m "Milestone 0.3"`
- **Branching going forward:** land milestone work on `feature/*` → PR into `develop` → release into `main` (per deployment-plan). Reconcile the current `main`-ahead state by fast-forwarding `develop` to `main` once.

---

## 7. Version Snapshot

| Tool / Dependency | Version | Notes |
|-------------------|---------|-------|
| Node (local) | v25.8.2 | **Contract: 22 LTS** (`.nvmrc`); local divergence accepted (D3) |
| pnpm | 9.15.0 | pinned via `packageManager` |
| Turbo | 2.9.16 | |
| TypeScript | 5.9.3 | |
| Next.js | 16.2.6 | both apps |
| React / react-dom | 19.2.4 | |
| Tailwind CSS | v4 (`^4`) | via `@tailwindcss/postcss` |
| ESLint | ^9.18.0 (resolved 9.39.4) | flat config |
| typescript-eslint | ^8.20.0 | recommended (non-type-checked) |
| eslint-config-next | 16.2.6 | apps |
| Prettier | ^3.4.2 (resolved 3.8.3) | |
| Husky | 9.1.7 | |
| commitlint (cli/config) | 19.8.1 | |
| lint-staged | 15.5.2 | |
| Express | 5.2.1 | app factory (0.4) |
| pino / pino-http | 9.14.0 / 10.5.0 | structured logging + request IDs (0.4) |
| Zod | 3.25.76 | request + env validation (0.4) |
| tsx | 4.22.3 | dev runtime / watch (0.4) |
| pino-pretty | 13.1.3 | dev log formatting (0.4) |
| @types/express | 5.0.6 | (0.4) |
| helmet | 8.2.0 | secure headers (0.4.1) |
| cors | 2.8.6 | CORS allow-list (0.4.1) |
| express-rate-limit | 8.5.2 | per-IP rate limiting (0.4.1) |
| @types/cors | 2.8.19 | (0.4.1) |
| Mongoose | ^9.6.3 | MongoDB Atlas connection (0.5; bundles own TS types) |
| jose | ^6.2.3 | JWT sign/verify (0.7; ESM-native) |
| @node-rs/argon2 | ^2.0.2 | Argon2id password hashing (0.7; prebuilt) |
| cookie-parser | ^1.4.7 | refresh/CSRF cookie parsing (0.7) |
| @types/cookie-parser | ^1.4.10 | (0.7) |
| zod (shared) | ^3 | RBAC password policy in `@sajawat/shared` (0.7) |

---

## CONTINUATION PROMPT

> Paste the block below into a fresh Claude Code session to resume Sajawat safely.

```
You are resuming work on the SAJAWAT JEWELLERY platform (Turborepo monorepo).
Operate as a senior architect/engineer. Do NOT write code until a plan is approved.

STEP 1 — Read documentation (docs/ is the source of truth):
  - docs/sajawat-project-state.md          (START HERE — current state & handoff)
  - docs/sajawat-current-architecture.md   (architecture as implemented)
  - docs/sajawat-open-debt.md              (open technical debt)
  - CLAUDE.md and .claude/sajawat-claude.md (operating rules)
  - docs/sajawat-prd.md, -system-architecture.md, -database-design.md,
    -api-design.md, -security-design.md, -phase-0-foundation.md,
    -folder-structure.md, -coding-standards.md, -testing-strategy.md,
    -deployment-plan.md

STEP 2 — Review repository state:
  - Run: git log --oneline -10 ; git status ; git tag
  - Confirm HEAD is at the latest milestone commit and the tree is clean.
  - Confirm structure matches docs/sajawat-folder-structure.md.

STEP 3 — Confirm repository health (read-only, report results):
  - pnpm install
  - pnpm run typecheck   (expect all workspaces pass)
  - pnpm run lint        (expect zero warnings)
  - pnpm run build       (expect clean)
  - pnpm run format:check
  Note: local Node may be 25 (contract is 22 LTS). pnpm is 9.15.0.

STEP 4 — Review completed milestones (0.1–0.3) and the approved plan for the
  NEXT milestone in docs/sajawat-project-state.md §2.

STEP 5 — Review open technical debt (docs/sajawat-open-debt.md) and architecture
  decisions (docs/sajawat-current-architecture.md). Honor: ESM+NodeNext,
  AD-1 role-based packages, default-import for Express/Mongoose, import type,
  req.validatedData (not req.query), single root ESLint config, Conventional Commits.

STEP 6 — Present a continuation plan for the next milestone:
  Architecture Decisions · Folder Structure · Packages To Install · Risks.

STEP 7 — WAIT for explicit approval before implementing. Then implement,
  run all gates, commit with a Conventional Commit message, and report:
  file changes · what was implemented · key decisions · verification results ·
  remaining technical debt. Then stop.

The next milestone to implement is 0.9 (testing foundation: Vitest unit/
integration with @sajawat/*→src aliases + NodeNext .js-resolution smoke;
Supertest against createApp(); mongodb-memory-server + test JWT secrets to
address D13; Playwright e2e scaffold; replace placeholder `test` scripts (D8))
unless told otherwise. 0.8 (Docker & local orchestration) is complete — images
in infrastructure/docker/, root docker-compose.yml (api+web+admin+mongo:7).
Reuse createApp() for Supertest, the 0.7 auth-smoke checks, and the 0.5/0.8
manual health checks as the basis for real suites. Plan 0.9 before coding.
Mongoose 9 is the approved baseline.
```
