#!/usr/bin/env bash
# Non-secret configuration for Sajawat PRODUCTION Cloud Monitoring (Milestone 1.10b.3).
# Committed on purpose: identifiers, hostnames, thresholds — NO secrets.
#
# NOTE: production GCP project + services do not exist yet (D16 — production CD is
# authored but unrun). The IDs/hosts below are placeholders the operator fills in
# when the production project is provisioned. verify-monitoring.sh will fail until
# then, by design.
#
# shellcheck disable=SC2034  # vars are consumed by the scripts that source this file

MON_ENV="production"

MON_PROJECT_ID="sajawat-production"    # placeholder — set once the prod project exists
MON_REGION="asia-south1"

API_SERVICE="sajawat-api"
API_HOST="REPLACE_WITH_PROD_API_HOST"  # e.g. api.sajawat.com or the run.app URL

# Web host — set when the production web app is deployed; empty disables its check.
WEB_HOST=""

# Where production alerts go (on-call inbox / distribution list).
NOTIFICATION_EMAIL="alerts@sajawat.example"
NOTIFICATION_DISPLAY_NAME="Sajawat production alerts (email)"

LATENCY_P95_MS="500"
