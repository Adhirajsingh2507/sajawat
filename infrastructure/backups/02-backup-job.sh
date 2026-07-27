#!/usr/bin/env bash
# 1.10b.4 · Step 02 — Cloud Run Job (mongodump → GCS) + least-privilege runtime
# SA. Idempotent: create-or-update the job; ensure the SA + its two grants
# (objectAdmin on the backup bucket, secretAccessor on the Mongo URI secret).
#
# Prereqs: the BACKUP_IMAGE has been built from ./Dockerfile and pushed to
# Artifact Registry, and MONGODB_URI_SECRET exists in Secret Manager.
# Usage: ./02-backup-job.sh <staging|production>
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

bkp::load_config "${1:-}"
bkp::require_cmd gcloud
bkp::require_auth

SA_EMAIL="$(bkp::sa_email "$BACKUP_SA")"

# 1) Runtime service account.
if bkp::sa_exists; then
  bkp::ok "Service account exists: $SA_EMAIL"
else
  bkp::log "Creating service account $SA_EMAIL"
  bkp::run gcloud iam service-accounts create "$BACKUP_SA" \
    --project="$BKP_PROJECT_ID" \
    --display-name="Sajawat DB backup job ($BKP_ENV)"
fi

# 2) Grants: write to the backup bucket, read the Mongo URI secret. Both idempotent.
bkp::log "Granting objectAdmin on gs://$BACKUP_BUCKET"
bkp::run gsutil iam ch "serviceAccount:${SA_EMAIL}:roles/storage.objectAdmin" "gs://$BACKUP_BUCKET"

bkp::log "Granting secretAccessor on $MONGODB_URI_SECRET"
bkp::run gcloud secrets add-iam-policy-binding "$MONGODB_URI_SECRET" \
  --project="$BKP_PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" \
  --condition=None >/dev/null

# 3) Cloud Run Job (create or update).
COMMON_ARGS=(
  --project="$BKP_PROJECT_ID"
  --region="$BKP_REGION"
  --image="$BACKUP_IMAGE"
  --service-account="$SA_EMAIL"
  --set-secrets="MONGODB_URI=${MONGODB_URI_SECRET}:latest"
  --set-env-vars="BACKUP_BUCKET=${BACKUP_BUCKET}"
  --max-retries=1
  --task-timeout=3600
)
if bkp::job_exists; then
  bkp::log "Updating Cloud Run Job $BACKUP_JOB"
  bkp::run gcloud run jobs update "$BACKUP_JOB" "${COMMON_ARGS[@]}"
else
  bkp::log "Creating Cloud Run Job $BACKUP_JOB"
  bkp::run gcloud run jobs create "$BACKUP_JOB" "${COMMON_ARGS[@]}"
fi

bkp::ok "Backup job ready: $BACKUP_JOB (run: gcloud run jobs execute $BACKUP_JOB --region $BKP_REGION)"
