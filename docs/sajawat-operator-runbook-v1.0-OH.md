# SAJAWAT — OPERATOR RUNBOOK: v1.0 Operational Hardening (1.0-OH)

> **Purpose.** Activate the three operator-gated items that gate the **`v1.0.0`**
> Phase-1 release: **D16** (production CD + rollback), **D18** (Razorpay live
> payments), **D19** (WhatsApp B2B lead alerts). Each section is self-contained:
> preconditions → steps → verification drill → abort/rollback → closure criteria.
>
> **Audience.** A human operator with: GCP Owner/Editor on the Sajawat projects,
> GitHub admin on `Adhirajsingh2507/sajawat`, the Razorpay dashboard, and the
> Meta WhatsApp Business / Cloud API console.
>
> **Why a human runs this.** Claude/CI cannot authenticate to GCP, cannot mint
> live API keys, and cannot click dashboard consent screens. Every step that
> touches a secret value is deliberately operator-only; secrets go in via
> **stdin**, never argv, never git, never CI logs.
>
> **Status legend:** ☐ todo · ☑ done. Update inline as you go.
>
> **Cross-references:** open debt = `docs/sajawat-open-debt.md`; provisioning =
> `infrastructure/scripts/gcp/`; deploy workflows = `.github/workflows/`.

---

## 0. Pre-flight (do once, before any section)

☐ **0.1 — Confirm the production project id.** Edit
`infrastructure/scripts/gcp/config.production.sh` and set `GCP_PROJECT_ID` to the
real, globally-unique id (default `sajawat-production`; pick another if taken).
Project ids are immutable — get this right first.

☐ **0.2 — Authenticate locally.**
```bash
gcloud auth login
gcloud auth application-default login
```

☐ **0.3 — Pick the tooling baseline.** `gcloud` ≥ 0.10 era, `jq`, `curl`,
`openssl`, `docker` available locally.

☑ **0.4 — Secret wiring for D18/D19 — ALREADY DONE IN CODE (no operator edit).**
The Razorpay/WhatsApp secrets are now wired into provisioning + both deploy
workflows. You do **not** edit any YAML or script. What's in place:

1. **`config.{staging,production}.sh`** `SECRETS` array now includes
   `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `WHATSAPP_ACCESS_TOKEN`, so
   `03-secrets.sh` creates their (empty) containers and `04-service-accounts.sh`
   grants the `api-run` SA `secretAccessor` on them automatically.
   (`RAZORPAY_KEY_ID` / `WHATSAPP_PHONE_NUMBER_ID` are **not secret** — plain env
   vars, set as Environment variables in §A.4.)

2. **`deploy-{staging,production}.yml`** build the `--set-secrets` /
   `--set-env-vars` bindings **conditionally**: an optional secret is bound only
   when it already has an **enabled version**, and a non-secret id only when its
   Environment variable is set. So:
   - **Before** you inject keys → bindings are omitted → the app deploys cleanly
     in its dormant default (online checkout **501**, WhatsApp **skip-and-log**).
   - **After** you inject a value + redeploy → the binding appears automatically.

   This is why D18/D19 below are just *"inject value → redeploy"* with no code
   step. The dormant fallback means a half-configured state never breaks a deploy.

> **The whole runbook is COD-safe.** COD checkout and lead capture work with zero
> keys. D18/D19 only light up *online payments* and *the WhatsApp alert*; remove a
> binding (delete the secret version / unset the var) and the app falls straight
> back to 501 / skip-and-log with no data loss.

---

## A. D16 — Production CD + rollback drill

**Goal:** one gated `v*` deploy promotes the staging-proven image to a
production Cloud Run service, and one rollback drill proves AD-57.
**Staging side is already green** (per open-debt D16); this is the production half.

### A.1 — Provision the production GCP project
```bash
cd infrastructure/scripts/gcp
./provision.sh production      # runs 00→05 idempotently (project, APIs, AR, SAs, WIF)
./verify.sh production         # must print all-green
```
☐ provision green ☐ verify green

### A.2 — Inject the three core prod secrets (ROTATED values, stdin only)
Never reuse staging values for prod. Generate fresh JWT secrets:
```bash
openssl rand -base64 48     # run twice → distinct JWT_ACCESS_SECRET / JWT_REFRESH_SECRET (≥32 chars, must differ)
```
```bash
printf '%s' "$MONGODB_URI"        | gcloud secrets versions add MONGODB_URI        --project=PROD --data-file=-
printf '%s' "$JWT_ACCESS_SECRET"  | gcloud secrets versions add JWT_ACCESS_SECRET  --project=PROD --data-file=-
printf '%s' "$JWT_REFRESH_SECRET" | gcloud secrets versions add JWT_REFRESH_SECRET --project=PROD --data-file=-
```
(`PROD` = your `GCP_PROJECT_ID`. Use a **prod** Atlas user/cluster, not staging.)
☐ all three versions added

### A.3 — Cross-project image read grant (AD-56)
Production promotes by **copying the staging digest** — so the **production**
deployer SA needs read on the **staging** Artifact Registry repo:
```bash
gcloud artifacts repositories add-iam-policy-binding sajawat \
  --location=asia-south1 --project=STAGING_PROJECT_ID \
  --member="serviceAccount:sajawat-deployer@PROD_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.reader"
