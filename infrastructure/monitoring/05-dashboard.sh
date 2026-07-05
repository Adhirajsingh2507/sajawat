#!/usr/bin/env bash
# 1.10b.3 · Step 05 — Operations dashboard (request rate, latency p95, 5xx,
# orders placed). Idempotent: skips if a dashboard with the same display name
# already exists.
# Usage: ./05-dashboard.sh <staging|production>
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

mon::load_config "${1:-}"
mon::require_cmd gcloud
mon::require_auth

DISPLAY="Sajawat ${MON_ENV} — Operations"
if [ -n "$(mon::dashboard_name "$DISPLAY")" ]; then
  mon::ok "Dashboard already exists: $DISPLAY"
  exit 0
fi

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT
FILE="$WORKDIR/dashboard.json"

# xy tile helper: <title> <metric-filter> <aligner> <x> <y>
# The filter carries literal double quotes — JSON-escape them (backslashes first)
# so the emitted document is valid JSON.
tile() {
  local title="$1" filter="$2" aligner="$3" x="$4" y="$5"
  filter="${filter//\\/\\\\}"
  filter="${filter//\"/\\\"}"
  cat <<JSON
{
  "xPos": ${x}, "yPos": ${y}, "width": 6, "height": 4,
  "widget": {
    "title": "${title}",
    "xyChart": {
      "dataSets": [{
        "timeSeriesQuery": {
          "timeSeriesFilter": {
            "filter": "${filter}",
            "aggregation": {"alignmentPeriod": "300s", "perSeriesAligner": "${aligner}"}
          }
        },
        "plotType": "LINE"
      }]
    }
  }
}
JSON
}

SVC="resource.type=\"cloud_run_revision\" AND resource.label.service_name=\"${API_SERVICE}\""

{
  printf '{\n  "displayName": "%s",\n  "mosaicLayout": {\n    "columns": 12,\n    "tiles": [\n' "$DISPLAY"
  tile "API request rate" "metric.type=\"run.googleapis.com/request_count\" AND ${SVC}" "ALIGN_RATE" 0 0
  printf ',\n'
  tile "API latency p95 (ms)" "metric.type=\"run.googleapis.com/request_latencies\" AND ${SVC}" "ALIGN_PERCENTILE_95" 6 0
  printf ',\n'
  tile "API 5xx" "metric.type=\"logging.googleapis.com/user/sajawat_${MON_ENV}_api_5xx\" AND resource.type=\"cloud_run_revision\"" "ALIGN_DELTA" 0 4
  printf ',\n'
  tile "Orders placed" "metric.type=\"logging.googleapis.com/user/sajawat_${MON_ENV}_order_placed\" AND resource.type=\"cloud_run_revision\"" "ALIGN_DELTA" 6 4
  printf '\n    ]\n  }\n}\n'
} >"$FILE"

mon::log "Creating dashboard: $DISPLAY"
mon::run gcloud monitoring dashboards create \
  --project="$MON_PROJECT_ID" \
  --config-from-file="$FILE"
mon::ok "Dashboard created: $DISPLAY"
