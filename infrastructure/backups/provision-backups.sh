#!/usr/bin/env bash
# 1.10b.4 — Orchestrator for the GCS logical-backup pipeline (bucket → job →
# scheduler). Every step is idempotent, so re-running is safe.
#
# Atlas native backup (04-atlas-backup-policy.sh) is run SEPARATELY — it needs
# ATLAS_* API keys in the environment.
#
# Usage: ./provision-backups.sh <staging|production>
#   BKP_ASSUME_YES=1 to skip the confirmation prompt.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

bkp::load_config "${1:-}"
bkp::require_cmd gcloud
bkp::require_cmd gsutil
bkp::require_auth

bkp::warn "About to provision backups in project: $BKP_PROJECT_ID ($BKP_ENV)"
bkp::confirm "Proceed?" || bkp::die "Aborted."

for step in 01-backup-bucket.sh 02-backup-job.sh 03-scheduler.sh; do
  bkp::log "── Running $step ──"
  BKP_ASSUME_YES=1 bash "$SCRIPT_DIR/$step" "$BKP_ENV"
done

bkp::ok "GCS backup pipeline provisioned for '$BKP_ENV'."
bkp::warn "Next: (a) enable Atlas native backup — ./04-atlas-backup-policy.sh $BKP_ENV --apply"
bkp::warn "      (b) run a first backup — gcloud run jobs execute $BACKUP_JOB --region $BKP_REGION"
bkp::warn "      (c) run verify-backups.sh $BKP_ENV, then a restore drill (restore-runbook.md)"
