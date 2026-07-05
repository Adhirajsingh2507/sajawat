#!/usr/bin/env bash
# 1.3-media · Public media bucket for product images/video.
#
# API-proxied uploads: the api Cloud Run service (runtime SA `api-run`) writes
# optimized objects here; the public storefront reads them directly. So the
# bucket is public-read + the api-run SA gets objectAdmin. No bucket CORS is
# needed (the browser never uploads straight to GCS — it posts to the API).
#
# Idempotent: create-or-skip the bucket; always (re)apply the two IAM grants.
# After running, set GCS_BUCKET + GCS_PROJECT_ID on the api service to activate.
#
# Usage: ./06-media-bucket.sh <staging|production>
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

gcp::load_config "${1:-}"
gcp::require_cmd gcloud
gcp::require_cmd gsutil
gcp::require_auth

: "${MEDIA_BUCKET:?config missing MEDIA_BUCKET}"
api_sa="$(gcp::sa_email "$API_RUNTIME_SA")"

if gsutil ls -b -p "$GCP_PROJECT_ID" "gs://$MEDIA_BUCKET" >/dev/null 2>&1; then
  gcp::ok "Bucket already exists: gs://$MEDIA_BUCKET"
else
  gcp::log "Creating public media bucket gs://$MEDIA_BUCKET ($GCP_REGION)"
  gcp::run gsutil mb -p "$GCP_PROJECT_ID" -l "$GCP_REGION" -b on "gs://$MEDIA_BUCKET"
fi

# Public read (catalog media is public). Org "public access prevention" can block
# this — the operator must allow it on this bucket if a policy is enforced.
gcp::log "Granting public read (allUsers:objectViewer)"
gcp::run gsutil iam ch allUsers:objectViewer "gs://$MEDIA_BUCKET"

# The API runtime SA writes objects.
gcp::log "Granting objectAdmin to $api_sa"
gcp::run gsutil iam ch "serviceAccount:${api_sa}:objectAdmin" "gs://$MEDIA_BUCKET"

gcp::ok "Media bucket ready: gs://$MEDIA_BUCKET"
gcp::warn "Activate uploads: set GCS_BUCKET=$MEDIA_BUCKET and GCS_PROJECT_ID=$GCP_PROJECT_ID on the api Cloud Run service."
