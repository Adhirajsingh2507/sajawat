# Backups & Disaster Recovery (Milestone 1.10b.4)

Operator-run backup provisioning for Sajawat, mirroring the CD / monitoring
script patterns (`infrastructure/scripts/gcp/`, `infrastructure/monitoring/`).
**Claude cannot authenticate to GCP or Atlas** — authored + statically validated,
operator-activated. Idempotent (describe-or-create); create-only.

## Two layers (defense in depth)

| Layer | What | Where |
|-------|------|-------|
| **Primary** | MongoDB **Atlas native Cloud Backup** — daily snapshots, 30-day retention, continuous PITR (M10+) | `04-atlas-backup-policy.sh` (+ Atlas UI for PITR) |
| **Secondary** | **mongodump → GCS** daily, versioned bucket, 30-day lifecycle — portable archive, and the source of the `backup.failed` alert marker | `01`–`03` + `Dockerfile` / `entrypoint.sh` |

Meets the deployment-plan targets: **DB daily / 30-day retention**, **RPO ≤ 24 h /
RTO ≤ 4 h** (see `restore-runbook.md`).

## Files

| File | Role |
|------|------|
| `Dockerfile` + `entrypoint.sh` | Cloud Run Job image: mongodump → gzip → stream to GCS; emits `backup.started/succeeded/failed` JSON log markers |
| `01-backup-bucket.sh` | GCS bucket + 30-day lifecycle + versioning + uniform access |
| `02-backup-job.sh` | Cloud Run Job + least-priv runtime SA (bucket objectAdmin, secret accessor) |
| `03-scheduler.sh` | Cloud Scheduler daily trigger → the job (OAuth as the backup SA) |
| `04-atlas-backup-policy.sh` | Atlas native backup schedule (read-only; `--apply` to set) |
| `provision-backups.sh` | Orchestrator for 01→03 |
| `verify-backups.sh` | Read-only assertions (non-zero on any gap) |
| `restore-runbook.md` | Restore paths + post-restore checks + the **required restore drill** |
| `config.{staging,production}.sh` | Non-secret config (bucket, retention, schedule, Atlas ids) |

## Prerequisites

1. `gcloud` + `gsutil` installed; `gcloud auth login` with `roles/run.admin`,
   `roles/storage.admin`, `roles/cloudscheduler.admin`, `roles/iam.serviceAccountAdmin`
   on the project.
2. `MONGODB_URI` exists in Secret Manager (CD secrets step). A **read-only** Mongo
   user is recommended for the dump credentials.
3. Build + push the job image:
   ```bash
   cd infrastructure/backups
   gcloud builds submit --tag "$(grep -oP 'BACKUP_IMAGE="\K[^"]+' config.staging.sh)" .
   ```
4. For Atlas automation: `ATLAS_PUBLIC_KEY` / `ATLAS_PRIVATE_KEY` in the env, and
   `ATLAS_GROUP_ID` / `ATLAS_CLUSTER_NAME` set in `config.<env>.sh`.

## Run

```bash
cd infrastructure/backups

# GCS logical-backup pipeline (bucket → job → scheduler):
./provision-backups.sh staging

# Atlas native backup (read-only first, then apply):
./04-atlas-backup-policy.sh staging
./04-atlas-backup-policy.sh staging --apply

# First manual run + assert:
gcloud run jobs execute sajawat-staging-db-backup --region asia-south1
./verify-backups.sh staging

# Then the REQUIRED restore drill — see restore-runbook.md.
```

## Notes

- **Production** config is a placeholder until the prod project + Atlas cluster
  exist (D16); `verify-backups.sh production` fails until then.
- **Alerting:** wired into 1.10b.3 — the `backup.failed` marker drives the
  `backup_failed` log-metric + alert policy.
- **Storage backup** (product media) is deferred with 1.3-media; the runbook
  notes how to extend when the media bucket lands.
