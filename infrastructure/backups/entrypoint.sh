#!/usr/bin/env bash
# Cloud Run Job entrypoint (Milestone 1.10b.4): mongodump → gzip archive →
# stream straight to GCS (no local disk). Emits structured JSON log markers that
# Cloud Logging ingests, so the 1.10b.3 `backup.failed` log-metric + alert fire
# on failure.
#
# Required env: MONGODB_URI, BACKUP_BUCKET.  Optional: BACKUP_PREFIX (default "backups").
set -uo pipefail

: "${MONGODB_URI:?MONGODB_URI is required}"
: "${BACKUP_BUCKET:?BACKUP_BUCKET is required}"
PREFIX="${BACKUP_PREFIX:-backups}"

TS="$(date -u +%Y%m%dT%H%M%SZ)"
OBJECT="gs://${BACKUP_BUCKET}/${PREFIX}/sajawat-${TS}.archive.gz"

# Structured Cloud Logging line: <severity> <event> [extra-json-fragment]
log_event() {
  printf '{"severity":"%s","event":"%s","object":"%s","timestamp":"%s"%s}\n' \
    "$1" "$2" "$OBJECT" "$(date -u +%FT%TZ)" "${3:-}"
}

log_event "INFO" "backup.started" ''

# --archive + --gzip to stdout, piped straight into the GCS object. pipefail
# makes the pipeline fail if EITHER mongodump or gsutil fails.
if mongodump --uri="$MONGODB_URI" --archive --gzip | gsutil -q cp - "$OBJECT"; then
  log_event "INFO" "backup.succeeded" ''
  exit 0
fi

code=$?
log_event "ERROR" "backup.failed" ",\"exitCode\":${code}"
exit 1
