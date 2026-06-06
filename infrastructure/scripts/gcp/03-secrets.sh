#!/usr/bin/env bash
# 0.10b.1 — Step 03: create Secret Manager secret *containers* (no values).
#
# This script NEVER handles secret values. It only creates the empty secrets so
# IAM and the deploy workflow have something to reference. Values are injected
# out-of-band via stdin (printed instructions below; also in README.md). This
# keeps secrets out of git, out of argv, and out of CI logs.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

gcp::load_config "${1:-}"
gcp::require_cmd gcloud
gcp::require_auth

for s in "${SECRETS[@]}"; do
  if gcloud secrets describe "$s" --project="$GCP_PROJECT_ID" >/dev/null 2>&1; then
    gcp::ok "Secret already exists: $s"
  else
    gcp::log "Creating secret container: $s"
    gcp::run gcloud secrets create "$s" \
      --replication-policy=automatic \
      --project="$GCP_PROJECT_ID"
    gcp::ok "Created $s (no version yet)"
  fi
done

cat >&2 <<EOF

------------------------------------------------------------------------
NEXT (operator, out-of-band — do NOT paste secrets on the command line):
Inject a value per secret using stdin. Examples:

  printf '%s' "\$MONGODB_URI"        | gcloud secrets versions add MONGODB_URI \\
      --project=$GCP_PROJECT_ID --data-file=-
  printf '%s' "\$JWT_ACCESS_SECRET"  | gcloud secrets versions add JWT_ACCESS_SECRET \\
      --project=$GCP_PROJECT_ID --data-file=-
  printf '%s' "\$JWT_REFRESH_SECRET" | gcloud secrets versions add JWT_REFRESH_SECRET \\
      --project=$GCP_PROJECT_ID --data-file=-

Use ROTATED values (Atlas password + freshly generated JWT secrets, ≥32 chars,
access != refresh). Generate a JWT secret with:  openssl rand -base64 48
------------------------------------------------------------------------
EOF
