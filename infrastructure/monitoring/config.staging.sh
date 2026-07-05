#!/usr/bin/env bash
# Non-secret configuration for Sajawat STAGING Cloud Monitoring (Milestone 1.10b.3).
# Committed on purpose: identifiers, hostnames, thresholds — NO secrets.
#
# shellcheck disable=SC2034  # vars are consumed by the scripts that source this file

MON_ENV="staging"

MON_PROJECT_ID="sajawat-staging"
MON_REGION="asia-south1"

# Cloud Run API service name + its public host (the run.app URL, or a custom
# domain once mapped). Uptime checks + log-metric filters key on these.
API_SERVICE="sajawat-api-staging"
API_HOST="sajawat-api-staging-1019894285252.asia-south1.run.app"

# Web host — EMPTY until the web app is deployed (API-only CD today, AD-54).
# When web ships to Cloud Run, set its host here to enable the web uptime check
# + "Web down" alert (both are skipped while this is empty).
WEB_HOST=""

# Where alert notifications go. Operator MUST set a real inbox before running —
# the email channel is created from this value.
NOTIFICATION_EMAIL="alerts-staging@sajawat.example"
NOTIFICATION_DISPLAY_NAME="Sajawat staging alerts (email)"

# Alerting thresholds.
LATENCY_P95_MS="500"   # API request p95 SLO (docs/sajawat-testing-strategy.md)