```
☐ binding added

### A.4 — Create the `production` GitHub Environment + variables
GitHub → repo → Settings → Environments → **New environment** `production`.
- ☐ **Add a Required reviewer** (yourself / release owner) — this is the human
  approval gate *and* the identity claim the prod WIF binding requires.
- ☐ Add these **Environment variables** (Settings → Environments → production →
  Environment variables). Names are exactly what `deploy-production.yml` reads:

  | Variable | Value (example / source) |
  |---|---|
  | `GCP_WIF_PROVIDER` | full WIF provider resource (from `verify.sh production`) |
  | `GCP_DEPLOYER_SA` | `sajawat-deployer@PROD.iam.gserviceaccount.com` |
  | `GCP_REGION` | `asia-south1` |
  | `GCP_PROJECT_ID` | your prod project id |
  | `GCP_AR_IMAGE_PREFIX` | `asia-south1-docker.pkg.dev/PROD/sajawat` |
  | `STAGING_AR_IMAGE_PREFIX` | `asia-south1-docker.pkg.dev/STAGING/sajawat` |
  | `API_SERVICE` | `sajawat-api` |
  | `API_RUNTIME_SA` | `sajawat-api-run@PROD.iam.gserviceaccount.com` |
  | `APP_JWT_ISSUER` | `sajawat-api` |
  | `APP_JWT_AUDIENCE` | `sajawat-clients` |
  | `APP_CORS_ORIGINS` | prod web+admin origins (NO localhost — boot guard rejects it) |
  | `APP_API_BASE_URL` | prod API URL (NO localhost) |

  *(If you completed §0.4, also add `APP_RAZORPAY_KEY_ID` and
  `APP_WHATSAPP_PHONE_NUMBER_ID` here.)*

> ⚠ `config/env.ts` refuses to boot in `NODE_ENV=production` with a localhost
> `API_BASE_URL` or localhost in `CORS_ORIGINS` (AD-14). Set real hostnames.

### A.5 — Ensure the tagged commit is staging-built
Production **promotes**, never rebuilds (AD-56). The tag must point at a commit
that `deploy-staging.yml` already built+pushed as `api:<sha>` in the staging repo.
☐ Confirm the target commit is on `develop` and its staging deploy succeeded.

### A.6 — Cut the release tag → triggers production deploy
```bash
git checkout develop && git pull
git tag -a v1.0.0 -m "Sajawat v1.0.0 — Phase 1 GA"
git push origin v1.0.0
```
The `Deploy (production)` workflow starts, runs the quality gate, then **pauses on
the required-reviewer gate**.
☐ tag pushed ☐ workflow reached the approval pause

### A.7 — Approve + watch the deploy
GitHub → Actions → the run → **Review deployments** → Approve.
Watch: resolve staging digest → copy to prod AR → deploy `--no-traffic
--tag=candidate` → readiness gate on the candidate URL → shift 100% → post-shift
validation on the live URL.
☐ workflow succeeded ☐ note the live URL printed at the end

### A.8 — Verify production is live
```bash
curl -s -o /dev/null -w '%{http_code}\n' https://PROD_API_URL/health          # liveness → 200
curl -s -o /dev/null -w '%{http_code}\n' https://PROD_API_URL/api/v1/health   # readiness → 200 (Atlas connected)
```
☐ both 200

### A.9 — ROLLBACK DRILL (proves AD-57) — required for D16 closure
You must demonstrate automated rollback *to a previous revision*, so do this on
the **second** prod deploy (a first deploy has nothing to roll back to).
1. Ensure A.6–A.8 already produced one healthy revision (the rollback target).
2. Force a post-shift failure on a new deploy. Safest method: temporarily point
   `MONGODB_URI` at an unreachable value so readiness returns 503 *after* the
   traffic shift, e.g. add a throwaway bad version:
   ```bash
   printf '%s' "mongodb+srv://bad:bad@nonexistent.invalid/db" \
     | gcloud secrets versions add MONGODB_URI --project=PROD --data-file=-
   ```
3. Re-deploy the same tag via **workflow_dispatch** (Actions → Deploy
   (production) → Run workflow → enter `v1.0.0`). Approve the gate.
4. **Expected:** candidate readiness may still pass on cache, traffic shifts,
   **post-shift validation fails**, and the *Automated rollback* step shifts
   traffic back to the prior revision and re-asserts health (200). The workflow
   ends with a `::warning::` "automatically rolled back".
5. **Restore** the good secret immediately:
   ```bash
   printf '%s' "$REAL_MONGODB_URI" | gcloud secrets versions add MONGODB_URI --project=PROD --data-file=-
   ```
   Then re-dispatch `v1.0.0` to land a clean, healthy revision.
☐ rollback observed ☐ good secret restored ☐ clean revision serving

### A.10 — Close D16
Mark in `docs/sajawat-open-debt.md` closure criteria (3)(5)(7)(8) done:
(3) cross-project reader grant ☑ · (5) production Environment + reviewer ☑ ·
(7) one gated prod deploy ☑ · (8) rollback drill ☑. Strike D23-style.

---

## B. D18 — Razorpay live online payments

**Precondition:** §0.4 applied + the new secret containers exist (run
`./03-secrets.sh staging` and/or `production` after extending `SECRETS`).
Online checkout currently returns **501** with keys absent; COD is unaffected.

### B.1 — Get live credentials (Razorpay dashboard)
- ☐ Activate the account; switch to **Live Mode**.
- ☐ Settings → API Keys → **Generate Live Key** → capture `key_id` + `key_secret`
  (secret shown once).
- ☐ Decide a **webhook secret** (a strong random string you control).

### B.2 — Inject the secrets (stdin) + non-secret key id
```bash
printf '%s' "$RAZORPAY_KEY_SECRET"     | gcloud secrets versions add RAZORPAY_KEY_SECRET     --project=PROD --data-file=-
printf '%s' "$RAZORPAY_WEBHOOK_SECRET" | gcloud secrets versions add RAZORPAY_WEBHOOK_SECRET --project=PROD --data-file=-
```
- ☐ Set `APP_RAZORPAY_KEY_ID` GitHub Environment variable to the live `key_id`
  (it's embedded in the frontend, so it's not secret).

### B.3 — Register the webhook (Razorpay dashboard)
- ☐ Settings → Webhooks → **Add** → URL = `https://PROD_API_URL/api/v1/webhooks/razorpay`.
- ☐ Set the **secret** to the exact `RAZORPAY_WEBHOOK_SECRET` from B.2.
- ☐ Subscribe to at least `payment.captured` (+ `payment.failed`).

