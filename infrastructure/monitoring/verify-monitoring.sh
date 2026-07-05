#!/usr/bin/env bash
# 1.10b.3 — Read-only verifier. Asserts every monitoring resource from steps
# 01–05 exists. Makes NO changes. Exits non-zero on any gap.
#
# Usage: ./verify-monitoring.sh <staging|production>
set -uo pipefail   # NOT -e — run every check, tally failures
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

mon::load_config "${1:-}"
mon::require_cmd gcloud
mon::require_auth

PASS=0
FAIL=0
ok()   { mon::ok "$1";  PASS=$((PASS + 1)); }
bad()  { mon::err "$1"; FAIL=$((FAIL + 1)); }
# assert_nonempty "<label>" "<value>"
assert_nonempty() { if [ -n "$2" ]; then ok "$1"; else bad "$1"; fi; }

mon::log "── Notification channel ──"
assert_nonempty "email channel '$NOTIFICATION_DISPLAY_NAME'" "$(mon::channel_name)"

mon::log "── Uptime checks ──"
assert_nonempty "uptime: api-liveness"  "$(mon::uptime_name "sajawat-${MON_ENV}-api-liveness")"
assert_nonempty "uptime: api-readiness" "$(mon::uptime_name "sajawat-${MON_ENV}-api-readiness")"
if [ -n "${WEB_HOST:-}" ]; then
  assert_nonempty "uptime: web-home" "$(mon::uptime_name "sajawat-${MON_ENV}-web-home")"
else
  mon::warn "WEB_HOST empty — web uptime check not expected"
fi

mon::log "── Log-based metrics ──"
for m in api_5xx api_error_logs payment_failed order_placed backup_failed; do
  if mon::metric_exists "sajawat_${MON_ENV}_${m}"; then ok "metric: $m"; else bad "metric: $m"; fi
done

mon::log "── Alert policies ──"
policies=(
  "Sajawat ${MON_ENV} — API down (liveness)"
  "Sajawat ${MON_ENV} — API readiness / database down"
  "Sajawat ${MON_ENV} — API 5xx elevated"
  "Sajawat ${MON_ENV} — API error logs elevated"
  "Sajawat ${MON_ENV} — Payment failures"
  "Sajawat ${MON_ENV} — Backup failure"
  "Sajawat ${MON_ENV} — API latency p95 > ${LATENCY_P95_MS}ms"
)
[ -n "${WEB_HOST:-}" ] && policies+=("Sajawat ${MON_ENV} — Web down")
for p in "${policies[@]}"; do
  assert_nonempty "policy: $p" "$(mon::policy_name "$p")"
done

mon::log "── Dashboard ──"
assert_nonempty "dashboard: Sajawat ${MON_ENV} — Operations" \
  "$(mon::dashboard_name "Sajawat ${MON_ENV} — Operations")"

echo >&2
if [ "$FAIL" -eq 0 ]; then
  mon::ok "VERIFY PASSED — $PASS checks green for '$MON_ENV'"
  exit 0
else
  mon::err "VERIFY FAILED — $FAIL failed, $PASS passed for '$MON_ENV'"
  exit 1
fi
