# SAJAWAT — OPEN TECHNICAL DEBT REGISTER

> Single source of truth for known, accepted debt and deferred work. Updated at
> every milestone. "Open" = not yet resolved. Resolved items move to the bottom.

- **As of commit:** `6df12ff` (Milestone 0.3 complete)

## Open Debt

| ID | Severity | Description | Planned Resolution | Milestone |
|----|----------|-------------|--------------------|-----------|
| D1 | Medium | `engine-strict=false` in `.npmrc` — the Node 22 LTS contract is advisory locally (needed so installs run on this box's Node 25). | Enforce Node 22 in CI matrix + Docker base; reconsider re-enabling strict once CI pins the runtime. | 0.10 |
| D3 | Low | Local pnpm installed via npm user-prefix, not Corepack (Corepack's shim is broken on Node 25). Local provisioning diverges from the documented Corepack-on-Node-22 path. | Documented; CI/Docker use Corepack on Node 22. No code change needed. | — (doc-only) |
| D4 | Low | Next.js starter boilerplate still present in both apps (`page.tsx`, `globals.css`, `public/*.svg`, app `README.md`). | Replace when Phase 1 customer/admin UI begins. | Phase 1 |
| D5 | Low | `.prettierignore` excludes **all** `**/*.md` (protects hand-formatted specs but means Markdown is never format-enforced). | Optionally narrow to `docs/` + root specs so other Markdown stays formatted. | optional |
| D6 | Low | Non-type-aware ESLint (used `typescript-eslint:recommended`, not `recommended-type-checked`, to avoid per-config `parserOptions.project`). Type-aware rules (`no-floating-promises`, `no-misused-promises`) are off — relevant for the async-heavy API. | Add an optional type-checked ESLint layer. | 0.4+ |
| D7 | Low | `@sajawat/config` is lint-exempt (echo stub) — config-only package, no lintable TS sources. | Accepted exemption; revisit only if TS is added there. | — (accepted) |
| D8 | Low | Remaining placeholder `echo … exit 0` scripts: `dev`/`test` (api), `test` (web/admin), `lint`/`typecheck` (config). | Replace as each capability lands. | 0.4 / 0.9 |
| D9 | Low | No git tags / release versioning yet. | Adopt tagging strategy (see project-state §Git Snapshot). | 0.10 |

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

## Notes on Issues Found & Fixed In-Flight (not carried as debt)

- **0.3:** Next 16 removed the `eslint` NextConfig key and build-time linting → removed the invalid `ignoreDuringBuilds` addition.
- **0.3:** Flat-config emits a "File ignored" warning when lint-staged passes ignored config files → added `--no-warn-ignored`.
