#!/usr/bin/env bash
# 0.10b.1 — Step 02: create the Artifact Registry Docker repository.
# Idempotent: skips creation if the repo already exists.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

gcp::load_config "${1:-}"
gcp::require_cmd gcloud
gcp::require_auth

if gcloud artifacts repositories describe "$AR_REPO" \
     --location="$GCP_REGION" --project="$GCP_PROJECT_ID" >/dev/null 2>&1; then
  gcp::ok "Artifact Registry repo already exists: $AR_REPO ($GCP_REGION)"
else
  gcp::log "Creating Artifact Registry Docker repo: $AR_REPO ($GCP_REGION)"
  gcp::run gcloud artifacts repositories create "$AR_REPO" \
    --repository-format=docker \
    --location="$GCP_REGION" \
    --description="Sajawat container images (api/web/admin)" \
    --project="$GCP_PROJECT_ID"
  gcp::ok "Created $AR_REPO"
fi

gcp::log "Image path prefix: ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${AR_REPO}/{api,web,admin}"
