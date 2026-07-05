#!/usr/bin/env bash
# 1.10b.3 — Orchestrator. Runs the monitoring provisioning steps 01→05 in order
# for the given environment. Every step is idempotent, so re-running is safe.
#
# Usage: ./provision-monitoring.sh <staging|production>
#   MON_ASSUME_YES=1 to skip the confirmation prompt.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

mon::load_config "${1:-}"
mon::require_cmd gcloud
mon::require_auth

mon::warn "About to provision Cloud Monitoring in project: $MON_PROJECT_ID ($MON_ENV)"
mon::confirm "Proceed?" || mon::die "Aborted."

for step in \
  01-notification-channels.sh \
  02-uptime-checks.sh \
  03-log-metrics.sh \
  04-alert-policies.sh \
  05-dashboard.sh; do
  mon::log "── Running $step ──"
  MON_ASSUME_YES=1 bash "$SCRIPT_DIR/$step" "$MON_ENV"
done

mon::ok "Monitoring provisioned for '$MON_ENV'. Run verify-monitoring.sh to assert."
