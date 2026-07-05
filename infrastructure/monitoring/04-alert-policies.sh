#!/usr/bin/env bash
# 1.10b.3 · Step 04 — Alert policies, each wired to the step-01 email channel.
#
# Covers every alert the deployment plan requires (Server down, API failure,
# Database failure, Payment failure, Storage/Backup failure, High error rate)
# plus a latency SLO:
#
#   1. API liveness down        (uptime /health fails)
#   2. API readiness / DB down   (uptime /api/v1/health 503 — DB-health monitor)
#   3. Web down                  (uptime, only if WEB_HOST set)
#   4. API 5xx elevated          (log metric > 10 / 5 min)
#   5. API error logs elevated   (log metric > 20 / 5 min)
#   6. Payment failures          (log metric > 0 / 5 min)
#   7. Backup failure            (log metric > 0 / 1 h — fed by 1.10b.4)
#   8. API latency p95 high      (Cloud Run request_latencies > LATENCY_P95_MS)
#
# Idempotent: skips a policy whose display name already exists (delete + re-run
# to change one). Requires steps 01–03 to have run first.
# Usage: ./04-alert-policies.sh <staging|production>
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

mon::load_config "${1:-}"
mon::require_cmd gcloud
mon::require_auth

CHANNEL="$(mon::channel_name)"
[ -n "$CHANNEL" ] || mon::die "No notification channel found — run 01-notification-channels.sh first."

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

# ensure_policy <display-name> <json-file>
ensure_policy() {
  local name="$1" file="$2"
  if [ -n "$(mon::policy_name "$name")" ]; then
    mon::ok "Alert policy already exists: $name"
    return 0
  fi
  mon::log "Creating alert policy: $name"
  mon::run gcloud alpha monitoring policies create \
    --project="$MON_PROJECT_ID" \
    --policy-from-file="$file"
  mon::ok "Alert policy created: $name"
}

# last path segment of an uptime config resource name (the check_id)
uptime_check_id() { local n; n="$(mon::uptime_name "$1")"; [ -n "$n" ] && basename "$n"; }

# --- uptime-failure policy JSON ------------------------------------------------
# uptime_policy <display-name> <check-display-name> <human-target>
uptime_policy() {
  local name="$1" check_disp="$2" target="$3" cid
  cid="$(uptime_check_id "$check_disp")"
  [ -n "$cid" ] || { mon::warn "Uptime check '$check_disp' not found — skipping policy '$name'"; return 1; }
  cat <<JSON
{
  "displayName": "${name}",
  "combiner": "OR",
  "conditions": [{
    "displayName": "${target} failing",
    "conditionThreshold": {
      "filter": "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\" AND resource.type=\"uptime_url\" AND metric.label.check_id=\"${cid}\"",
      "aggregations": [{
        "alignmentPeriod": "300s",
        "perSeriesAligner": "ALIGN_NEXT_OLDER",
        "crossSeriesReducer": "REDUCE_COUNT_FALSE",
        "groupByFields": ["resource.label.host"]
      }],
      "comparison": "COMPARISON_GT",
      "thresholdValue": 1,
      "duration": "60s",
      "trigger": {"count": 1}
    }
  }],
  "notificationChannels": ["${CHANNEL}"],
  "alertStrategy": {"autoClose": "1800s"}
}
JSON
}

# --- log-metric count policy JSON ----------------------------------------------
# logcount_policy <display-name> <metric> <threshold> <align-period> <cond-label>
logcount_policy() {
  local name="$1" metric="$2" threshold="$3" period="$4" label="$5"
  cat <<JSON
{
  "displayName": "${name}",
  "combiner": "OR",
  "conditions": [{
    "displayName": "${label}",
    "conditionThreshold": {
      "filter": "metric.type=\"logging.googleapis.com/user/${metric}\"",
      "aggregations": [{
        "alignmentPeriod": "${period}",
        "perSeriesAligner": "ALIGN_DELTA",
        "crossSeriesReducer": "REDUCE_SUM"
      }],
      "comparison": "COMPARISON_GT",
      "thresholdValue": ${threshold},
      "duration": "0s",
      "trigger": {"count": 1}
    }
  }],
  "notificationChannels": ["${CHANNEL}"],
  "alertStrategy": {"autoClose": "1800s"}
}
JSON
}

