#!/usr/bin/env bash
# 0.10b.1 — Step 05: Workload Identity Federation (keyless GitHub -> GCP).
#
# Creates a WIF pool + OIDC provider for GitHub Actions, pinned to THIS repo, and
# binds the deployer SA so only jobs running in the matching GitHub Environment
# (staging or production) can impersonate it. No SA keys are ever created.
#
# Idempotency note: pool/provider creation is skipped if they already exist. To
# change the attribute mapping/condition on an existing provider, re-run with
# UPDATE_PROVIDER=1 (uses `providers update-oidc`).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

gcp::load_config "${1:-}"
gcp::require_cmd gcloud
gcp::require_auth

issuer_uri="https://token.actions.githubusercontent.com"
attr_mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner,attribute.environment=assertion.environment,attribute.ref=assertion.ref"
attr_condition="assertion.repository_owner == '${GITHUB_OWNER}' && assertion.repository == '${GITHUB_REPO}'"

# --- pool ------------------------------------------------------------------
if gcloud iam workload-identity-pools describe "$WIF_POOL_ID" \
     --location=global --project="$GCP_PROJECT_ID" >/dev/null 2>&1; then
  gcp::ok "WIF pool exists: $WIF_POOL_ID"
else
  gcp::log "Creating WIF pool: $WIF_POOL_ID"
  gcp::run gcloud iam workload-identity-pools create "$WIF_POOL_ID" \
    --location=global \
    --display-name="GitHub Actions" \
    --project="$GCP_PROJECT_ID"
  gcp::ok "Created pool $WIF_POOL_ID"
fi

# --- OIDC provider ---------------------------------------------------------
if gcloud iam workload-identity-pools providers describe "$WIF_PROVIDER_ID" \
     --workload-identity-pool="$WIF_POOL_ID" --location=global \
     --project="$GCP_PROJECT_ID" >/dev/null 2>&1; then
  if [ "${UPDATE_PROVIDER:-0}" = "1" ]; then
    gcp::warn "UPDATE_PROVIDER=1 — updating provider mapping/condition"
    gcp::run gcloud iam workload-identity-pools providers update-oidc "$WIF_PROVIDER_ID" \
      --workload-identity-pool="$WIF_POOL_ID" --location=global \
      --issuer-uri="$issuer_uri" \
      --attribute-mapping="$attr_mapping" \
      --attribute-condition="$attr_condition" \
      --project="$GCP_PROJECT_ID"
    gcp::ok "Updated provider $WIF_PROVIDER_ID"
  else
    gcp::ok "WIF provider exists: $WIF_PROVIDER_ID (set UPDATE_PROVIDER=1 to change mapping/condition)"
  fi
else
  gcp::log "Creating OIDC provider: $WIF_PROVIDER_ID (repo-pinned)"
  gcp::run gcloud iam workload-identity-pools providers create-oidc "$WIF_PROVIDER_ID" \
    --workload-identity-pool="$WIF_POOL_ID" --location=global \
    --issuer-uri="$issuer_uri" \
    --attribute-mapping="$attr_mapping" \
    --attribute-condition="$attr_condition" \
    --project="$GCP_PROJECT_ID"
  gcp::ok "Created provider $WIF_PROVIDER_ID"
fi

# --- bind deployer SA to the env-scoped principalSet -----------------------
deployer_email="$(gcp::sa_email "$DEPLOYER_SA")"
principal="$(gcp::wif_principal_set)"

gcp::log "Binding $deployer_email <- workloadIdentityUser for environment '$GITHUB_ENVIRONMENT'"
gcp::run gcloud iam service-accounts add-iam-policy-binding "$deployer_email" \
  --project="$GCP_PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="$principal" \
  --condition=None >/dev/null
gcp::ok "Deployer SA reachable only from repo ${GITHUB_REPO}, environment '${GITHUB_ENVIRONMENT}'"

# --- emit the values the GitHub workflow (0.10b.2/0.10b.3) will need --------
cat >&2 <<EOF

------------------------------------------------------------------------
GitHub Actions values for environment '$GITHUB_ENVIRONMENT' (record as repo/env VARIABLES — none are secret):
  GCP_PROJECT_ID         = $GCP_PROJECT_ID
  GCP_REGION             = $GCP_REGION
  GCP_WIF_PROVIDER       = $(gcp::wif_provider_resource)
  GCP_DEPLOYER_SA        = $deployer_email
  GCP_AR_IMAGE_PREFIX    = ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${AR_REPO}
------------------------------------------------------------------------
EOF
