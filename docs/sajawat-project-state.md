# SAJAWAT — PROJECT STATE & HANDOFF

> Authoritative state snapshot for resuming work. Read this first, then
> `sajawat-current-architecture.md` and `sajawat-open-debt.md`.

---

## 1. Project State

- **Project:** Sajawat Jewellery — luxury jewelry e-commerce (B2C + B2B leads + CRM + admin).
- **Current status:** Phase 0 (Foundation) **complete** — infrastructure only, **no business features**. **Entering Phase 1** (storefront build per §9, milestone 1.1 next).
- **Current milestone:** **Phase 1.0 (Automated CD) — staging VERIFIED LIVE, production authored-but-unrun.** All workflows exist and are statically validated (`actionlint`/`shellcheck`/YAML/`bash -n` clean): provisioning scripts (0.10b.1), `deploy-staging.yml` (0.10b.2), `deploy-production.yml` (0.10b.3: tag `v*`, required-reviewer `production` Environment, staging→prod digest promotion, automated post-shift rollback). **Staging CD is ACTIVATED and proven** — verified 2026-06-10: `sajawat-api-staging` was last deployed by `sajawat-deployer@sajawat-staging.iam.gserviceaccount.com` (the WIF deployer SA, not a human), by immutable digest (`api@sha256:…`), serving revision healthy with Atlas connected. So WIF/Artifact Registry/Secret Manager/deployer+runtime SAs all work. **Production CD is NOT yet exercised** — `sajawat-production` has **0 Cloud Run services**; needs operator prereqs (prod secrets injected, deployer SA granted `artifactregistry.reader` on the staging repo, `production` GitHub Environment + required reviewer) then a `v*` tag push. **D16 is ~75% closed** (staging proven; production promotion unproven). Tags advanced to `v0.10.2-phase0`. **GCP layout confirmed: separate `sajawat-staging`/`sajawat-production` projects, region `asia-south1`.**
- **As of (2026-06-10):** branches reconciled — `main` = `develop` = `origin/*` = `243844e` (tag `v0.10.2-phase0`), single linear history; the divergent `origin/main` commit `68b42e8` (a settings-only duplicate of the 0.10b.3 work) was discarded by force-push. `develop` now tracks `origin/develop`. Milestone 0.10a tree (`ece7971`, tag `v0.10.0-phase0`) was the last Phase-0 *milestone* commit; The commits on `main` *after* `ece7971` (`bbf068d`, `876bca8`, …) are **auto-generated `.claude/settings.local.json` permission commits** — an editor/hook commits that local-settings file (with a hardcoded, inaccurate `feat(api): add auth middleware` message) whenever the Bash permission allowlist changes. They ship **no application code**, are untagged, and are **not** milestones. They are **kept in history** (no rewrite); the deployable application code is identical to `v0.10.0-phase0`. Phase 0 ~95% — 0.1–0.9 + 0.10a done; **automated 0.10b CD remains**.
- **Phase 0 status:** foundation in place — monorepo, TS, ESLint/Prettier, Express 5 API, security middleware, MongoDB Atlas, env strategy, auth primitives, containerization, automated testing, **CI (GitHub Actions: gates + caching + coverage artifacts + Docker build validation)**, plus **automated CD to Cloud Run staging (verified live via the WIF deployer SA)**. Remaining for full D16 closure: **exercise the production promotion pipeline** (deploy-production.yml is authored but `sajawat-production` has 0 services) — operator prereqs + a `v*` tag push. Mongoose 9 is the **approved baseline**. (Auth endpoints/session store + domain models are Phase 1.)

### Manual staging deploy (verified — NOT milestone 0.10b)
- **Service URL:** `https://sajawat-api-staging-1019894285252.asia-south1.run.app`
- **Region:** `asia-south1` (Mumbai). **GCP project number:** `1019894285252`.
- **Health checks (verified by user):** `/health` ✅ · `/api/v1/health` ✅ · MongoDB Atlas connected ✅.
- **What this is:** an **ad-hoc `gcloud run deploy`** of the 0.8 API image built from the `v0.10.0-phase0` tree. It proves the image runs on Cloud Run against Atlas.
- **What this is NOT:** it is **not** the 0.10b automated CD milestone. There is **no** repeatable pipeline, no Workload Identity Federation, no Artifact Registry config, no Secret Manager wiring, no least-privilege deployer/runtime SAs, no SHA-tagged push, and no revision-rollback path committed. The secret(s) the live service uses were injected manually and are **not** captured as code/config. D16 remains **open**.

### Milestone commit hashes
| Milestone | Commit |
|-----------|--------|
| 0.4 | `388044f` |
| 0.4.1 | `7c0c748` |
| 0.5 | `a498ca3` |
| 0.6 | `c05d2af` |
| 0.7 | `805798e` |
| 0.8 | `114cfcb` |
| 0.9 | `94e9fc6` |
| 0.10a | `ece7971` (tag `v0.10.0-phase0`) |
| 0.10b (automated CD) | **authored, not activated** — 0.10b.1 scripts + 0.10b.2 `deploy-staging.yml` + 0.10b.3 `deploy-production.yml` (D16 implementation-complete, closure pending operator activation) |
| 0.10b.3 (production CD + rollback) | this commit — `deploy-production.yml` + doc updates; Phase-0 closeout tag will be `v0.10.1-phase0` once a gated prod deploy + rollback drill pass |
| Manual staging deploy | **no code commit** — ad-hoc `gcloud run deploy` of the `ece7971` image; not versioned in-repo |

