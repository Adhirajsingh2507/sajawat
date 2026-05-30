# Sajawat Jewellery

Production-grade, luxury jewelry e-commerce platform — a B2C storefront, B2B
wholesale lead engine, and CRM-enabled admin platform. Built as a Turborepo
monorepo. Initial scale ~200–300 SKUs, designed to grow to the stability tier.

> Specifications in [`docs/`](./docs) are the source of truth. Engineering
> conventions live in [`CLAUDE.md`](./CLAUDE.md) and
> [`docs/sajawat-coding-standards.md`](./docs/sajawat-coding-standards.md).

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 |
| Backend | Node.js · Express · TypeScript |
| Database | MongoDB Atlas · Mongoose |
| Infra | Google Cloud Run · Cloud Storage · Secret Manager · Cloudflare |
| Payments | Razorpay (behind a `PaymentProvider` abstraction) |
| Messaging | MSG91 (SMS) · WhatsApp Business API (Meta) |
| Tooling | Turborepo · pnpm · ESLint · Prettier · Husky · Vitest · Playwright |

## Prerequisites

- **Node.js 22 LTS** (see [`.nvmrc`](./.nvmrc); run `nvm use`)
- **pnpm 9.15.0** (pinned via `packageManager`; `corepack enable` on Node 22)

## Getting Started

```bash
pnpm install            # install all workspace dependencies
cp .env.example .env.development   # then fill in values (never commit secrets)
pnpm dev                # run all apps/services in dev
```

| App | URL |
| --- | --- |
| Customer web (`@sajawat/web`) | http://localhost:3000 |
| Admin panel (`@sajawat/admin`) | http://localhost:3001 |
| API (`@sajawat/api`) | http://localhost:4000 (from Milestone 0.4) |

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run all workspaces in dev mode (Turbo) |
| `pnpm build` | Build all workspaces |
| `pnpm lint` | Lint all workspaces |
| `pnpm typecheck` | Type-check all workspaces |
| `pnpm test` | Run all test suites |
| `pnpm format` | Format the repo with Prettier |
| `pnpm format:check` | Verify formatting |

## Repository Structure

```
apps/
  web/        Customer website (Next.js)            @sajawat/web
  admin/      Admin panel (Next.js, port 3001)      @sajawat/admin
services/
  api/        Express API (Controller→Service→Repo) @sajawat/api
packages/
  ui/         Shared React components (source/TSX)  @sajawat/ui
  types/      Shared TypeScript types (type-only)   @sajawat/types
  shared/     Shared runtime utils / Zod (compiled) @sajawat/shared
  config/     Shared ESLint / TS / Prettier configs @sajawat/config
docs/             Specifications (source of truth)
scripts/          Dev / seed scripts
tests/            e2e · integration · performance
infrastructure/   docker · deployment · monitoring · backups · scripts
```

## Package Consumption (AD-1, role-based)

A package is **compiled** only if a non-bundler consumer (the Node API) uses it.

| Package | Strategy | Notes |
| --- | --- | --- |
| `@sajawat/types` | source, type-only | imported with `import type`; zero runtime |
| `@sajawat/ui` | source TSX | compiled by Next via `transpilePackages` (apps only) |
| `@sajawat/shared` | compiled to `dist` (ESM + d.ts) | consumed by web, admin, **and** the API |
| `@sajawat/config` | tooling, no build | consumed via `extends` / `exports` |

Cross-package imports use the real package name (`@sajawat/*`) resolved through
pnpm workspaces and each package's `exports` map — **not** tsconfig `paths`.
The only path alias is the per-app internal `@/* → ./src/*`.

## Conventions

- **TypeScript strict** everywhere (see `@sajawat/config/typescript/*`).
- **Commits:** Conventional Commits, `type(scope): description`, enforced by
  commitlint via a Husky `commit-msg` hook.
- **Pre-commit:** `lint-staged` (Prettier; ESLint joins in Milestone 0.3) and a
  full type-check.
- **Branches:** `main` (production), `develop` (active), `feature/*`, `hotfix/*`.

## Documentation

PRD, architecture, database, API, security, testing, and deployment specs live
in [`docs/`](./docs). See `docs/sajawat-phase-0-foundation.md` for the
foundation roadmap.
