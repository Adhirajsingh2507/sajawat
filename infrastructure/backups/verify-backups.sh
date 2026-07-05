#!/usr/bin/env bash
# 1.10b.4 — Read-only verifier for the GCS logical-backup pipeline. Makes NO
# changes. Exits non-zero on any gap.
#
# Usage: ./verify-backups.sh <staging|production>
set -uo pipefail   # NOT -e — run every check, tally failures
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

bkp::load_config "${1:-}"
bkp::require_cmd gcloud
bkp::require_cmd gsutil
bkp::require_auth

PASS=0
FAIL=0
check() {  # check "<label>" <cmd...>
  local label="$1"; shift
  if "$@" >/dev/null 2>&1; then bkp::ok "$label"; PASS=$((PASS + 1))
  else bkp::err "$label"; FAIL=$((FAIL + 1)); fi
}

SA_EMAIL="$(bkp::sa_email "$BACKUP_SA")"

bkp::log "── Bucket ──"
check "bucket gs://$BACKUP_BUCKET exists" bkp::bucket_exists
if gsutil lifecycle get "gs://$BACKUP_BUCKET" 2>/dev/null | grep -q '"age"'; then
  bkp::ok "lifecycle rule present"; PASS=$((PASS + 1))
else
  bkp::err "lifecycle rule present"; FAIL=$((FAIL + 1))
fi

bkp::log "── Service account + job ──"
check "SA exists: $SA_EMAIL" bkp::sa_exists
check "Cloud Run Job '$BACKUP_JOB' exists" bkp::job_exists

bkp::log "── Scheduler ──"
check "scheduler '${BACKUP_JOB}-daily' exists" bkp::scheduler_exists

bkp::log "── Recent backups (informational) ──"
if latest="$(gsutil ls "gs://$BACKUP_BUCKET/backups/" 2>/dev/null | tail -n1)" && [ -n "$latest" ]; then
  bkp::ok "most recent object: $latest"
else
  bkp::warn "no backup objects yet (run the job once)"
fi

echo >&2
if [ "$FAIL" -eq 0 ]; then
  bkp::ok "VERIFY PASSED — $PASS checks green for '$BKP_ENV'"
  exit 0
else
  bkp::err "VERIFY FAILED — $FAIL failed, $PASS passed for '$BKP_ENV'"
  exit 1
fi