> Note: `main` HEAD `bbf068d` ("feat(api): add auth middleware") is a **post-0.10a
> administrative commit** — it touches only `.claude/settings.local.json` and ships **no
> application code** (its `feat(api)` message does not match its contents). **Kept in
> history (no rewrite)**; **not** a milestone and **untagged**. The deployable tree equals
> `v0.10.0-phase0` (`ece7971`).

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
- ✅ **0.9** — Testing foundation (Vitest unit+integration, Supertest on `createApp()`, `mongodb-memory-server`, chromium Playwright smoke; shared base config with `.js`→`.ts` + `@sajawat/*`→src resolution; coverage floors on auth/errors). **61 Vitest + 2 Playwright = 63 tests green.** Retires D8 + the test-side of D13.
- ✅ **0.10a** — CI pipeline (GitHub Actions `ci.yml`: Corepack pnpm, **Node 22 pinned + guarded**, frozen install, Turbo `lint/typecheck/build/test(+coverage)`, chromium e2e smoke, Docker build validation; pnpm/Turbo/mongod/Playwright caching; coverage artifacts). **Resolves D1 + D9 + CI-side D13.** Retro-tagged 0.4.1→0.9; reconciled `develop`. **No runtime/dev deps; no GCP.**

### Pending milestones
- 🚧 **0.10b** — **Automated CD**, split into three sub-milestones (tracked as D16, still **open**):
  - **0.10b.1 — Infrastructure automation (scripts authored + statically validated; operator-execution pending).** Idempotent gcloud provisioning scripts under `infrastructure/scripts/gcp/` for **two separate projects** (`sajawat-staging` + a new production project), keyless **Workload Identity Federation** (repo-pinned, bound on the GitHub Environment claim — `staging`/`production`), Artifact Registry, **empty** Secret Manager containers (`MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`; values injected out-of-band via stdin), per-service runtime SAs (only `api-run` reads secrets), and a least-privilege deployer SA. `JWT_ISSUER`/`JWT_AUDIENCE` are plain env vars. Includes an orchestrator (`provision.sh`), a read-only `verify.sh`, an optional guarded `00-bootstrap-project.sh`, and a runbook. **Validation:** `bash -n` + `shellcheck -x` clean on all 11 files. **Not yet run against GCP** (operator-executed). AD-47…AD-53.
  - **0.10b.2 — Staging deploy workflow (authored + statically validated; awaiting GitHub Environment config + operator activation).** **Scoped API-only (AD-54)** — `apps/web`/`apps/admin` are still unmodified `create-next-app` starter boilerplate (D4) with no product UI and **no** `*-web/admin-staging` Cloud Run services; deploying them now would be placeholder complexity, so frontend deploy automation defers to Phase 1.4 (web) / 1.7 (admin). Added `.github/workflows/_quality.yml` (reusable gate, **shared with `ci.yml`** — refactored 0.10a) and `.github/workflows/deploy-staging.yml`: trigger `push:develop` (+ manual), keyless **WIF** (`environment: staging`), build+push the env-agnostic API image SHA-tagged to Artifact Registry, deploy **by digest** with `--no-traffic --tag=candidate` → `/api/v1/health` readiness gate → traffic shift (bad revision never serves). Secrets via `--set-secrets`; `JWT_ISSUER`/`JWT_AUDIENCE` + `NODE_ENV`/`CORS_ORIGINS`/`API_BASE_URL` via `--set-env-vars`; `api-run` runtime SA. **Validation:** `actionlint 1.7.7` + embedded `shellcheck` + Python YAML parse + `bash -n` all clean. **Not yet activated** (needs 0.10b.1 run + secrets injected + `staging` Environment variables). Branch hygiene: **`develop` re-synced to `main`** (`eeb6c00`) so the `develop` trigger reflects current code.
  - ⏳ **0.10b.3 — Production deploy workflow + rollback + closeout** (tag `v*`, required-reviewer Environment). Not started; **D16 closes here**.
  - The current live staging service remains a **manual** deploy until 0.10b.2 (once activated) redeploys it through the pipeline. (api already has a prior revision, so `--no-traffic` behaves correctly on cutover.)

### Repository structure (top level)
```
apps/{web,admin}   services/api   packages/{ui,types,shared,config}
docs/   scripts/   tests/{e2e,integration,performance}
infrastructure/{docker,deployment,monitoring,backups,scripts}
.husky/   .github/workflows/ (ci.yml + _quality.yml + deploy-staging.yml)
```

### Installed technologies
Turborepo · pnpm · TypeScript · ESLint (flat + type-aware layer) · Prettier · Husky · commitlint · lint-staged · Next.js 16 · React 19 · Tailwind CSS v4 · **Express 5 · pino + pino-http · Zod · tsx (API foundation)** · **helmet · cors · express-rate-limit (0.4.1 security)** · **Mongoose 9 (0.5 MongoDB Atlas)**. (0.6 added **no** runtime deps — Node-native `--env-file`.) · **jose · @node-rs/argon2 · cookie-parser (0.7 auth)**. (0.8 added **no** runtime deps — Docker multi-stage on `node:22-bookworm-slim`, `turbo prune` + `pnpm deploy` / Next `standalone`, `docker-compose` with `mongo:7`.) · **Vitest · Supertest · mongodb-memory-server · jsdom · React Testing Library · Playwright (0.9 testing, all devDeps)**.

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
- `services/api` runs as a real Express 5 server, connects to MongoDB Atlas (0.5), ships **auth primitives + middleware** (0.7), is **containerized** (0.8), and has an **automated test suite** (0.9); still no auth *endpoints*, business modules, or CI.
- **E2E is a chromium smoke scaffold only** — no business journeys yet (Phase 1).
- Auth is stateless — **no session/refresh store yet** (D15): no server-side revocation/rotation until Phase 1.
- No business collections/models yet (first `User`/`Role` model lands in Phase 1).
- Apps contain default Next.js starter content.
- Local (non-Docker) toolchain runs on Node 25; the **Docker images use the contracted Node 22** (Corepack pnpm).

