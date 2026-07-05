#!/usr/bin/env bash
# 1.10b.4 · Step 03 — Cloud Scheduler daily trigger for the backup Cloud Run Job.
# Fires the job's :run endpoint (Cloud Run Admin API v2) with an OAuth token from
# the backup SA, which is granted run.invoker on the job.
# Idempotent: create-or-update the scheduler job.
#
# Usage: ./03-scheduler.sh <staging|production>
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

bkp::load_config "${1:-}"
bkp::require_cmd gcloud
bkp::require_auth

SA_EMAIL="$(bkp::sa_email "$BACKUP_SA")"
SCHED_NAME="${BACKUP_JOB}-daily"
RUN_URI="https://${BKP_REGION}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${BKP_PROJECT_ID}/jobs/${BACKUP_JOB}:run"

# The SA must be able to invoke the job.
bkp::log "Granting run.invoker on job $BACKUP_JOB to $SA_EMAIL"
bkp::run gcloud run jobs add-iam-policy-binding "$BACKUP_JOB" \
  --project="$BKP_PROJECT_ID" --region="$BKP_REGION" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.invoker" >/dev/null

ARGS=(
  --project="$BKP_PROJECT_ID"
  --location="$BKP_REGION"
  --schedule="$SCHEDULE_CRON"
  --time-zone="$SCHEDULER_TZ"
  --uri="$RUN_URI"
  --http-method=POST
  --oauth-service-account-email="$SA_EMAIL"
  --oauth-token-scope="https://www.googleapis.com/auth/cloud-platform"
)
if bkp::scheduler_exists; then
  bkp::log "Updating scheduler $SCHED_NAME ($SCHEDULE_CRON $SCHEDULER_TZ)"
  bkp::run gcloud scheduler jobs update http "$SCHED_NAME" "${ARGS[@]}"
else
  bkp::log "Creating scheduler $SCHED_NAME ($SCHEDULE_CRON $SCHEDULER_TZ)"
  bkp::run gcloud scheduler jobs create http "$SCHED_NAME" "${ARGS[@]}"
fi

bkp::ok "Daily backup scheduled: $SCHED_NAME → $BACKUP_JOB"
