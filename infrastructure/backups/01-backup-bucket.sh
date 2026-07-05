#!/usr/bin/env bash
# 1.10b.4 · Step 01 — GCS backup bucket with a RETENTION_DAYS lifecycle (auto-
# delete old exports) + object versioning + uniform bucket-level access.
# Idempotent: creates the bucket only if absent; always re-applies the policies.
#
# Usage: ./01-backup-bucket.sh <staging|production>
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

bkp::load_config "${1:-}"
bkp::require_cmd gcloud
bkp::require_cmd gsutil
bkp::require_auth

if bkp::bucket_exists; then
  bkp::ok "Bucket already exists: gs://$BACKUP_BUCKET"
else
  bkp::log "Creating bucket gs://$BACKUP_BUCKET ($BKP_REGION)"
  bkp::run gsutil mb -p "$BKP_PROJECT_ID" -l "$BKP_REGION" -b on "gs://$BACKUP_BUCKET"
fi

# Lifecycle: delete objects (and noncurrent versions) older than RETENTION_DAYS.
LC_FILE="$(mktemp)"
trap 'rm -f "$LC_FILE"' EXIT
cat >"$LC_FILE" <<JSON
{
  "rule": [
    { "action": {"type": "Delete"}, "condition": {"age": ${RETENTION_DAYS}} },
    { "action": {"type": "Delete"}, "condition": {"daysSinceNoncurrentTime": ${RETENTION_DAYS}} }
  ]
}
JSON
bkp::log "Applying ${RETENTION_DAYS}-day lifecycle"
bkp::run gsutil lifecycle set "$LC_FILE" "gs://$BACKUP_BUCKET"

bkp::log "Enabling object versioning"
bkp::run gsutil versioning set on "gs://$BACKUP_BUCKET"

bkp::ok "Bucket ready: gs://$BACKUP_BUCKET (retention ${RETENTION_DAYS}d, versioned)"
