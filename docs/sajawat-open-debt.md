# SAJAWAT — OPEN TECHNICAL DEBT REGISTER

> Single source of truth for known, accepted debt and deferred work. Updated at
> every milestone. "Open" = not yet resolved. Resolved items move to the bottom.

- **As of commit:** Milestone 0.4.1 complete (API foundation + security hardening)

## Open Debt

| ID | Severity | Description | Planned Resolution | Milestone |
|----|----------|-------------|--------------------|-----------|
| D1 | Medium | `engine-strict=false` in `.npmrc` — the Node 22 LTS contract is advisory locally (needed so installs run on this box's Node 25). | Enforce Node 22 in CI matrix + Docker base; reconsider re-enabling strict once CI pins the runtime. | 0.10 |
| D3 | Low | Local pnpm installed via npm user-prefix, not Corepack (Corepack's shim is broken on Node 25). Local provisioning diverges from the documented Corepack-on-Node-22 path. | Documented; CI/Docker use Corepack on Node 22. No code change needed. | — (doc-only) |
| D4 | Low | Next.js starter boilerplate still present in both apps (`page.tsx`, `globals.css`, `public/*.svg`, app `README.md`). | Replace when Phase 1 customer/admin UI begins. | Phase 1 |
| D5 | Low | `.prettierignore` excludes **all** `**/*.md` (protects hand-formatted specs but means Markdown is never format-enforced). | Optionally narrow to `docs/` + root specs so other Markdown stays formatted. | optional |
| D7 | Low | `@sajawat/config` is lint-exempt (echo stub) — config-only package, no lintable TS sources. | Accepted exemption; revisit only if TS is added there. | — (accepted) |
| D8 | Low | Remaining placeholder `echo … exit 0` scripts: `test` (api/web/admin), `lint`/`typecheck` (config). (api `dev` resolved in 0.4 → real `tsx watch`.) | Replace as each capability lands. | 0.9 |
| D9 | Low | No git tags / release versioning yet. | Adopt tagging strategy (see project-state §Git Snapshot). | 0.10 |
| D10 | Low | `services/api` `dist/` build output exists locally but is git-ignored; the API is consumed only by its own runtime (not by another workspace), so no project-reference/build-order coupling yet. | None needed; revisit if another workspace imports `@sajawat/api`. | — (accepted) |
| D11 | Medium | No CSRF protection yet (`sajawat-security-design.md:248` mandates it). Short-term mitigations: planned token-in-`Authorization`-header auth (not cookie sessions) + strict CORS allow-list (0.4.1). Becomes load-bearing if/when cookie-based sessions are used. | Implement alongside the auth foundation (CSRF tokens / double-submit, or confirm header-token model removes the need). | 0.7 |
| D12 | Low | helmet **CSP disabled** (`contentSecurityPolicy: false`) — acceptable for a JSON API, but the security headers picture is incomplete until the Next.js apps ship their own CSP. | Define CSP in `apps/web` / `apps/admin` at Phase 1 UI. | Phase 1 |

## Resolved Debt (history)

| ID | Resolved in | Description | How resolved |
|----|-------------|-------------|--------------|
| R1 | 0.2 | Cross-package consumption strategy was unsolved (raw `./src/index.ts` main, no transpile/build plan). | AD-1 role-based strategy: `shared` compiled, `ui`/`types` source + `transpilePackages`. |
| R2 | 0.2 | "Fake-green" typecheck — 5 packages echoed `exit 0`. | Real `tsc` in all TS packages; project references. |
| — | 0.2 | Missing Husky pre-commit gate. | Husky v9 `pre-commit` + `commit-msg`. |
| — | 0.2 | Missing root `README.md`. | Comprehensive root README created. |
| — | 0.2 | Missing mandated top-level dirs (`scripts/`, `tests/`, `infrastructure/`). | Created with documented sub-structure. |
| — | 0.2 | Five Turbo "no output files" warnings. | Removed build stubs from non-emitting packages. |
| D2 | 0.3 (partial) | lint-staged ESLint gap (couldn't resolve root eslint) + per-package "lint configured in 0.3" stubs. | Single root flat config + root `eslint` devDep; ESLint re-enabled in lint-staged with `--no-warn-ignored`. (Residual stubs tracked as D8.) |
| D6 | 0.4 | Non-type-aware ESLint — type-aware rules (`no-floating-promises`, `no-misused-promises`) were off, relevant for the async-heavy API. | Added `@sajawat/config/eslint/type-checked` (`recommendedTypeChecked` + the two promise rules) scoped to `services/api/**` via `projectService` (no per-config `parserOptions.project` needed). Refined the Express/Mongoose CJS-interop selector to exclude type-only imports so `import type { Request }` is allowed. |

## Notes on Issues Found & Fixed In-Flight (not carried as debt)

- **0.3:** Next 16 removed the `eslint` NextConfig key and build-time linting → removed the invalid `ignoreDuringBuilds` addition.
- **0.3:** Flat-config emits a "File ignored" warning when lint-staged passes ignored config files → added `--no-warn-ignored`.
- **0.4:** `pino-http` default import is not callable under NodeNext → switched to the named import `import { pinoHttp } from 'pino-http'`.
- **0.4:** `tsc` could not name the inferred `Router` type portably (TS2742) → added an explicit `Router` type annotation (`import type { Router } from 'express'`).
- **0.4:** body-parser errors (malformed JSON, oversized body) initially surfaced as masked `500`s → the global handler now maps exposed `http-errors` 4xx (`expose === true`) to the correct status/code (verified: `400 BAD_REQUEST`, `413 PAYLOAD_TOO_LARGE`).
- **0.4.1:** helmet/cors/rate-limit were missing from the 0.4 scope and were not initially recorded as deferred (reporting gap). Closed by the 0.4.1 hardening patch; residual security work (CSP, CSRF) is now explicitly tracked as D11/D12. The `globalRateLimiter` skip list covers both `/health` and `/api/v1/health` so probes are never throttled.
