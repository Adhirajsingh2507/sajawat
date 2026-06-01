# SAJAWAT — ENVIRONMENT GUIDE

> How configuration and secrets flow through the platform across development,
> staging, and production. Introduced in **Milestone 0.6** (per-environment
> configuration strategy). The Zod schema in `services/api/src/config/env.ts` is
> the **authoritative source of truth** for the API's variable shape; the
> `.env.example` templates mirror it for humans.

---

## 1. Principles

- **Fail-fast:** invalid/missing required config crashes the process at boot with
  a readable stderr report (never a murky runtime error later).
- **No secrets in git:** only `*.example` templates are committed. A pre-commit
  guard (`scripts/check-staged-secrets.sh`) blocks any staged real `.env*` file.
- **Platform owns cloud config:** in staging/production there are **no `.env`
  files** — Cloud Run injects environment variables, with secrets sourced from
  **Google Secret Manager**.
- **Two runtimes, two loaders:** the API (Node) uses native `--env-file`; the
  Next.js apps use Next's own env loading. Don't cross the streams.

---

## 2. The two loading mechanisms

### 2.1 API — `services/api` (Node-native, no dotenv dependency)

Node 22's `--env-file` is used directly (AD-11). Multiple files layer, and the
precedence — **confirmed empirically** — is:

```
low  ─────────────────────────────────────────────────────────►  high
 .env.<NODE_ENV>        .env                      process.env
 (canonical per-env)    (optional local override) (platform / Secret Manager)
```

- A **later** `--env-file` overrides an **earlier** one → so `.env` (loaded last)
  overrides `.env.<NODE_ENV>`.
- A variable **already present in `process.env`** is **never** overridden by any
  `--env-file` → so Cloud Run / Secret Manager always wins.

Wired in `services/api/package.json`:

| Script | Loads (low → high) | Use |
|--------|--------------------|-----|
| `dev`   | `.env.development` → `.env` | local development (tsx watch) |
| `start` | `.env.production` → `.env`  | prod-sim locally; in cloud both files are absent and platform env is used |

`--env-file-if-exists` is used so a missing file is a no-op (exactly the cloud
case). `.env` is an **optional** personal override layer — commit nothing.

### 2.2 Frontend — `apps/web`, `apps/admin` (Next.js native)

Next.js loads env files itself; do **not** add `--env-file` to Next scripts.
Order (low → high): `.env` → `.env.<NODE_ENV>` → `.env.local`. Copy each app's
`.env.example` to `.env.local` for development.

- **`NEXT_PUBLIC_` prefix → shipped to the browser.** Only ever non-secret
  values (public API base URL, GA/Pixel measurement IDs).
- Server-only values stay **unprefixed** and are read in server components / route
  handlers only.

---

## 3. Environment matrix

| Env (`NODE_ENV`) | API config source | Frontend config source | Secrets |
|------------------|-------------------|------------------------|---------|
| `development` | `.env.development` (+ optional `.env`) | per-app `.env.local` | local dev creds in gitignored files |
| `test` (0.9) | `.env.test` / injected by the test runner | n/a | ephemeral test creds (e.g. mongodb-memory-server) |
| `staging` | Cloud Run env + Secret Manager | Cloud Run env (build-time `NEXT_PUBLIC_*`) | Google Secret Manager |
| `production` | Cloud Run env + Secret Manager | Cloud Run env (build-time `NEXT_PUBLIC_*`) | Google Secret Manager |

> `.env.staging` / `.env.production` only exist locally to *simulate* those modes;
> they are gitignored and never deployed.

---

## 4. Production hardening (AD-14)

When `NODE_ENV==='production'`, `config/env.ts` additionally **refuses to boot**
if development defaults leak through:

- `API_BASE_URL` resolves to `localhost` / `127.0.0.1` / `::1`.
- any `CORS_ORIGINS` entry is a localhost origin.

This catches a dev config accidentally shipped to prod. Failures print a
`[env] Insecure production configuration:` report to stderr and exit 1.

---

## 5. Secret management

Per `sajawat-deployment-plan.md`, all secrets live in **Google Secret Manager**:
database URI, JWT secrets, SMTP, SMS (MSG91), WhatsApp, Google OAuth, analytics
keys. In cloud, each is bound to a Cloud Run environment variable at deploy time
(the binding itself is implemented in **0.8** Docker / **0.10** CI deploy — 0.6
delivers the mapping and conventions only).

Variables tagged `[secret]` in `.env.example` must **never** be committed and, in
cloud, must come from Secret Manager — not from a file baked into an image.

---

## 6. Adding a new environment variable

1. Add it to the Zod schema in `services/api/src/config/env.ts` (required vs
   optional, type, default). The schema is authoritative.
2. Mirror it in the relevant template: `.env.example` (API/root) or a per-app
   `apps/*/.env.example`. Tag it `[secret]` if sensitive.
3. If it's a cloud secret, note it for Secret Manager (0.8/0.10 wiring).
4. Document any non-obvious semantics here.

---

## 7. Quick start (local)

```bash
# API
cp .env.example services/api/.env.development   # then fill in MONGODB_URI etc.
pnpm --filter @sajawat/api dev

# Web / Admin
cp apps/web/.env.example   apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
pnpm --filter @sajawat/web dev      # :3000
pnpm --filter @sajawat/admin dev    # :3001
```

> The API reads its `.env.*` from the `services/api` working directory (that's
> where the `dev`/`start` scripts run). Keep API env files there.
