#!/usr/bin/env bash
# 1.10b.3 · Step 02 — Uptime checks (external availability probes).
#
#   api-liveness  → GET https://$API_HOST/health        (always 200 when up)
#   api-readiness → GET https://$API_HOST/api/v1/health  (503 when Mongo down —
#                   this check IS the database-health monitor)
#   web-home      → GET https://$WEB_HOST/               (only if WEB_HOST set)
#
# Idempotent: skips a check whose display name already exists.
# Usage: ./02-uptime-checks.sh <staging|production>
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

mon::load_config "${1:-}"
mon::require_cmd gcloud
mon::require_auth

# ensure_uptime <display-name> <host> <path>
ensure_uptime() {
  local name="$1" host="$2" path="$3"
  if [ -n "$(mon::uptime_name "$name")" ]; then
    mon::ok "Uptime check already exists: $name"
    return 0
  fi
  mon::log "Creating uptime check '$name' → https://${host}${path}"
  mon::run gcloud monitoring uptime create "$name" \
    --project="$MON_PROJECT_ID" \
    --resource-type=uptime-url \
    --resource-labels="host=${host},project_id=${MON_PROJECT_ID}" \
    --path="$path" \
    --port=443 \
    --protocol=https \
    --period=5 \
    --timeout=10
  mon::ok "Uptime check created: $name"
}

ensure_uptime "sajawat-${MON_ENV}-api-liveness"  "$API_HOST" "/health"
ensure_uptime "sajawat-${MON_ENV}-api-readiness" "$API_HOST" "/api/v1/health"

if [ -n "${WEB_HOST:-}" ]; then
  ensure_uptime "sajawat-${MON_ENV}-web-home" "$WEB_HOST" "/"
else
  mon::warn "WEB_HOST empty — skipping web uptime check (web not deployed yet, AD-54)"
fi
