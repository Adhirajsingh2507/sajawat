#!/usr/bin/env bash
# 0.10b.1 — Orchestrator: provision one environment end to end (steps 01..05).
#
# Usage:
#   ./provision.sh staging
#   ./provision.sh production
#
# Each step is idempotent, so re-running is safe. Set GCP_ASSUME_YES=1 to skip
# the confirmation prompt (e.g. in a trusted automation context).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

env="${1:-}"
gcp::load_config "$env"
gcp::require_cmd gcloud
gcp::require_auth

gcp::warn "About to provision GCP infrastructure for environment: $GCP_ENV"
gcp::warn "  Project : $GCP_PROJECT_ID"
gcp::warn "  Region  : $GCP_REGION"
gcp::warn "  GitHub  : $GITHUB_REPO (environment claim: $GITHUB_ENVIRONMENT)"
if ! gcp::confirm "Proceed against project '$GCP_PROJECT_ID'?"; then
  gcp::die "Aborted by operator."
fi

for step in \
  01-enable-apis.sh \
  02-artifact-registry.sh \
  03-secrets.sh \
  04-service-accounts.sh \
  05-workload-identity.sh; do
  gcp::log "──── running $step ($env) ────"
  "$SCRIPT_DIR/$step" "$env"
done

gcp::ok "Provisioning complete for '$GCP_ENV'. Run: ./verify.sh $env"
