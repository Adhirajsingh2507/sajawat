# SAJAWAT — CURRENT ARCHITECTURE SNAPSHOT

> Living document. Records the architecture **as actually implemented** through
> the latest completed milestone. The aspirational/target specs remain in
> `sajawat-system-architecture.md`; this file is the ground truth of what exists.

- **As of commit:** `6df12ff`
- **Latest completed milestone:** 0.3 (ESLint flat config)
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
| Backend | **Express 5** (planned 0.4) | Native async error propagation; ESM-friendly | ⏳ Planned 0.4 |
| Logging | **pino + pino-http** (planned 0.4) | Fast, JSON-native (Cloud Run), redaction | ⏳ Planned 0.4 |
| Frontend | **Next.js 16** (App Router) | SSR/SSG for SEO, server components | ✅ Scaffolded |
| UI runtime | **React 19** | Latest stable | ✅ Scaffolded |
| Styling | **Tailwind CSS v4** | Utility-first, CSS-first config | ✅ Scaffolded |
| Package strategy | **AD-1 role-based** (see §2) | Right tool per consumer type | ✅ Implemented |
| Type sharing | **TypeScript project references** (composite for `shared`) | Incremental, ordered builds | ✅ Implemented |
| Workspace deps | **`workspace:*`** + package `exports` (no tsconfig `paths`) | Single source of truth for resolution | ✅ Implemented |
| Linting | **Single root ESLint flat config**, zero-warning policy | One source of truth; lint-staged ↔ turbo parity | ✅ Implemented |
| Commits | **Conventional Commits** via commitlint + Husky | Enforced hygiene | ✅ Implemented |
| Validation | **Zod** (request + env), `req.validatedData` (planned 0.4) | Runtime + compile-time safety | ⏳ Planned 0.4 |
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
- **Enforced rules:** `eslint:recommended`, `typescript-eslint:recommended` (incl. `no-explicit-any`), `consistent-type-imports`, **CJS-interop ban** (no named imports from `express`/`mongoose`), `no-unused-vars` (`^_` escape), React hooks as errors.
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
Realized today: web + admin scaffolds build & run; `services/api` is a typed ESM skeleton (Express app lands in 0.4; MongoDB in 0.5).

---

## 7. Toolchain Provisioning Caveat

- **CI/Docker (Node 22):** Corepack enables pnpm 9.15.0 the documented way.
- **This local machine (Node 25):** Corepack's bundled shim is incompatible with Node 25 (`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`); pnpm 9.15.0 was installed via an npm user-prefix instead. `engine-strict=false` so installs run on Node 25. The Node 22 contract is enforced in CI/Docker, advisory locally.
