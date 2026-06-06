#!/usr/bin/env bash
# Non-secret configuration for the Sajawat STAGING GCP project (Milestone 0.10b.1).
# Committed on purpose: contains only identifiers, names, and region — NO secrets.
# Secret *values* are injected out-of-band via stdin (see 03-secrets.sh / README).
#
# shellcheck disable=SC2034  # vars are consumed by the scripts that source this file

GCP_ENV="staging"

# Project: existing project that currently hosts the manual Cloud Run deploy.
GCP_PROJECT_ID="sajawat-staging"
GCP_PROJECT_NUMBER="1019894285252"   # documentation only; scripts resolve it live

GCP_REGION="asia-south1"

# Artifact Registry (Docker) repository name.
AR_REPO="sajawat"

# GitHub source identity (used to pin the WIF attribute-condition).
GITHUB_REPO="Adhirajsingh2507/sajawat"
GITHUB_OWNER="Adhirajsingh2507"

# GitHub Environment whose OIDC claim is allowed to impersonate the deployer SA.
GITHUB_ENVIRONMENT="staging"

# Workload Identity Federation pool/provider IDs (created per project).
WIF_POOL_ID="github-pool"
WIF_PROVIDER_ID="github-oidc"

# Service-account IDs (the @<project>.iam.gserviceaccount.com suffix is derived).
DEPLOYER_SA="sajawat-deployer"      # GitHub Actions deployer (keyless via WIF)
API_RUNTIME_SA="sajawat-api-run"    # Cloud Run runtime SA for the API (reads secrets)
WEB_RUNTIME_SA="sajawat-web-run"    # Cloud Run runtime SA for web (no secret access)
ADMIN_RUNTIME_SA="sajawat-admin-run" # Cloud Run runtime SA for admin (no secret access)

# Secret Manager secret containers to create (VALUES added out-of-band).
# JWT_ISSUER / JWT_AUDIENCE are NOT here — they are plain Cloud Run env vars.
SECRETS=("MONGODB_URI" "JWT_ACCESS_SECRET" "JWT_REFRESH_SECRET")