# --- Cloud Run latency policy JSON ---------------------------------------------
latency_policy() {
  local name="Sajawat ${MON_ENV} — API latency p95 > ${LATENCY_P95_MS}ms"
  cat <<JSON
{
  "displayName": "${name}",
  "combiner": "OR",
  "conditions": [{
    "displayName": "API request latency p95 high",
    "conditionThreshold": {
      "filter": "metric.type=\"run.googleapis.com/request_latencies\" AND resource.type=\"cloud_run_revision\" AND resource.label.service_name=\"${API_SERVICE}\"",
      "aggregations": [{
        "alignmentPeriod": "300s",
        "perSeriesAligner": "ALIGN_PERCENTILE_95",
        "crossSeriesReducer": "REDUCE_MEAN"
      }],
      "comparison": "COMPARISON_GT",
      "thresholdValue": ${LATENCY_P95_MS},
      "duration": "300s",
      "trigger": {"count": 1}
    }
  }],
  "notificationChannels": ["${CHANNEL}"],
  "alertStrategy": {"autoClose": "1800s"}
}
JSON
}

n="sajawat-${MON_ENV}"

if uptime_policy "Sajawat ${MON_ENV} — API down (liveness)" "${n}-api-liveness" "API liveness /health" >"$WORKDIR/p1.json"; then
  ensure_policy "Sajawat ${MON_ENV} — API down (liveness)" "$WORKDIR/p1.json"
fi
if uptime_policy "Sajawat ${MON_ENV} — API readiness / database down" "${n}-api-readiness" "API readiness /api/v1/health (DB)" >"$WORKDIR/p2.json"; then
  ensure_policy "Sajawat ${MON_ENV} — API readiness / database down" "$WORKDIR/p2.json"
fi
if [ -n "${WEB_HOST:-}" ]; then
  if uptime_policy "Sajawat ${MON_ENV} — Web down" "${n}-web-home" "Web homepage" >"$WORKDIR/p3.json"; then
    ensure_policy "Sajawat ${MON_ENV} — Web down" "$WORKDIR/p3.json"
  fi
else
  mon::warn "WEB_HOST empty — skipping 'Web down' policy"
fi

logcount_policy "Sajawat ${MON_ENV} — API 5xx elevated" "sajawat_${MON_ENV}_api_5xx" 10 "300s" "More than 10 HTTP 5xx in 5 min" >"$WORKDIR/p4.json"
ensure_policy "Sajawat ${MON_ENV} — API 5xx elevated" "$WORKDIR/p4.json"

logcount_policy "Sajawat ${MON_ENV} — API error logs elevated" "sajawat_${MON_ENV}_api_error_logs" 20 "300s" "More than 20 error logs in 5 min" >"$WORKDIR/p5.json"
ensure_policy "Sajawat ${MON_ENV} — API error logs elevated" "$WORKDIR/p5.json"

logcount_policy "Sajawat ${MON_ENV} — Payment failures" "sajawat_${MON_ENV}_payment_failed" 0 "300s" "Any payment failure in 5 min" >"$WORKDIR/p6.json"
ensure_policy "Sajawat ${MON_ENV} — Payment failures" "$WORKDIR/p6.json"

logcount_policy "Sajawat ${MON_ENV} — Backup failure" "sajawat_${MON_ENV}_backup_failed" 0 "3600s" "Any backup-job failure in 1 h" >"$WORKDIR/p7.json"
ensure_policy "Sajawat ${MON_ENV} — Backup failure" "$WORKDIR/p7.json"

latency_policy >"$WORKDIR/p8.json"
ensure_policy "Sajawat ${MON_ENV} — API latency p95 > ${LATENCY_P95_MS}ms" "$WORKDIR/p8.json"

mon::ok "Alert policies reconciled for '${MON_ENV}'"