### Next recommended action
Implement **Milestone 0.10b** (automated CD — Cloud Run). GCP is **now provisioned** (a manual staging deploy is live), so D16's original blocker is cleared; the work is to replace the ad-hoc `gcloud run deploy` with a keyless, repeatable, reviewable pipeline **and migrate the manually-injected secret(s) into Secret Manager**. Steps (tracked as **D16**): GCP project + **Workload Identity Federation** (OIDC, keyless), **Artifact Registry** repo, **Secret Manager** entries (`MONGODB_URI`, `JWT_*`), and least-privilege service accounts (separate CI-deployer SA from the Cloud Run runtime SA). Then author `deploy-staging.yml` (auto on `develop`) + `deploy-production.yml` (`main`, behind a GitHub Environment with a required reviewer): build env-specific frontend images + the env-agnostic API image, push to Artifact Registry (SHA tags), `gcloud run deploy --set-secrets`, deploy API→web→admin, post-deploy readiness gate, revision-based rollback. Region is a configurable workflow variable (decide at deploy time).

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

#### Milestone 0.9 — Testing foundation
- **Goal:** Stand up the test harness and cover the existing code (auth/RBAC/JWT/middleware/health/errors). No business domains yet → E2E is a smoke scaffold. Retire D8 + the test-side of D13.
- **Implemented:** devDeps `vitest`, `@vitest/coverage-v8`, `supertest`, `mongodb-memory-server` (api); `vitest`/coverage (shared); `jsdom` + RTL + `@vitejs/plugin-react` (web/admin); `@playwright/test` (root). Shared base `@sajawat/config/vitest/base.mts` (AD-32: `.js`→`.ts` resolver plugin + `@sajawat/*`→src aliases + coverage defaults). Per-package `vitest.config.ts` + `test: vitest run`. **AD-36 tsconfig split:** api `tsconfig.json` (lint/typecheck, incl. `test/**`) + `tsconfig.build.json` (emit `src` only); shared/apps exclude `*.test.*` from emit. ESLint: test-file rule relaxations (no-unsafe-*, unbound-method), `.mts` + `tests/**` globs. Playwright `playwright.config.ts` (chromium, webServer, `PLAYWRIGHT_BASE_URL` compose mode) + `tests/e2e/smoke.spec.ts`. Coverage floors on `src/auth`/`src/errors` (api) + `src/auth` (shared). Root `test:coverage` + `test:e2e`.
- **Tests:** unit (jwt incl. **expired access + refresh → 401**, password argon2id, cookies, app-error/clientErrorCode, RBAC matrix every-role, password policy) + integration (Supertest on `createApp()`: health healthy/degraded via memory-server, 404/400/413 envelopes, helmet/CORS, requireAuth/Role/Permission, CSRF double-submit, rate-limit 429). **61 Vitest + 2 Playwright = 63 green.**
- **Verification:** typecheck + lint + build + format + test all green (Turbo). Coverage: shared auth 100%, api auth 87.9% / errors 92.6% (floors pass); moderate ~66% global (ratchet later). Playwright chromium smoke 2/2.
- **Risks resolved in-flight:** memory-server default mongod 8.2.6 (ubuntu2404) **SIGSEGV** on this host → pinned `MONGOMS_VERSION=6.0.14` (overridable); type-aware lint vs Supertest `any`/unbound methods → test-file rule relaxations; NodeNext `.js`→`.ts` resolution → resolver plugin (proven by the green suites). Retires **D8**; retires test-side **D13**.

