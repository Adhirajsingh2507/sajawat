#!/usr/bin/env bash
# 0.10b.1 — Step 04: service accounts + least-privilege IAM.
#
# Creates:
#   - 3 runtime SAs (api/web/admin). Only api-run can read secrets.
#   - 1 deployer SA (GitHub Actions, keyless via WIF in step 05).
# Binds:
#   - api-run     -> roles/secretmanager.secretAccessor on each secret (scoped).
#   - deployer    -> roles/artifactregistry.writer on the AR repo (scoped, not project).
#   - deployer    -> roles/run.admin at project level (deploy + manage traffic for rollback).
#   - deployer    -> roles/iam.serviceAccountUser on each runtime SA (deploy "as" them).
# All bindings are idempotent (add-iam-policy-binding). Create/bind only.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

gcp::load_config "${1:-}"
gcp::require_cmd gcloud
gcp::require_auth

create_sa() {
  local sa_id="$1" display="$2" email
  email="$(gcp::sa_email "$sa_id")"
  if gcloud iam service-accounts describe "$email" --project="$GCP_PROJECT_ID" >/dev/null 2>&1; then
    gcp::ok "Service account exists: $email"
  else
    gcp::log "Creating service account: $sa_id"
    gcp::run gcloud iam service-accounts create "$sa_id" \
      --display-name="$display" --project="$GCP_PROJECT_ID"
    gcp::ok "Created $email"
  fi
}

# --- service accounts ------------------------------------------------------
create_sa "$API_RUNTIME_SA"   "Sajawat API (Cloud Run runtime)"
create_sa "$WEB_RUNTIME_SA"   "Sajawat Web (Cloud Run runtime)"
create_sa "$ADMIN_RUNTIME_SA" "Sajawat Admin (Cloud Run runtime)"
create_sa "$DEPLOYER_SA"      "Sajawat deployer (GitHub Actions, WIF)"

api_email="$(gcp::sa_email "$API_RUNTIME_SA")"
deployer_email="$(gcp::sa_email "$DEPLOYER_SA")"

# --- api-run: secret access (scoped to each secret) ------------------------
gcp::log "Granting secretAccessor to $api_email on ${#SECRETS[@]} secrets"
for s in "${SECRETS[@]}"; do
  gcp::run gcloud secrets add-iam-policy-binding "$s" \
    --project="$GCP_PROJECT_ID" \
    --member="serviceAccount:${api_email}" \
    --role="roles/secretmanager.secretAccessor" \
    --condition=None >/dev/null
done
gcp::ok "api-run can read secrets; web-run / admin-run cannot (no binding)"

# --- deployer: Artifact Registry writer (repo-scoped) ----------------------
gcp::log "Granting artifactregistry.writer to deployer on repo $AR_REPO"
gcp::run gcloud artifacts repositories add-iam-policy-binding "$AR_REPO" \
  --location="$GCP_REGION" \
  --project="$GCP_PROJECT_ID" \
  --member="serviceAccount:${deployer_email}" \
  --role="roles/artifactregistry.writer" \
  --condition=None >/dev/null

# --- deployer: Cloud Run admin (project-level; needed for deploy + traffic) -
gcp::log "Granting run.admin to deployer (project-level)"
gcp::run gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
  --member="serviceAccount:${deployer_email}" \
  --role="roles/run.admin" \
  --condition=None >/dev/null

# --- deployer: actAs each runtime SA (scoped to the SA resource) -----------
gcp::log "Granting iam.serviceAccountUser to deployer on each runtime SA"
for rt in "$API_RUNTIME_SA" "$WEB_RUNTIME_SA" "$ADMIN_RUNTIME_SA"; do
  rt_email="$(gcp::sa_email "$rt")"
  gcp::run gcloud iam service-accounts add-iam-policy-binding "$rt_email" \
    --project="$GCP_PROJECT_ID" \
    --member="serviceAccount:${deployer_email}" \
    --role="roles/iam.serviceAccountUser" \
    --condition=None >/dev/null
done

gcp::ok "Service accounts + IAM bindings applied on $GCP_PROJECT_ID"
