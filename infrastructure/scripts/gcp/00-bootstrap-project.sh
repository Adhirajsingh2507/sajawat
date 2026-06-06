#!/usr/bin/env bash
# 0.10b.1 — OPTIONAL, GUARDED: create a new GCP project and link billing.
#
# High blast radius — creating projects and linking billing has cost and org
# implications. This is operator-run, off the normal provision path, and refuses
# to run without an explicit confirmation. Prefer creating the project via the
# Cloud Console if you have org policies/folders to honor.
#
# Usage:
#   BILLING_ACCOUNT=XXXXXX-XXXXXX-XXXXXX ./00-bootstrap-project.sh production
#   # optional: ORG_ID=123456789012 or FOLDER_ID=123456789012 to place the project
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

gcp::load_config "${1:-}"
gcp::require_cmd gcloud
gcp::require_auth

: "${BILLING_ACCOUNT:?Set BILLING_ACCOUNT=XXXXXX-XXXXXX-XXXXXX (gcloud billing accounts list)}"

gcp::warn "This will CREATE a project and LINK BILLING (incurs cost)."
gcp::warn "  Project ID : $GCP_PROJECT_ID"
gcp::warn "  Billing    : $BILLING_ACCOUNT"
gcp::warn "  Org/Folder : ${ORG_ID:+org=$ORG_ID }${FOLDER_ID:+folder=$FOLDER_ID }${ORG_ID:-${FOLDER_ID:-<none>}}"
if ! gcp::confirm "Create project '$GCP_PROJECT_ID' and link billing?"; then
  gcp::die "Aborted by operator."
fi

if gcloud projects describe "$GCP_PROJECT_ID" >/dev/null 2>&1; then
  gcp::ok "Project already exists: $GCP_PROJECT_ID"
else
  create_args=(projects create "$GCP_PROJECT_ID" --name="Sajawat ${GCP_ENV}")
  [ -n "${ORG_ID:-}" ]    && create_args+=(--organization="$ORG_ID")
  [ -n "${FOLDER_ID:-}" ] && create_args+=(--folder="$FOLDER_ID")
  gcp::log "Creating project $GCP_PROJECT_ID"
  gcp::run gcloud "${create_args[@]}"
  gcp::ok "Created $GCP_PROJECT_ID"
fi

gcp::log "Linking billing account $BILLING_ACCOUNT"
gcp::run gcloud billing projects link "$GCP_PROJECT_ID" --billing-account="$BILLING_ACCOUNT"
gcp::ok "Billing linked. Next: ./provision.sh $GCP_ENV"