#### Milestone 0.10a — CI pipeline (GitHub Actions)
- **Goal:** Stand up the CI gate pipeline for every PR and push, enforce the Node 22 contract, cache aggressively, publish coverage, and validate the Docker images — **no GCP/CD** (split out to 0.10b). Reconcile tags (D9) and branches.
- **Implemented:** `.github/workflows/ci.yml` (no deps). **`quality` job:** `corepack enable` → `setup-node` (`node-version-file: .nvmrc`, `cache: pnpm`) → **Node-22 guard** (fail if major ≠ 22) → `pnpm install --frozen-lockfile` → `pnpm exec turbo run lint typecheck build --cache-dir=.turbo` → `pnpm exec turbo run test --cache-dir=.turbo -- --coverage` → upload `coverage/` artifacts. **`e2e` job:** cached chromium Playwright → build `@sajawat/web` → smoke spec. **`docker` job:** push-events only, matrix api/web/admin, `build-push-action` (`push: false`) validating each 0.8 Dockerfile with GHA layer cache. `concurrency` cancels superseded runs; `permissions: contents: read`; `MONGOMS_VERSION=6.0.14` at workflow env.
- **Key decisions:** AD-39 GitHub Actions sole provider; AD-40 Node 22 = setup-node + guard (engine-strict stays false; **D1 closure is a runtime pin**); AD-41 Corepack before setup-node; AD-42 frozen lockfile; AD-43 Turbo-driven gates + `.turbo` cache (remote cache deferred); AD-44 coverage artifacts + Vitest floors (no Codecov); AD-45 **no real secrets in gates** (test/setup.ts self-provisions; only `MONGOMS_VERSION`) → **CI-side D13 closure**; AD-46 Docker build-validated (push/deploy is 0.10b).
- **Caching:** pnpm store (setup-node), Turbo (`.turbo`), `mongodb-binaries` (keyed on `MONGOMS_VERSION`), Playwright browsers (keyed on `pnpm-lock.yaml`), Docker layers (`type=gha`).
- **Tags/branches (D9):** retro-tagged `v0.4.1-phase0`→`v0.9.0-phase0` at recorded commits + `v0.10.0-phase0`; `develop` fast-forwarded to `main` and both pushed.
- **Resolves:** D1, D9, CI-side D13. **Adds:** D16 (CD deferred to 0.10b).

### Planned

| Milestone | Goal (summary) |
|-----------|----------------|
| 0.10b.1 | **Infra automation (in progress — scripts done, not yet run).** Idempotent gcloud scripts (`infrastructure/scripts/gcp/`): two projects, WIF (keyless, repo-pinned, env-claim-bound), Artifact Registry, Secret Manager containers, per-service runtime SAs + least-priv deployer SA. `bash -n` + `shellcheck -x` clean. Operator-executed next. |
| 0.10b.2 | **Staging deploy workflow — API-only (authored + validated).** `_quality.yml` (reusable gate, shared with CI) + `deploy-staging.yml`: `push:develop`, keyless WIF, SHA-tagged API image to Artifact Registry, deploy by digest with `--no-traffic`→readiness→traffic-shift. Web/admin deferred (starter boilerplate, AD-54). Awaiting Environment config + activation. |
| 0.10b.3 | Production deploy workflow (tag `v*`, required-reviewer GitHub Environment) + revision rollback + closeout. **D16 closes here.** |

---

## 3. Architecture Snapshot

Full detail in `sajawat-current-architecture.md`. Quick index of approved decisions:

Turborepo 2.x · Node 22 LTS (contract) · pnpm 9.15.0 · TypeScript strict (+extra flags) · ESM + NodeNext · Express 5 (0.4) · pino (0.4) · Next.js 16 · React 19 · Tailwind v4 · AD-1 role-based packages · TS project references · `workspace:*` + `exports` · single root ESLint flat config (zero-warning) · Conventional Commits (commitlint + Husky) · pino logging w/ redaction (0.4) · Zod validation (0.4).

---

## 4. Technical Debt Register

Authoritative copy in `sajawat-open-debt.md`. Open items:

| ID | Severity | Description | Planned Resolution | Milestone |
|----|----------|-------------|--------------------|-----------|
| D3 | Low | Local pnpm via npm prefix (Corepack broken on Node 25). | Documented; CI/Docker use Corepack. | — |
| D4 | Low | Next.js starter boilerplate in apps. | Replace at Phase 1 UI. | Phase 1 |
| D5 | Low | `.prettierignore` excludes all Markdown. | Optionally narrow scope. | optional |
| D7 | Low | `@sajawat/config` lint-exempt. | Accepted. | — |
| D10 | Low | `services/api` `dist/` git-ignored; API not consumed by another workspace. | Accepted; revisit if imported elsewhere. | — |
| D14 | Low | Readiness 503 logs at error level (pino-http 5xx→error) — noisy under sustained DB outage. | Optionally downgrade/skip readiness-probe logging. | optional |
| D15 | Medium | Stateless refresh tokens (0.7) — no server-side revocation/rotation until a Phase-1 session store; leaked refresh valid until expiry. Accepted. | Phase-1 session/refresh store (rotation + reuse-detection); claims already carry `jti`/`family`. | Phase 1 |
| D16 | Medium | **Automated CD not implemented.** No Cloud Run / Artifact Registry / WIF / Secret Manager deploy workflows; CI build-validates images but never pushes/deploys. A **manual** `gcloud run deploy` staging service is live, but it is ad-hoc, unversioned, and its secrets were injected by hand (not captured as code/config). | Implement 0.10b: keyless repeatable pipeline + migrate live secrets into Secret Manager. GCP is now provisioned, so the original blocker is cleared. | 0.10b |

(D6 — non-type-aware ESLint — **resolved in 0.4**. helmet/cors/rate-limit gap **resolved in 0.4.1**. **D11 (CSRF) resolved in 0.7**. **D8 (placeholder `test` scripts) resolved in 0.9**. **D1 (Node-22 enforcement), D9 (tags/releases), and CI-side D13 (CI env/secrets) resolved in 0.10a.** Only the accepted `@sajawat/config` lint/typecheck stubs remain (D7). CSP remains a frontend concern (D12).)

---

## 5. Repository Inventory

### apps/
- `web/` — `@sajawat/web` (Next 16, :3000): `next.config.ts` (transpilePackages + **`output:'standalone'`**, 0.8), `tsconfig.json`, `src/app/{layout,page}.tsx` + `src/app/health/route.ts` (0.8), `postcss.config.mjs`, `.env.example` (0.6, `NEXT_PUBLIC_*`), `.gitignore` (`!.env.example`), `package.json`.
- `admin/` — `@sajawat/admin` (Next 16, :3001): same layout (+ `.env.example`, `health/route.ts`, standalone).

