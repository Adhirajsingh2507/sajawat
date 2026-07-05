#!/usr/bin/env bash
# Non-secret configuration for Sajawat PRODUCTION backups (Milestone 1.10b.4).
# Placeholders until the production GCP project + Atlas cluster exist (D16).
#
# shellcheck disable=SC2034  # vars are consumed by the scripts that source this file

BKP_ENV="production"
BKP_PROJECT_ID="sajawat-production"
BKP_REGION="asia-south1"

BACKUP_BUCKET="sajawat-production-db-backups"
RETENTION_DAYS="30"

BACKUP_JOB="sajawat-production-db-backup"
BACKUP_SA="sajawat-backup-run"
BACKUP_IMAGE="asia-south1-docker.pkg.dev/sajawat-production/sajawat/db-backup:latest"

MONGODB_URI_SECRET="MONGODB_URI"

SCHEDULE_CRON="30 2 * * *"
SCHEDULER_TZ="Asia/Kolkata"

ATLAS_GROUP_ID="REPLACE_WITH_ATLAS_PROJECT_ID"
ATLAS_CLUSTER_NAME="REPLACE_WITH_ATLAS_CLUSTER"
ATLAS_SNAPSHOT_RETENTION_DAYS="30"
