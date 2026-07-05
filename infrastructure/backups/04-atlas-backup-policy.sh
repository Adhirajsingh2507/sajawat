#!/usr/bin/env bash
# 1.10b.4 · Step 04 — MongoDB Atlas native Cloud Backup (the PRIMARY database
# backup; the mongodump job in 01–03 is the portable secondary).
#
# Reads/optionally sets the cluster's backup schedule via the Atlas Admin API v2:
# daily snapshots with ATLAS_SNAPSHOT_RETENTION_DAYS retention. Continuous PITR is
# a cluster-tier setting (M10+) — enable it in the Atlas UI or via the cluster API.
#
# Auth: Atlas API keys from the environment (NEVER committed):
#   ATLAS_PUBLIC_KEY / ATLAS_PRIVATE_KEY
#
# Usage:
#   ./04-atlas-backup-policy.sh <staging|production>          # read-only: show current
#   ./04-atlas-backup-policy.sh <staging|production> --apply  # PATCH the daily policy
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

bkp::load_config "${1:-}"
APPLY="${2:-}"
bkp::require_cmd curl

: "${ATLAS_PUBLIC_KEY:?set ATLAS_PUBLIC_KEY in the environment}"
: "${ATLAS_PRIVATE_KEY:?set ATLAS_PRIVATE_KEY in the environment}"
[ "$ATLAS_GROUP_ID" != "REPLACE_WITH_ATLAS_PROJECT_ID" ] || bkp::die "Set ATLAS_GROUP_ID in config.$BKP_ENV.sh"
[ "$ATLAS_CLUSTER_NAME" != "REPLACE_WITH_ATLAS_CLUSTER" ] || bkp::die "Set ATLAS_CLUSTER_NAME in config.$BKP_ENV.sh"

API="https://cloud.mongodb.com/api/atlas/v2"
SCHED_URL="${API}/groups/${ATLAS_GROUP_ID}/clusters/${ATLAS_CLUSTER_NAME}/backup/schedule"
ACCEPT="Accept: application/vnd.atlas.2023-01-01+json"
CTYPE="Content-Type: application/vnd.atlas.2023-01-01+json"

atlas() { curl -sS --fail-with-body --user "${ATLAS_PUBLIC_KEY}:${ATLAS_PRIVATE_KEY}" --digest "$@"; }

bkp::log "Current backup schedule for ${ATLAS_CLUSTER_NAME}:"
atlas -H "$ACCEPT" -X GET "$SCHED_URL" || bkp::die "Atlas API call failed (keys? group id? cluster name?)"
echo >&2

if [ "$APPLY" != "--apply" ]; then
  bkp::warn "Read-only. Re-run with --apply to set a daily / ${ATLAS_SNAPSHOT_RETENTION_DAYS}-day policy."
  exit 0
fi

# Daily snapshot, RETENTION_DAYS retention. (Atlas keeps its default hourly/weekly/
# monthly items unless replaced; here we ensure a daily policy item exists.)
BODY="$(mktemp)"; trap 'rm -f "$BODY"' EXIT
cat >"$BODY" <<JSON
{
  "policies": [{
    "policyItems": [{
      "frequencyType": "daily",
      "frequencyInterval": 1,
      "retentionUnit": "days",
      "retentionValue": ${ATLAS_SNAPSHOT_RETENTION_DAYS}
    }]
  }]
}
JSON

bkp::warn "About to PATCH the Atlas backup schedule for ${ATLAS_CLUSTER_NAME} ($BKP_ENV)"
bkp::confirm "Proceed?" || bkp::die "Aborted."
atlas -H "$ACCEPT" -H "$CTYPE" -X PATCH "$SCHED_URL" --data "@$BODY" \
  || bkp::die "Atlas PATCH failed"
bkp::ok "Atlas daily backup policy applied (retention ${ATLAS_SNAPSHOT_RETENTION_DAYS}d)."