### services/
- `api/` — `@sajawat/api` (Express 5, ESM/NodeNext): `src/{index,app}.ts`, `config/{env,logger}.ts`, `db/{connection,health,base-plugin,index}.ts`, `auth/{jwt,password,cookies,rbac}.ts` (0.7), `errors/app-error.ts`, `http/respond.ts`, `middleware/{request-logger,security,rate-limit,validate,auth,csrf,not-found,error-handler}.ts`, `routes/health.routes.ts`, `types/express.d.ts`; **tests (0.9):** colocated `src/**/*.test.ts` + `test/{setup,helpers}.ts` + `test/integration/*.test.ts`, `vitest.config.ts`; `tsconfig.json` (lint/typecheck incl. tests) + `tsconfig.build.json` (emit `src`). Auth utilities + middleware present; **endpoints Phase 1**.

### packages/
- `ui/` — `@sajawat/ui` (source TSX): `src/index.ts`, `tsconfig.json` (react-library).
- `types/` — `@sajawat/types` (type-only): `src/index.ts`, `tsconfig.json` (noEmit).
- `shared/` — `@sajawat/shared` (compiled): `src/index.ts`, `src/auth/{roles,password-policy,index}.ts` (0.7 RBAC catalog + password policy; `zod` dep), `tsconfig.json` (composite), emits `dist/`.
- `config/` — `@sajawat/config` (tooling): `prettier/index.js`, `eslint/{base,react,type-checked}.mjs`, `typescript/{base,node,library,react-library,nextjs}.json`, `vitest/base.mts` (0.9), `package.json` (exports map).

### docs/
Specs (source of truth): `sajawat-prd.md`, `-system-architecture.md`, `-database-design.md`, `-api-design.md`, `-security-design.md`, `-phase-0-foundation.md`, `-folder-structure.md`, `-coding-standards.md`, `-testing-strategy.md`, `-deployment-plan.md`, `-roadmap.md`, `-environment-guide.md` (0.6), plus brand/business/admin/crm/ui-ux specs. **Handoff docs:** `sajawat-project-state.md` (this), `sajawat-current-architecture.md`, `sajawat-open-debt.md`.

### scripts/
- `check-staged-secrets.sh` (0.6 — pre-commit guard blocking staged real `.env*`). `.gitkeep` (dev/seed scripts — to be populated).

### tests/
- `e2e/smoke.spec.ts` (0.9 Playwright chromium smoke); `integration/`, `performance/` (`.gitkeep`). Unit/integration live colocated per package; root `playwright.config.ts` + `tests/e2e`.

### infrastructure/
- `docker/` — **`api.Dockerfile`, `web.Dockerfile`, `admin.Dockerfile`** (0.8, multi-stage `node:22-bookworm-slim`). **`scripts/gcp/`** (0.10b.1) — idempotent GCP provisioning scripts (`lib.sh`, `config.{staging,production}.sh`, `00-bootstrap-project.sh`, `01..05-*.sh`, `provision.sh`, `verify.sh`, `README.md`). `deployment/`, `monitoring/`, `backups/` (`.gitkeep`; CD workflows land in 0.10b.2/0.10b.3).

### .github/
- `workflows/ci.yml` (0.10a, refactored 0.10b.2 — `quality` now calls the reusable `_quality.yml`; plus `e2e` + `docker`). `workflows/_quality.yml` (0.10b.2 — reusable lint/typecheck/build/test gate, shared by CI + staging deploy). `workflows/deploy-staging.yml` (0.10b.2 — **API-only** keyless WIF deploy: build→push→deploy-by-digest→readiness→traffic-shift). `deploy-production.yml` lands in 0.10b.3.

### Root
`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.json` (solution), `eslint.config.mjs`, `prettier.config.js`, `commitlint.config.cjs`, `.lintstagedrc.json`, `.npmrc`, `.nvmrc`, `.gitignore`, `.prettierignore`, `.dockerignore` (0.8), `.env.example`, `docker-compose.yml` (0.8), `playwright.config.ts` (0.9), `.github/workflows/ci.yml` (0.10a), `README.md`, `CLAUDE.md`, `.husky/{pre-commit,commit-msg}`. `scripts/check-staged-secrets.sh`.

---

## 6. Git Snapshot

- **Current branch:** `main`. The commits after `ece7971` (`bbf068d`, `876bca8`, plus this docs commit) are **auto-generated `.claude/settings.local.json` permission commits** (mislabeled `feat(api): add auth middleware` by the settings-commit hook) and the docs-state update — **no application code**, **kept in history (no rewrite)**. The canonical end-of-Phase-0 code tree is `ece7971` / `v0.10.0-phase0`.
- **Tags (D9 — resolved in 0.10a):** one annotated `vX.Y.0-phase0` per milestone — `v0.1.0`…`v0.4.0`, `v0.4.1`, `v0.5.0`, `v0.6.0`, `v0.7.0`, `v0.8.0`, `v0.9.0`, `v0.10.0-phase0`. `bbf068d` is **untagged**. First production release `v1.0.0` at the end of Phase 1.
- **Remote:** `origin = github.com:Adhirajsingh2507/sajawat`. `main` and tags pushed (`origin/main` = `bbf068d`).
- **`develop` branch:** **drifted** — `origin/develop` is at `ece7971` (0.10a), **one commit behind** `origin/main`. Re-sync `develop` → `main` before Phase-1 feature branches so the `develop`→staging mapping (once 0.10b exists) is correct.

