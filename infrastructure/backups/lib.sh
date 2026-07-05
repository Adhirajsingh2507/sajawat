#!/usr/bin/env bash
# Shared helpers for the Sajawat backup provisioning scripts
# (Milestone 1.10b.4 — Backups & Disaster Recovery).
#
# Sourced by the numbered scripts, provision-backups.sh and verify-backups.sh.
# No side effects beyond defining functions + loading config. Same conventions as
# infrastructure/scripts/gcp/lib.sh and infrastructure/monitoring/lib.sh:
#   - Every gcloud/gsutil call passes the project explicitly.
#   - Functions namespaced bkp::* .
#   - Create/ensure only — nothing here deletes a resource.
#   - Idempotent (describe-or-create).

bkp::_color() { if [ -t 2 ]; then printf '\033[%sm' "$1" >&2; fi; }
bkp::log()  { bkp::_color '0;36'; printf '› %s\n' "$*" >&2; bkp::_color '0'; }
bkp::ok()   { bkp::_color '0;32'; printf '✓ %s\n' "$*" >&2; bkp::_color '0'; }
bkp::warn() { bkp::_color '1;33'; printf '! %s\n' "$*" >&2; bkp::_color '0'; }
bkp::err()  { bkp::_color '0;31'; printf '✗ %s\n' "$*" >&2; bkp::_color '0'; }
bkp::die()  { bkp::err "$*"; exit 1; }

bkp::run() {
  bkp::_color '0;90'; printf '  $ %s\n' "$*" >&2; bkp::_color '0'
  "$@"
}

bkp::require_cmd() {
  command -v "$1" >/dev/null 2>&1 || bkp::die "Required command not found on PATH: $1"
}

bkp::require_auth() {
  local account
  account="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | head -n1)"
  [ -n "$account" ] || bkp::die "No active gcloud account. Run: gcloud auth login"
  bkp::log "Active gcloud account: $account"
}

BKP_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# bkp::load_config <env>
bkp::load_config() {
  local env="${1:-}"
  case "$env" in
    staging|production) ;;
    "") bkp::die "Usage: $(basename "${0:-script}") <staging|production>" ;;
    *)  bkp::die "Unknown environment '$env' (expected: staging | production)" ;;
  esac

  local cfg="$BKP_LIB_DIR/config.$env.sh"
  [ -f "$cfg" ] || bkp::die "Config file not found: $cfg"
  # shellcheck source=/dev/null
  source "$cfg"

  : "${BKP_ENV:?config missing BKP_ENV}"
  : "${BKP_PROJECT_ID:?config missing BKP_PROJECT_ID}"
  : "${BKP_REGION:?config missing BKP_REGION}"
  : "${BACKUP_BUCKET:?config missing BACKUP_BUCKET}"
  : "${RETENTION_DAYS:?config missing RETENTION_DAYS}"
  : "${BACKUP_JOB:?config missing BACKUP_JOB}"
  : "${BACKUP_SA:?config missing BACKUP_SA}"
  : "${BACKUP_IMAGE:?config missing BACKUP_IMAGE}"
  : "${MONGODB_URI_SECRET:?config missing MONGODB_URI_SECRET}"
  : "${SCHEDULE_CRON:?config missing SCHEDULE_CRON}"
  : "${SCHEDULER_TZ:?config missing SCHEDULER_TZ}"

  bkp::log "Loaded config for '$BKP_ENV' (project: $BKP_PROJECT_ID, bucket: gs://$BACKUP_BUCKET)"
}

bkp::sa_email() { printf '%s@%s.iam.gserviceaccount.com' "$1" "$BKP_PROJECT_ID"; }

# Idempotent existence checks.
bkp::bucket_exists()    { gsutil ls -b -p "$BKP_PROJECT_ID" "gs://$BACKUP_BUCKET" >/dev/null 2>&1; }
bkp::job_exists()       { gcloud run jobs describe "$BACKUP_JOB" --region="$BKP_REGION" --project="$BKP_PROJECT_ID" >/dev/null 2>&1; }
bkp::scheduler_exists() { gcloud scheduler jobs describe "${BACKUP_JOB}-daily" --location="$BKP_REGION" --project="$BKP_PROJECT_ID" >/dev/null 2>&1; }
bkp::sa_exists()        { gcloud iam service-accounts describe "$(bkp::sa_email "$BACKUP_SA")" --project="$BKP_PROJECT_ID" >/dev/null 2>&1; }

bkp::confirm() {
  if [ "${BKP_ASSUME_YES:-0}" = "1" ]; then
    bkp::warn "BKP_ASSUME_YES=1 — skipping confirmation"
    return 0
  fi
  local reply
  printf '%s [type "yes" to proceed]: ' "$1" >&2
  read -r reply
  [ "$reply" = "yes" ]
}