### B.4 — Redeploy so the service picks up the new bindings
Re-dispatch the production deploy (Actions → Deploy (production) → `v1.0.0`), or
push a new tag. The new revision now has the Razorpay secrets + `RAZORPAY_KEY_ID`.
☐ redeployed ☐ healthy

### B.5 — Live end-to-end drill
- ☐ As a real customer on the prod storefront, place a **small live order** via
  online payment (e.g. ₹1 SKU if you have one, else the smallest).
- ☐ Confirm Razorpay charges, the success callback verifies HMAC, and the order
  moves to paid.
- ☐ Confirm the **webhook** fires: order remains consistent if you replay /
  arrives even if the browser closes (idempotent). Check the Razorpay dashboard
  webhook delivery log = 2xx.
- ☐ **Refund** the test charge from the Razorpay dashboard.
☐ payment captured ☐ webhook 2xx + order consistent ☐ test refunded

### B.6 — Close D18
Strike D18 in `docs/sajawat-open-debt.md` with the live-drill date and the
note that COD remained the fallback throughout.

---

## C. D19 — WhatsApp B2B lead alerts

**Precondition:** §0.4 applied + `WHATSAPP_ACCESS_TOKEN` container exists.
With keys absent, a B2B enquiry is **still persisted**; only the alert is skipped.

