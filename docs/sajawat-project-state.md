# SAJAWAT — PROJECT STATE & HANDOFF

> Authoritative state snapshot for resuming work. Read this first, then
> `sajawat-current-architecture.md` and `sajawat-open-debt.md`.

---

## 1. Project State

- **Project:** Sajawat Jewellery — luxury jewelry e-commerce (B2C + B2B leads + CRM + admin).
- **Current status:** Phase 0 (Foundation) in progress — infrastructure only, **no business features**.
- **Current milestone:** **0.4 complete.** Next up: **0.5 (MongoDB Atlas connection + DB health check)** — not yet planned.
- **As of:** Milestone 0.4 commit on branch `main`.

### Completed milestones
- ✅ **0.1** — Monorepo skeleton
- ✅ **0.2** — TypeScript foundation, project references, commit hygiene
- ✅ **0.3** — ESLint flat config, zero-warning policy, workspace-wide lint
- ✅ **0.4** — API foundation (Express 5 app factory, pino + request IDs, `/health` + `/api/v1/health`, error hierarchy + global handler, response envelope, Zod request/env validation, type-aware ESLint layer)

### Pending milestones
- ⏳ **0.5** — MongoDB Atlas connection + DB health check
- ⏳ **0.6** — Environment strategy completion (per-env files; partially folded into 0.4) + first domain scaffolding
- ⏳ **0.7** — Auth foundation (JWT, Argon2, RBAC utilities)
- ⏳ **0.8** — Docker (web/admin/api) + `pnpm deploy` images + compose
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
Turborepo · pnpm · TypeScript · ESLint (flat + type-aware layer) · Prettier · Husky · commitlint · lint-staged · Next.js 16 · React 19 · Tailwind CSS v4 · **Express 5 · pino + pino-http · Zod · tsx (API foundation)**. (Mongoose arrives in 0.5.)

### Architecture decisions
See `sajawat-current-architecture.md` §1–2 for the authoritative list (Turborepo, Node 22, pnpm, TS strict, ESM+NodeNext, Express 5, pino, Next/React/Tailwind, AD-1 role-based packages, project references, `workspace:*`, root ESLint, Conventional Commits, Zod validation).

### Approved deviations from original plan
1. **pnpm via npm user-prefix locally** (Corepack broken on Node 25) — contract remains Corepack/Node 22 in CI/Docker.
2. **`engine-strict=false`** (was planned `true`) so installs run on Node 25.
3. **pino instead of Winston** (0.1 summary mentioned Winston) — performance + JSON + redaction.
4. **Express 5 instead of 4** — native async error propagation.
5. **Env config folded into 0.4** (was a standalone 0.6 item) — Zod-validated, Node `--env-file`.
6. **Single root ESLint config** (not per-package) — required for lint-staged/turbo parity under ESLint v9 flat-config resolution.

### Important implementation notes
- `verbatimModuleSyntax` ⇒ always use `import type` for type-only imports.
- CJS deps (Express/Mongoose) ⇒ **default import + destructure** (lint-enforced; named imports blocked).
- Express 5: `req.query`/`req.params` are **read-only** — validated data goes to `req.validatedData`.
- `@sajawat/shared` is compiled to `dist`; consumers read built output (build runs before typecheck via Turbo `^build`).
- Cross-package resolution = package name + `exports` (no tsconfig `paths`); only `@/*` internal alias in apps.
- ESLint is a single root config; `turbo run lint` and `lint-staged` both resolve it.

### Known limitations
- No runtime backend yet (`services/api` is a typed skeleton).
- No database connectivity, auth, business modules, tests, Docker, or CI.
- Apps contain default Next.js starter content.
- Local toolchain runs on Node 25, not the contracted Node 22.

### Next recommended action
Plan and implement **Milestone 0.5** (MongoDB Atlas): a connection module with retry/backoff, Mongoose config, DB readiness wired into `/api/v1/health` (degraded/unhealthy states), and graceful disconnect on shutdown. `MONGODB_URI` graduates to a required env var in `config/env.ts`. Reuse the 0.4 error hierarchy + logger.

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