### Tagging strategy (D9 — implemented in 0.10a)
- **Scheme:** annotated phase tags `vX.Y.0-phase0` (patches like `v0.4.1-phase0`), one per milestone. First production release `v1.0.0` at end of Phase 1; CI may cut a GitHub Release on tag push (optional, 0.10b+).
- **Branching going forward:** land milestone work on `feature/*` → PR into `develop` (CI gates + 0.10b staging) → release into `main` (0.10b production behind a required reviewer), per deployment-plan.

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
| vitest / @vitest/coverage-v8 | ^4 | unit + integration runner (0.9) |
| supertest | ^7 | API integration on `createApp()` (0.9) |
| mongodb-memory-server | ^10 | hermetic Mongo for integration (0.9; pin `MONGOMS_VERSION=6.0.14`) |
| jsdom · @testing-library/{react,jest-dom,user-event} | — | web/admin component tests (0.9) |
| @playwright/test | ^1 | chromium e2e smoke (0.9) |

---

## 8. Phase 0 — Final Closure

> Status: **substantially closed.** Phase 0's goal was a production-grade
> foundation with no business features. Every foundation milestone (0.1–0.10a) is
> complete, verified, tagged, and on `main`. A live Cloud Run staging service
> proves the container runs against Atlas in GCP. **One item is explicitly left
> open:** automated CD (0.10b / D16). We are closing Phase 0 with that single,
> documented carry-forward rather than pretending it is done.

### Delivered (verified)
| # | Milestone | Outcome | Tag |
|---|-----------|---------|-----|
| 0.1 | Monorepo skeleton | Turborepo + pnpm workspaces build clean | `v0.1.0-phase0` |
| 0.2 | TypeScript foundation | strict TS, project refs, commit hygiene | `v0.2.0-phase0` |
| 0.3 | ESLint flat config | single root config, zero-warning policy | `v0.3.0-phase0` |
| 0.4 | API foundation | Express 5 app factory, pino, envelopes, Zod, error hierarchy | `v0.4.0-phase0` |
| 0.4.1 | Security hardening | helmet, CORS allow-list, global rate limiter | `v0.4.1-phase0` |
| 0.5 | MongoDB Atlas | Mongoose 9 connection lifecycle + DB readiness | `v0.5.0-phase0` |
| 0.6 | Env strategy | Node-native layered `--env-file`, prod guards, secret guard | `v0.6.0-phase0` |
| 0.7 | Auth foundation | jose JWT, Argon2id, centralized RBAC, CSRF, auth limiter | `v0.7.0-phase0` |
| 0.8 | Containerization | 3 hardened multi-stage images + compose w/ `mongo:7` | `v0.8.0-phase0` |
| 0.9 | Testing foundation | Vitest + Supertest + memory-server + Playwright (63 tests) | `v0.9.0-phase0` |
| 0.10a | CI pipeline | GitHub Actions gates + caching + coverage + Docker build validation | `v0.10.0-phase0` |

### Verified beyond the milestones
- **Manual Cloud Run staging deploy** of the `ece7971` image: `/health`, `/api/v1/health`, and Atlas connectivity all green at `asia-south1`. Confirms Cloud Run + Atlas runtime compatibility ahead of automated CD.

### Carry-forward into Phase 1 (open debt at closure)
| ID | Sev | Item |
|----|-----|------|
| **D16** | Medium | **Automated CD (0.10b) not built.** Live staging is a manual, unversioned deploy with hand-injected secrets. Needs the keyless pipeline + Secret Manager migration. |
| **D15** | Medium | Stateless refresh tokens — no server-side revocation/rotation until the Phase-1 session store. |
| D4 | Low | Next.js starter boilerplate still in both apps (replaced when Phase-1 UI begins). |
| D12 | Low | helmet CSP disabled (JSON API) — frontend CSP lands with Phase-1 UI. |
| D14 | Low | Readiness-503 logs at error level under sustained DB outage (optional). |
| D3, D5, D7, D10 | Low | Accepted/doc-only (local Corepack divergence, markdown format scope, config-pkg lint exemption, api `dist` not cross-consumed). |

### Closure caveats (honesty notes)
- `main` HEAD `bbf068d` is a **post-0.10a administrative commit** (only `.claude/settings.local.json`; no app code). **Decision: kept in history, no rewrite**; treated as a docs/local-settings state commit, **not** a milestone. `ece7971` / `v0.10.0-phase0` is the canonical end-of-Phase-0 code state.
- `origin/develop` is one commit behind `origin/main` (at `ece7971`). **Decision: re-sync `develop` → `main` before any Phase-1 work** so the target topology holds (`main` = source of truth, `develop` = synced with `main`, feature branches cut from `develop`).

---

## 9. Phase 1 — Implementation Roadmap (APPROVED 2026-06-10; canonical Phase-1 definition — supersedes the Design-System-only "Phase 1" in sajawat-roadmap.md, which is now folded into milestone 1.4)

