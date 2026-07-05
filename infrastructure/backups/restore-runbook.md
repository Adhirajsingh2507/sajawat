# Disaster Recovery — Restore Runbook (Milestone 1.10b.4)

**Objectives (deployment-plan):** RPO ≤ 24 h, RTO ≤ 4 h.

Two independent recovery paths. Prefer Atlas native restore (fastest, supports
point-in-time); use the mongodump archive as the portable fallback.

---

## Recovery objectives & how we meet them

| | Target | Mechanism |
|---|--------|-----------|
| **RPO** (max data loss) | ≤ 24 h | Atlas continuous PITR (seconds) **and** the daily 02:30 IST mongodump. |
| **RTO** (max downtime) | ≤ 4 h | Atlas snapshot restore is minutes–tens of minutes; mongorestore of one archive is well under an hour for ~200–300 SKUs of data. |

---

## Path A — Atlas native restore (PRIMARY)

1. Atlas UI → project → cluster → **Backup → Restore / Point in Time**.
2. Pick a **snapshot** (daily, 30-day retention) or a **PITR timestamp**.
3. Restore to the same cluster (in place) or a new cluster (safer — validate first).
4. If restoring to a new cluster, rotate `MONGODB_URI` in Secret Manager and
   redeploy the API (or update the Cloud Run service's secret reference).
5. Verify (see **Post-restore verification**).

## Path B — mongodump archive restore (FALLBACK)

The daily job writes `gs://<BACKUP_BUCKET>/backups/sajawat-<UTC>.archive.gz`.

```bash
# 1) Pick an archive (newest last).
gsutil ls gs://sajawat-<env>-db-backups/backups/

# 2) Stream it straight into the target cluster (no local disk).
gsutil cp gs://sajawat-<env>-db-backups/backups/sajawat-<TS>.archive.gz - \
  | mongorestore --uri="<TARGET_MONGODB_URI>" --archive --gzip --drop
```

`--drop` replaces existing collections — restore into a **fresh** database/cluster
when unsure, then cut `MONGODB_URI` over once validated.

---

## Post-restore verification (both paths)

1. **API readiness:** `GET /api/v1/health` → 200 (DB connected).
2. **Data spot-checks:** product count, a known order, a CRM lead all present.
3. **Orders:** place a COD test order end-to-end; confirm inventory decrement +
   `InventoryMovement`.
4. **CRM:** submit a wholesale enquiry; confirm it persists.
5. Re-enable production traffic only after 1–4 pass.

---

## Restore drill (REQUIRED before v1.0.0 — the 1.10b.4 closure gate)

A backup is not "done" until a restore has been proven. Perform on **staging**:

1. Run the backup job once: `gcloud run jobs execute sajawat-staging-db-backup --region asia-south1`.
2. Confirm the archive landed (`verify-backups.sh staging` shows a recent object).
3. Restore it into a **throwaway** cluster/db via Path B.
4. Run **Post-restore verification** against that target.
5. Record the wall-clock time (must be < RTO) and the archive age (must be < RPO).
6. Tear down the throwaway target.

Log the drill result (date, timings, operator) in the ops log; re-run after any
change to the backup pipeline.

---

## Notes

- **Storage (GCS media):** product media is deferred (1.3-media). When it lands,
  enable object versioning + a matching 30-day lifecycle / bucket dual-write on
  the media bucket and add it to this runbook.
- **Backup failure alerting:** the job emits a `backup.failed` structured log
  marker; the 1.10b.3 `backup_failed` log-metric + alert policy page on it.