### Planned

| Milestone | Goal (summary) |
|-----------|----------------|
| 0.5 | MongoDB Atlas connection module (retry), Mongoose config, DB readiness in `/api/v1/health`, graceful disconnect. |
| 0.6 | Per-env file strategy completion; first domain module scaffolding using the 0.4 foundation. |
| 0.7 | Auth foundation: JWT access/refresh utils, Argon2 password utils, RBAC permission matrix, rate-limit factory for auth. |
| 0.8 | Dockerfiles (web/admin/api) multi-stage on `node:22`, `pnpm deploy` pruned API image, `docker-compose.yml`. |
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

(D6 — non-type-aware ESLint — **resolved in 0.4**: type-checked layer added for `services/api`.)

---

## 5. Repository Inventory

### apps/
- `web/` — `@sajawat/web` (Next 16, :3000): `next.config.ts` (transpilePackages), `tsconfig.json` (extends nextjs base), `src/app/{layout,page}.tsx`, `postcss.config.mjs`, `package.json`.
- `admin/` — `@sajawat/admin` (Next 16, :3001): same layout.

### services/
- `api/` — `@sajawat/api` (Express 5, ESM/NodeNext): `src/{index,app}.ts`, `config/{env,logger}.ts`, `errors/app-error.ts`, `http/respond.ts`, `middleware/{request-logger,validate,not-found,error-handler}.ts`, `routes/health.routes.ts`, `types/express.d.ts`; `tsconfig.json` (node base, references shared, emits `dist`); `package.json` (dev `tsx watch`, `start`, `build`). Runs `/health` + `/api/v1/health`. MongoDB lands in 0.5.

### packages/
- `ui/` — `@sajawat/ui` (source TSX): `src/index.ts`, `tsconfig.json` (react-library).
- `types/` — `@sajawat/types` (type-only): `src/index.ts`, `tsconfig.json` (noEmit).
- `shared/` — `@sajawat/shared` (compiled): `src/index.ts`, `tsconfig.json` (composite), emits `dist/`.
- `config/` — `@sajawat/config` (tooling): `prettier/index.js`, `eslint/{base,react}.mjs`, `typescript/{base,node,library,react-library,nextjs}.json`, `package.json` (exports map).

### docs/
Specs (source of truth): `sajawat-prd.md`, `-system-architecture.md`, `-database-design.md`, `-api-design.md`, `-security-design.md`, `-phase-0-foundation.md`, `-folder-structure.md`, `-coding-standards.md`, `-testing-strategy.md`, `-deployment-plan.md`, `-roadmap.md`, plus brand/business/admin/crm/ui-ux specs. **Handoff docs:** `sajawat-project-state.md` (this), `sajawat-current-architecture.md`, `sajawat-open-debt.md`.

### scripts/
- `.gitkeep` (dev/seed scripts — to be populated).

### tests/
- `e2e/`, `integration/`, `performance/` (`.gitkeep`; Playwright/Vitest/Supertest in 0.9).

### infrastructure/
- `docker/`, `deployment/`, `monitoring/`, `backups/`, `scripts/` (`.gitkeep`; Docker in 0.8, CI deploy in 0.10).

### Root
`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.json` (solution), `eslint.config.mjs`, `prettier.config.js`, `commitlint.config.cjs`, `.lintstagedrc.json`, `.npmrc`, `.nvmrc`, `.gitignore`, `.prettierignore`, `.env.example`, `README.md`, `CLAUDE.md`, `.husky/{pre-commit,commit-msg}`.

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
| **Planned (0.5):** | | |
| Mongoose | ^8 | MongoDB Atlas connection |

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

The next milestone to implement is 0.5 (MongoDB Atlas connection + DB health
check) unless told otherwise. 0.4 (API foundation) is complete — reuse its
error hierarchy, logger, env config, and health route. Plan 0.5 before coding.
```