> Phase 1 turns the foundation into a shippable storefront. Per CLAUDE.md, **each
> milestone below is architecture-first**: invoke the relevant agent, produce an
> architecture + implementation plan, get approval, then implement. The order
> front-loads the data layer and auth endpoints (everything else depends on them)
> and closes the two medium-severity debts (D15, D16) early.

**Sequencing rationale:** finish the CD + secrets story (1.0) so every later
milestone deploys safely; then the persistence + auth-endpoint spine (1.1–1.2)
that unblocks all domain work; then catalog → cart → checkout/payments (the
revenue path); then content/SEO and admin; hardening last.

| # | Milestone | Scope (summary) | Lead agent(s) | Closes |
|---|-----------|-----------------|---------------|--------|
| **1.0** | **Automated CD (close D16) — STAGING DONE ✅ / PROD pending** | _Staging CD verified live 2026-06-10 (WIF deployer SA, digest deploy, healthy). Production pipeline authored but unrun (0 prod services); to close: operator prereqs + `v*` tag push._ Author `deploy-staging.yml` (auto on `develop`) + `deploy-production.yml` (`main`, GitHub Environment + required reviewer): WIF/OIDC (keyless), Artifact Registry, Secret Manager wiring, separate CI-deployer vs Cloud Run runtime SAs, SHA-tagged push, `gcloud run deploy --set-secrets`, post-deploy readiness gate, revision rollback. Re-deploy the current manual service *through* the pipeline. | devops, security | **D16** |
| **1.0-OH** | **Operational Hardening (parallel, non-blocking)** | Not a gate on other Phase-1 work. Covers: **Atlas password rotation**, **JWT secret rotation**, **replacement of any exposed test credentials**, **Secret Manager verification** (live secrets sourced from Secret Manager, not hand-injected), and a **documented secret-rotation procedure**. | security, devops | — |
| **1.1** | **Persistence layer + `BaseRepository`** ✅ DONE | `User` model on the 0.5 `baseSchemaPlugin`; `BaseRepository` (AD-6, soft-delete scoping + pagination); explicit indexes + `sync-indexes`/`seed-admin` scripts. (`Role` is a code-canonical enum per AD-20 — no roles collection.) | database, architect | — |
| **1.2** | **Auth endpoints + session store + Google** ✅ DONE | register/login/refresh/logout/me on the 0.7 primitives; **persisted `sessions` store** with rotation + reuse-detection (revoke `family`, TTL); `csrfGuard` on cookie routes; `authRateLimiter` on credential routes; **Google sign-in (GIS ID-token flow) behind the optional `GOOGLE_CLIENT_ID` flag → 501 when unset** (mocked verifier + tests; real Client IDs at 1.4). OTP/email-verify deferred to the notification milestone. | backend, security | **D15** |
| **1.3a** | **Catalog base (Category + Collection)** ✅ DONE | `Category`/`Collection` models+repos+services, public read (`GET /categories`, `/categories/:slug`, `/collections`, `/collections/:slug`) + admin CRUD (`/admin/...`, RBAC `CATEGORY_WRITE`/`COLLECTION_WRITE`); slug derive+uniquify util; **`@sajawat/types` populated** with `PublicCategory`/`PublicCollection`/`Paginated<T>` (type-only pkg → storefront-shareable). Static-before-param routing. **No variants** (one product = one SKU, locked); **media as URL/key references** (GCS upload deferred). | backend, database, ecommerce | — |
| **1.3b** | **Products + Inventory + Search** ✅ DONE | `Product` (refs Category/Collections; embedded image/video/seo; text index) + `Inventory` (1:1, derived availableQuantity/status) + `InventoryMovement` (immutable signed-delta audit). Public list (filter by category/collection slug, featured/bestSeller, whitelisted sort, pagination) + `/search` (Mongo `$text`) + `/featured` `/best-sellers` `/new-arrivals` + `/:slug` (active-only); `PublicProduct.inStock` joined from inventory (batched). Admin product CRUD (PRODUCT_READ/WRITE/DELETE) + inventory adjust + `/history` (INVENTORY_READ/WRITE). Product create auto-creates inventory. **Note (AD-9):** global `sanitizeFilter` rejects developer operators — `$in`/`$text` are wrapped in `mongoose.trusted()` at the (trusted, validated) repository/service layer. Static-before-`:slug` enforced. | backend, database, ecommerce | — |
| **1.3-media** *(deferred)* | **GCS upload pipeline** | Bucket provisioning + `@google-cloud/storage` + signed-URL/multipart upload + MIME/size validation + image optimization. Lands with the admin UI (1.7). | devops, backend, security | — |
| **1.4a** | **Storefront foundation + auth gate** ✅ DONE | Replaces Next starter (D4-web). Brand design system in **`@sajawat/ui`** (tokens: Royal Purple/Gold + neutrals, Playfair/Inter via next/font; primitives: Button/Input/Card/Badge/Container/Heading). Browser **API client** + **AuthProvider** (silent refresh-on-load). **Login + register** pages. **Fully login-gated storefront** (owner decision AD-1.4G — see debt **D17**): `(shop)` client gate redirects unauthenticated users to `/login`. App shell (Header/Footer) + branded Home. **1.2 support change:** CSRF cookie made persistent + re-issued on `/refresh-token` so returning users can silent-refresh. | frontend, ecommerce | **D4** (web) |
| **1.4b** | **Gated catalog (web)** | PLP (`/products`, `/categories/[slug]`, `/collections/[slug]`), PDP (`/products/[slug]`), search — fetched **client-side behind the auth gate** using the 1.3 catalog API; product cards, filters/sort/pagination, loading/empty states, full nav. **SEO dropped** (moot behind login — see D17). Per-app **CSP** (closes D12-web). | frontend, ecommerce | **D12** (web) |
| **1.5** | **Cart + wishlist + promotions engine (Model A)** | Server-authoritative cart + wishlist; **admin-configurable promotions** (trigger=`automatic` cart-value rules and/or `coupon` codes; `percentage`/`fixed`, `minimumCartValue`, `maxDiscount`, usage limits) — discount **always recomputed server-side** at cart/checkout (never trust client totals). Supersedes the code-only `coupons` design. | backend, ecommerce | — |
| **1.6** | **Checkout + payments** | `Order`/`OrderItem`/`Payment`/`Address`; **Razorpay** behind `PaymentProvider`; **architecture-first per PAYMENT RULES** (payment architecture, webhook handling, failure recovery, order-consistency strategy); never confirm an order without verified payment + idempotent webhooks. | ecommerce, backend, security | — |
| **1.7** | **Admin panel** | Replace admin starter (D4); product/order/inventory/coupon management UIs against 1.3–1.6 endpoints; role-gated nav from the shared RBAC catalog. | frontend, ecommerce | **D4** (admin) |
| **1.8** | **B2B bulk enquiry + CRM + notifications (Model B)** | _May move earlier (right after catalog) — it is core B2B revenue and only needs the catalog + notification abstraction._ Wholesale **enquiry form** (name, company, GST, phone, email, city, qty, product interest, message) → persist as `crm_lead` (type=b2b, source=web) **+ instant WhatsApp alert to the admin number (from `settings`)** via the notification abstraction (Official WhatsApp Business API; MSG91 SMS optional). **No automated wholesale checkout.** CRM pipeline board for staff (stages Lead→Contacted→Follow-up→Negotiation→Won/Lost). | backend, ecommerce | — |
| **1.9** | **Frontend CSP + security hardening** | Per-app CSP in `apps/web`/`apps/admin` (closes D12); auth/OTP strict limiters in production; dependency + secret scanning in CI; pre-launch security review (security-review skill). | security, frontend | **D12** |
| **1.10** | **Launch readiness** | E2E business journeys (replace the 0.9 smoke scaffold); performance/load tests (`tests/performance/`); coverage ratchet; observability/alerting (`infrastructure/monitoring/`); backups (`infrastructure/backups/`); **`v1.0.0` production release**. | devops, architect, seo | — |

