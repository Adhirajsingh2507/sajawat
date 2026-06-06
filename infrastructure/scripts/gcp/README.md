# Sajawat GCP Provisioning (Milestone 0.10b.1)

Idempotent, operator-run `gcloud` scripts that stand up the infrastructure the
deploy pipeline (0.10b.2 staging / 0.10b.3 production) needs, in **two separate
projects** with **keyless Workload Identity Federation** — no long-lived SA keys.

> **Scope:** this sub-milestone provisions infrastructure only. It does **not**
> build/push images or deploy to Cloud Run, and it adds **no** GitHub Actions
> workflows. Those land in 0.10b.2 / 0.10b.3.

## What gets created (per project)

| Resource | Name / detail |
|----------|---------------|
| Enabled APIs | run, artifactregistry, secretmanager, iam, iamcredentials, sts, cloudresourcemanager |
| Artifact Registry | Docker repo `sajawat` in `asia-south1` |
| Secret Manager | **empty** containers: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` |
| Runtime SAs | `sajawat-api-run` (reads secrets), `sajawat-web-run`, `sajawat-admin-run` (no secret access) |
| Deployer SA | `sajawat-deployer` — `artifactregistry.writer` (repo), `run.admin` (project), `serviceAccountUser` (runtime SAs only) |
| WIF | pool `github-pool` + OIDC provider `github-oidc`, pinned to `Adhirajsingh2507/sajawat`; deployer bound to the env's GitHub Environment claim |

`JWT_ISSUER` / `JWT_AUDIENCE` are **plain Cloud Run env vars** (set by the deploy
workflow), not Secret Manager secrets.

## Prerequisites

- `gcloud` installed and authenticated: `gcloud auth login`.
- IAM on each project: Owner, or the combination of Project IAM Admin +
  Service Account Admin + Artifact Registry Admin + Secret Manager Admin +
  IAM Workload Identity Pool Admin.
- **Staging** project exists: `sajawat-staging` (project number `1019894285252`).
- **Production** project: create it first (Console, or the guarded
  `00-bootstrap-project.sh`) and set `GCP_PROJECT_ID` in `config.production.sh`.

## Files

```
lib.sh                  shared helpers (logging, auth/cmd guards, config load, WIF math)
config.staging.sh       NON-SECRET identifiers/names for staging   (committed)
config.production.sh    NON-SECRET identifiers/names for production (committed)
00-bootstrap-project.sh OPTIONAL guarded: create project + link billing
01-enable-apis.sh       enable required APIs
02-artifact-registry.sh create the Docker repo
03-secrets.sh           create empty secret containers (+ prints value-injection cmds)
04-service-accounts.sh  create SAs + least-privilege IAM
05-workload-identity.sh WIF pool/provider + env-scoped deployer binding (+ prints GitHub vars)
provision.sh <env>      orchestrator: confirmation + steps 01..05
verify.sh <env>         read-only assertions; exits non-zero on any gap
```

Every script is **idempotent** (describe-or-create; `add-iam-policy-binding` is
inherently idempotent) and **create/bind only** — nothing deletes resources.
Every `gcloud` call passes `--project` explicitly.

## Run order

```bash
cd infrastructure/scripts/gcp

# (production only, if the project doesn't exist yet)
BILLING_ACCOUNT=XXXXXX-XXXXXX-XXXXXX ./00-bootstrap-project.sh production

# provision an environment end to end (asks for confirmation)
./provision.sh staging
./verify.sh    staging

./provision.sh production
./verify.sh    production
```

Run a single step in isolation if needed, e.g. `./05-workload-identity.sh staging`.
To change an existing WIF provider's mapping/condition: `UPDATE_PROVIDER=1 ./05-workload-identity.sh staging`.

## Injecting secret values (out-of-band — never in git or argv)

`03-secrets.sh` creates the secret *containers* only. Add values via **stdin**:

```bash
printf '%s' "$MONGODB_URI"        | gcloud secrets versions add MONGODB_URI \
    --project=sajawat-staging --data-file=-
printf '%s' "$JWT_ACCESS_SECRET"  | gcloud secrets versions add JWT_ACCESS_SECRET \
    --project=sajawat-staging --data-file=-
printf '%s' "$JWT_REFRESH_SECRET" | gcloud secrets versions add JWT_REFRESH_SECRET \
    --project=sajawat-staging --data-file=-
```

Use **rotated** values: a fresh Atlas password and freshly generated JWT secrets
(≥32 chars, `access != refresh`). Generate one with `openssl rand -base64 48`.
(Rotation execution is tracked as the non-blocking Phase-1.0 Operational
Hardening task; these scripts just provide the destination.)

## GitHub values consumed by 0.10b.2 / 0.10b.3

`05-workload-identity.sh` prints, per environment, the **non-secret** values to
record as GitHub repo/Environment **variables** (no GitHub secrets needed — auth
is keyless):

```
GCP_PROJECT_ID      GCP_REGION      GCP_WIF_PROVIDER
GCP_DEPLOYER_SA     GCP_AR_IMAGE_PREFIX
```

The deploy workflows must declare `environment: staging` / `environment: production`
so the OIDC token carries the matching claim the deployer binding requires; the
`production` GitHub Environment must have a **required reviewer**.

### Production promotion (0.10b.3) — extra operator steps

`deploy-production.yml` **promotes the staging digest** into the production
Artifact Registry rather than rebuilding (AD-56). Two additional setup steps:

1. **Cross-project reader grant (deploy-time image READ only).** The *production*
   deployer SA must read the *staging* AR repo to resolve + copy the digest. Grant
   it repo-scoped reader on staging (one-way; no runtime cross-project pulls):

   ```bash
   gcloud artifacts repositories add-iam-policy-binding sajawat \
     --location=asia-south1 --project=sajawat-staging \
     --member="serviceAccount:sajawat-deployer@sajawat-production.iam.gserviceaccount.com" \
     --role=roles/artifactregistry.reader
   ```

2. **Extra `production` Environment variable:** `STAGING_AR_IMAGE_PREFIX` =
   `asia-south1-docker.pkg.dev/sajawat-staging/sajawat` (the promotion source), in
   addition to the standard non-secret vars above plus `API_SERVICE`,
   `API_RUNTIME_SA`, `APP_JWT_ISSUER`, `APP_JWT_AUDIENCE`, `APP_CORS_ORIGINS`,
   `APP_API_BASE_URL`. Also set the Environment's deployment policy to **tags `v*`**.

## Troubleshooting

- *"No active gcloud account"* → `gcloud auth login`.
- *"Could not resolve project number"* → the project doesn't exist yet, or you
  lack access. For production, create it first.
- *Provider already exists but mapping is wrong* → `UPDATE_PROVIDER=1 ./05-...sh <env>`.
- *`verify.sh` reports a missing IAM binding right after provisioning* → IAM is
  eventually consistent; wait a few seconds and re-run `verify.sh`.