### C.1 — Get Cloud API credentials (Meta)
- ☐ Meta Business → WhatsApp → API setup: capture the **Phone Number ID** and a
  **permanent Access Token** (system-user token; the 24h temp token will expire).
- ☐ Note the Graph API version if you want to override the default `v21.0`
  (`WHATSAPP_API_VERSION` plain env var).

### C.2 — Inject token + non-secret ids
```bash
printf '%s' "$WHATSAPP_ACCESS_TOKEN" | gcloud secrets versions add WHATSAPP_ACCESS_TOKEN --project=PROD --data-file=-
```
- ☐ Set `APP_WHATSAPP_PHONE_NUMBER_ID` GitHub Environment variable.

### C.3 — Set the recipient admin number (app settings, NOT env)
The alert target lives in business settings, not in env. As a super-admin:
- ☐ Admin console → Settings → set **Admin WhatsApp number** in E.164 form
  (e.g. `+9198…`). Empty = alerts skipped even with keys present.

### C.4 — Redeploy to pick up the binding
☐ re-dispatch prod deploy ☐ healthy

### C.5 — Live lead-alert drill
- ☐ As a logged-in customer, submit a **wholesale enquiry**
  (`POST /api/v1/enquiries` via the B2B form).
- ☐ Confirm the lead persists in the CRM (admin console).
- ☐ Confirm the **WhatsApp message arrives** at the admin number within seconds.
- ☐ Negative check: clear the admin number → submit again → lead still persists,
  no message, log shows the skip branch. Restore the number.
☐ message received ☐ lead persisted both times

### C.6 — Close D19
Strike D19 in `docs/sajawat-open-debt.md` with the drill date. Consider the
Phase-2 follow-up (move the send off the request path onto a queue).

---

## D. Tag the release / finish

Once **D16, D18, D19** are struck and **D20** is already closed (env-driven
`trust proxy`, shipped):
- ☐ Confirm `docs/sajawat-open-debt.md` shows no open **Medium** items.
- ☐ The `v1.0.0` tag from A.6 is the GA release. If you cut it before D18/D19
  drills, that's fine — they're live-config activations, not code in the image;
  no re-tag needed. If §0.4 code changes landed *after* `v1.0.0`, cut `v1.0.1`
  so the deployed image actually contains the Razorpay/WhatsApp secret wiring.
- ☐ Announce GA.

---

## Quick abort / safety notes

- **Any prod deploy that fails readiness** never shifts traffic — the prior
  revision keeps serving; no action needed beyond reading the logs.
- **Any prod deploy that fails *post-shift*** auto-rolls-back to the previous
  revision (AD-57). The bad candidate is left un-trafficked for post-mortem.
- **Secrets** are versioned: a bad value is fixed by adding a new `:latest`
  version and redeploying; old versions can be disabled, never logged.
- **COD + lead capture keep working** through all of D18/D19 — these activations
  are strictly additive; if a live key misbehaves, remove the binding and the
  code falls back to 501 (payments) / skip-and-log (WhatsApp) without data loss.
```
