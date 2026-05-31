# SAJAWAT — CURRENT ARCHITECTURE SNAPSHOT

> Living document. Records the architecture **as actually implemented** through
> the latest completed milestone. The aspirational/target specs remain in
> `sajawat-system-architecture.md`; this file is the ground truth of what exists.

- **As of:** Milestone 0.4.1 complete (API foundation + security hardening)
- **Latest completed milestone:** 0.4.1 (helmet + cors + rate limiting)
- **Phase:** 0 — Foundation (infrastructure only; no business features)

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
Realized today: web + admin scaffolds build & run; **`services/api` is a running Express 5 server** (`/health`, `/api/v1/health`) with structured logging, request IDs, env validation, error hierarchy, and a Zod validation middleware. MongoDB connectivity + DB readiness land in 0.5.

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

## 8. Toolchain Provisioning Caveat

- **CI/Docker (Node 22):** Corepack enables pnpm 9.15.0 the documented way.
- **This local machine (Node 25):** Corepack's bundled shim is incompatible with Node 25 (`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`); pnpm 9.15.0 was installed via an npm user-prefix instead. `engine-strict=false` so installs run on Node 25. The Node 22 contract is enforced in CI/Docker, advisory locally.
