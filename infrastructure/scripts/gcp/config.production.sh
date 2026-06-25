#!/usr/bin/env bash
# Non-secret configuration for the Sajawat PRODUCTION GCP project (Milestone 0.10b.1).
# Committed on purpose: contains only identifiers, names, and region — NO secrets.
#
# NOTE: the production project does not exist yet. Either:
#   1) create it manually and set GCP_PROJECT_ID below to match, or
#   2) run ./00-bootstrap-project.sh (guarded) to create + link billing,
#      then keep GCP_PROJECT_ID in sync.
# Project IDs are globally unique; if "sajawat-production" is taken, pick another
# and update this value before running provision.sh.
#
# shellcheck disable=SC2034  # vars are consumed by the scripts that source this file

GCP_ENV="production"

GCP_PROJECT_ID="sajawat-production"   # CONFIRM/ADJUST before provisioning
GCP_PROJECT_NUMBER=""                  # resolved live once the project exists

GCP_REGION="asia-south1"

AR_REPO="sajawat"

GITHUB_REPO="Adhirajsingh2507/sajawat"
GITHUB_OWNER="Adhirajsingh2507"

# Production binds on the "production" GitHub Environment claim — that Environment
# carries the required-reviewer protection, so the reviewer gate is enforced at
# the identity layer, not just by branch convention.
GITHUB_ENVIRONMENT="production"

WIF_POOL_ID="github-pool"
WIF_PROVIDER_ID="github-oidc"

DEPLOYER_SA="sajawat-deployer"
API_RUNTIME_SA="sajawat-api-run"
WEB_RUNTIME_SA="sajawat-web-run"
ADMIN_RUNTIME_SA="sajawat-admin-run"

# JWT_ISSUER / JWT_AUDIENCE and RAZORPAY_KEY_ID / WHATSAPP_PHONE_NUMBER_ID are
# NOT secret — they ship as plain Cloud Run env vars. Only true secrets here.
SECRETS=(
  "MONGODB_URI"
  "JWT_ACCESS_SECRET"
  "JWT_REFRESH_SECRET"
  "RAZORPAY_KEY_SECRET"     # D18 — online payments (absent => checkout 501)
  "RAZORPAY_WEBHOOK_SECRET" # D18 — webhook HMAC verification
  "WHATSAPP_ACCESS_TOKEN"   # D19 — B2B lead alerts (absent => skip-and-log)
)