**Cross-cutting (every milestone):** architecture-first planning + approval gate;
Conventional Commits + annotated tags; CI gates green; threat-model new surfaces
(authn/authz, rate limiting, input validation, NoSQL-injection, XSS/CSRF);
SEO + Core Web Vitals for any user-facing page; document state/debt updates.

**Decisions locked (per approval):**
- `bbf068d` kept in history (no rewrite); `ece7971` / `v0.10.0-phase0` is the last meaningful Phase-0 milestone commit.
- `develop` re-synced to `main` before any Phase-1 work; topology = `main` (source of truth) → `develop` (synced) → feature branches off `develop`.
- Secret rotation is **not** a Phase-1 blocker; it lives in the **1.0-OH Operational Hardening** task.

**Open questions:**
1. ✅ RESOLVED (2026-06-10): GCP layout = **separate `sajawat-staging` / `sajawat-production` projects**, region **`asia-south1`** (Mumbai). Custom domain (Cloudflare DNS) still TBD — needed before public launch (1.10), not before 1.1.
2. Confirm Razorpay account/keys availability ahead of 1.6.

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

The next milestone to implement is 0.10b / Phase-1.0 (AUTOMATED CD — Cloud Run),
tracked as D16. GCP is now PROVISIONED and a MANUAL staging deploy is live
(`https://sajawat-api-staging-1019894285252.asia-south1.run.app`, region
asia-south1) — but that manual deploy is ad-hoc and does NOT satisfy the
milestone; the repo has no deploy workflows/WIF/Artifact Registry/Secret Manager.
Note `main` HEAD `bbf068d` is a post-0.10a administrative commit (only
`.claude/settings.local.json`; no app code, kept in history); the canonical
Phase-0 tree is `ece7971` / `v0.10.0-phase0`. 0.10a (CI) is complete:
`.github/workflows/ci.yml`
runs Corepack pnpm, Node 22 (pinned via .nvmrc + a guard step), frozen install,
Turbo lint/typecheck/build/test(+coverage), chromium e2e smoke, and Docker build
validation; caching covers pnpm/Turbo/mongod (MONGOMS_VERSION=6.0.14)/Playwright;
coverage is uploaded as an artifact. D1, D9, and CI-side D13 are resolved.
For 0.10b: provision the GCP project + Workload Identity Federation (OIDC,
keyless) + Artifact Registry + Secret Manager (MONGODB_URI, JWT_*) + least-
privilege service accounts (separate CI-deployer from Cloud Run runtime SA), then
author deploy-staging.yml (auto on develop) + deploy-production.yml (main, behind
a GitHub Environment with a required reviewer): build env-specific frontend +
env-agnostic API images, SHA-tagged push, gcloud run deploy --set-secrets, deploy
API→web→admin, post-deploy readiness gate, revision rollback. Region is a
configurable workflow variable. Plan 0.10b before coding. Mongoose 9 is the
approved baseline.
```
