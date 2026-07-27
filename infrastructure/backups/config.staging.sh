#!/usr/bin/env bash
# Non-secret configuration for Sajawat STAGING backups (Milestone 1.10b.4).
# Committed on purpose: identifiers, region, retention — NO secrets. Atlas API
# keys + the Mongo URI are injected out-of-band (Secret Manager / env).
#
# shellcheck disable=SC2034  # vars are consumed by the scripts that source this file

BKP_ENV="staging"
BKP_PROJECT_ID="sajawat-staging"
BKP_REGION="asia-south1"

# GCS bucket for logical (mongodump) exports. Bucket names are global — keep the
# project id in the name to stay unique.
BACKUP_BUCKET="sajawat-staging-db-backups"
RETENTION_DAYS="30"                 # deployment-plan: 30-day retention

# Cloud Run Job (mongodump → GCS) + its runtime SA + image.
BACKUP_JOB="sajawat-staging-db-backup"
BACKUP_SA="sajawat-backup-run"      # SA email derived: <this>@<project>.iam...
# Artifact Registry image the operator builds+pushes from ./Dockerfile.
BACKUP_IMAGE="asia-south1-docker.pkg.dev/sajawat-staging/sajawat/db-backup:latest"

# Secret Manager secret holding the mongodump connection string (read-only
# creds preferred). Created/managed by the CD secrets step; referenced by name.
MONGODB_URI_SECRET="MONGODB_URI"

# Daily schedule (Cloud Scheduler). 02:30 IST daily.
SCHEDULE_CRON="30 2 * * *"
SCHEDULER_TZ="Asia/Kolkata"

# --- MongoDB Atlas native backup (primary; optional Admin-API automation) ------
# Group (project) id + cluster name for the Atlas backup-schedule script
# (04-atlas-backup-policy.sh). Atlas API keys come from env, never here:
#   ATLAS_PUBLIC_KEY / ATLAS_PRIVATE_KEY
ATLAS_GROUP_ID="REPLACE_WITH_ATLAS_PROJECT_ID"
ATLAS_CLUSTER_NAME="REPLACE_WITH_ATLAS_CLUSTER"
ATLAS_SNAPSHOT_RETENTION_DAYS="30"
