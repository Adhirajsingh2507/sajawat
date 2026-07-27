# Observability & Alerting (Milestone 1.10b.3)

Operator-run Cloud Monitoring provisioning for the Sajawat API, mirroring the
CD provisioning pattern in `infrastructure/scripts/gcp/`. **Claude cannot
authenticate to GCP** — these scripts are authored + statically validated and
**run by an operator**. Everything is idempotent (describe-or-create) and
create-only (nothing is ever deleted).

## What it provisions

| Step | Resource | Maps to (deployment-plan) |
|------|----------|---------------------------|
| `01-notification-channels.sh` | Email notification channel | Alerting delivery |
| `02-uptime-checks.sh` | Uptime checks: API `/health` (liveness), API `/api/v1/health` (**readiness = DB-health monitor**, 503 when Mongo down), web `/` (if `WEB_HOST`) | Website/API/Database availability |
| `03-log-metrics.sh` | Log-based metrics: `api_5xx`, `api_error_logs`, `payment_failed`, `order_placed`, `backup_failed` | Order processing, error rate, payment/backup failure |
| `04-alert-policies.sh` | Alert policies (API down, readiness/DB down, web down, 5xx elevated, error logs elevated, payment failures, backup failure, latency p95) → the email channel | Server/API/DB/Payment/Backup failure, High error rate |
| `05-dashboard.sh` | Ops dashboard (request rate, latency p95, 5xx, orders placed) | Monitoring |

The `payment_failed` / `order_placed` / `backup_failed` metrics key on
`jsonPayload.event` markers emitted by `services/api/src/observability/events.ts`
(app side) and the 1.10b.4 backup job. **Keep those event ids in sync** with
`03-log-metrics.sh`.

## Prerequisites

1. `gcloud` installed and `gcloud auth login` as a principal with
   `roles/monitoring.editor` + `roles/logging.configWriter` on the target project.
2. The API is deployed to Cloud Run and reachable at `API_HOST` (staging is live;
   production is pending D16).
3. Edit `config.<env>.sh`: set a **real** `NOTIFICATION_EMAIL`, confirm
   `API_HOST`/`API_SERVICE`, and set `WEB_HOST` only once the web app is deployed
   (empty disables the web uptime check + "Web down" alert — API-only CD, AD-54).

## Run

```bash
cd infrastructure/monitoring

# Provision everything (prompts once; steps are individually idempotent):
./provision-monitoring.sh staging

# Or a single step:
./02-uptime-checks.sh staging

# Assert everything exists (read-only, non-zero on any gap):
./verify-monitoring.sh staging
```

## Notes & caveats

- **gcloud surfaces:** notification channels use `gcloud beta monitoring
  channels`; alert policies use `gcloud alpha monitoring policies`. These are the
  documented surfaces at authoring time — if a future gcloud promotes them to GA,
  update the `mon::*` helpers in `lib.sh` (one place).
- **Thresholds** (`04-alert-policies.sh`) are conservative starting points
  (5xx > 10 / 5 min, error logs > 20 / 5 min, any payment/backup failure, latency
  p95 > `LATENCY_P95_MS`). Tune against real staging traffic.
- **Changing a metric filter or policy** is delete-then-re-run — the scripts
  never mutate an existing resource in place (safe-by-default).
- **Production** (`config.production.sh`) is a placeholder until the production
  GCP project exists (D16); `verify-monitoring.sh production` will fail until then.
- **Backup-failure alert** depends on the 1.10b.4 backup job emitting a
  `backup.failed` log marker; the metric + policy are pre-provisioned here so the
  alert lights up as soon as that job ships.
