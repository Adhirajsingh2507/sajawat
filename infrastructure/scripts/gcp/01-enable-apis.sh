#!/usr/bin/env bash
# 0.10b.1 — Step 01: enable the Google Cloud APIs the deploy pipeline needs.
# Idempotent: enabling an already-enabled service is a no-op.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

gcp::load_config "${1:-}"
gcp::require_cmd gcloud
gcp::require_auth

services=(
  run.googleapis.com                 # Cloud Run
  artifactregistry.googleapis.com    # Artifact Registry (images)
  secretmanager.googleapis.com       # Secret Manager
  iam.googleapis.com                 # service accounts + IAM
  iamcredentials.googleapis.com      # WIF token exchange (STS) needs this
  sts.googleapis.com                 # Security Token Service (WIF)
  cloudresourcemanager.googleapis.com # project-level IAM policy edits
)

gcp::log "Enabling ${#services[@]} APIs on $GCP_PROJECT_ID (may take a minute)…"
gcp::run gcloud services enable "${services[@]}" --project="$GCP_PROJECT_ID"
gcp::ok "APIs enabled on $GCP_PROJECT_ID"
