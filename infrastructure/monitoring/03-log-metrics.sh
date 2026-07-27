#!/usr/bin/env bash
# 1.10b.3 · Step 03 — Log-based metrics over the API's structured (pino JSON) logs
# on Cloud Run. These are the counters the alert policies (step 04) and dashboard
# (step 05) build on.
#
#   sajawat_<env>_api_5xx        — HTTP 5xx responses (Cloud Run request logs)
#   sajawat_<env>_api_error_logs — pino level=error application logs
#   sajawat_<env>_payment_failed — business event: payment.failed
#   sajawat_<env>_order_placed   — business event: order.placed (throughput)
#   sajawat_<env>_backup_failed  — backup job failure marker (fed by 1.10b.4)
#
# The jsonPayload.event filters are the contract in services/api/src/
# observability/events.ts — keep them in sync.
#
# Idempotent: skips a metric that already exists (log-metric filters are not
# updated in place here; delete + re-run to change one).
# Usage: ./03-log-metrics.sh <staging|production>
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

mon::load_config "${1:-}"
mon::require_cmd gcloud
mon::require_auth

CR='resource.type="cloud_run_revision"'
SVC="resource.labels.service_name=\"${API_SERVICE}\""

# ensure_metric <name> <description> <log-filter>
ensure_metric() {
  local name="$1" desc="$2" filter="$3"
  if mon::metric_exists "$name"; then
    mon::ok "Log metric already exists: $name"
    return 0
  fi
  mon::log "Creating log metric: $name"
  mon::run gcloud logging metrics create "$name" \
    --project="$MON_PROJECT_ID" \
    --description="$desc" \
    --log-filter="$filter"
  mon::ok "Log metric created: $name"
}

ensure_metric "sajawat_${MON_ENV}_api_5xx" \
  "Sajawat ${MON_ENV}: API HTTP 5xx responses" \
  "${CR} AND ${SVC} AND httpRequest.status>=500"

ensure_metric "sajawat_${MON_ENV}_api_error_logs" \
  "Sajawat ${MON_ENV}: API error-level application logs" \
  "${CR} AND ${SVC} AND jsonPayload.level=\"error\""

ensure_metric "sajawat_${MON_ENV}_payment_failed" \
  "Sajawat ${MON_ENV}: payment verification failures" \
  "${CR} AND ${SVC} AND jsonPayload.event=\"payment.failed\""

ensure_metric "sajawat_${MON_ENV}_order_placed" \
  "Sajawat ${MON_ENV}: orders placed (COD + online)" \
  "${CR} AND ${SVC} AND jsonPayload.event=\"order.placed\""

# The backup job runs as a Cloud Run *Job* (resource.type=cloud_run_job), not a
# revision — so this metric keys on the event marker alone, across sources.
ensure_metric "sajawat_${MON_ENV}_backup_failed" \
  "Sajawat ${MON_ENV}: database backup job failures (1.10b.4)" \
  "jsonPayload.event=\"backup.failed\""
