#!/usr/bin/env bash
# Shared helpers for the Sajawat GCP provisioning scripts (Milestone 0.10b.1).
#
# This file is *sourced* by the numbered provisioning scripts and by
# provision.sh / verify.sh. It carries no top-level side effects beyond defining
# functions, so it is safe to source repeatedly.
#
# Conventions:
#   - Every gcloud call MUST pass --project explicitly (no reliance on the
#     active gcloud config) so a wrong active project can never misfire.
#   - Functions are namespaced gcp::* to avoid clobbering the caller's shell.
#   - Create/bind only. Nothing here ever deletes a resource.

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
gcp::_color() { if [ -t 2 ]; then printf '\033[%sm' "$1" >&2; fi; }

gcp::log()  { gcp::_color '0;36'; printf '› %s\n' "$*" >&2; gcp::_color '0'; }
gcp::ok()   { gcp::_color '0;32'; printf '✓ %s\n' "$*" >&2; gcp::_color '0'; }
gcp::warn() { gcp::_color '1;33'; printf '! %s\n' "$*" >&2; gcp::_color '0'; }
gcp::err()  { gcp::_color '0;31'; printf '✗ %s\n' "$*" >&2; gcp::_color '0'; }
gcp::die()  { gcp::err "$*"; exit 1; }

# Echo a command, then run it. Keeps an auditable trail of every mutation.
gcp::run() {
  gcp::_color '0;90'; printf '  $ %s\n' "$*" >&2; gcp::_color '0'
  "$@"
}

# ---------------------------------------------------------------------------
# Preconditions
# ---------------------------------------------------------------------------
gcp::require_cmd() {
  command -v "$1" >/dev/null 2>&1 || gcp::die "Required command not found on PATH: $1"
}

gcp::require_auth() {
  local account
  account="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | head -n1)"
  [ -n "$account" ] || gcp::die "No active gcloud account. Run: gcloud auth login"
  gcp::log "Active gcloud account: $account"
}

# ---------------------------------------------------------------------------
# Config loading
# ---------------------------------------------------------------------------
# Resolve the directory this library lives in, so config files load regardless
# of the caller's working directory.
GCP_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# gcp::load_config <env>   where env is "staging" or "production"
gcp::load_config() {
  local env="${1:-}"
  case "$env" in
    staging|production) ;;
    "") gcp::die "Usage: $(basename "${0:-script}") <staging|production>" ;;
    *)  gcp::die "Unknown environment '$env' (expected: staging | production)" ;;
  esac

  local cfg="$GCP_LIB_DIR/config.$env.sh"
  [ -f "$cfg" ] || gcp::die "Config file not found: $cfg"
  # shellcheck source=/dev/null
  source "$cfg"

  : "${GCP_ENV:?config missing GCP_ENV}"
  : "${GCP_PROJECT_ID:?config missing GCP_PROJECT_ID}"
  : "${GCP_REGION:?config missing GCP_REGION}"
  : "${AR_REPO:?config missing AR_REPO}"
  : "${GITHUB_REPO:?config missing GITHUB_REPO}"
  : "${GITHUB_OWNER:?config missing GITHUB_OWNER}"
  : "${GITHUB_ENVIRONMENT:?config missing GITHUB_ENVIRONMENT}"
  : "${WIF_POOL_ID:?config missing WIF_POOL_ID}"
  : "${WIF_PROVIDER_ID:?config missing WIF_PROVIDER_ID}"
  : "${DEPLOYER_SA:?config missing DEPLOYER_SA}"
  : "${API_RUNTIME_SA:?config missing API_RUNTIME_SA}"
  : "${WEB_RUNTIME_SA:?config missing WEB_RUNTIME_SA}"
  : "${ADMIN_RUNTIME_SA:?config missing ADMIN_RUNTIME_SA}"
  if [ "${#SECRETS[@]}" -eq 0 ]; then gcp::die "config missing SECRETS[]"; fi

  gcp::log "Loaded config for '$GCP_ENV' (project: $GCP_PROJECT_ID, region: $GCP_REGION)"
}

# ---------------------------------------------------------------------------
# Derived values
# ---------------------------------------------------------------------------
gcp::sa_email() { printf '%s@%s.iam.gserviceaccount.com' "$1" "$GCP_PROJECT_ID"; }

# Resolve the numeric project number (needed for WIF principalSet members).
# Cached after first lookup.
gcp::project_number() {
  if [ -z "${_GCP_PROJECT_NUMBER:-}" ]; then
    _GCP_PROJECT_NUMBER="$(gcloud projects describe "$GCP_PROJECT_ID" \
      --format='value(projectNumber)' 2>/dev/null || true)"
    [ -n "$_GCP_PROJECT_NUMBER" ] || \
      gcp::die "Could not resolve project number for '$GCP_PROJECT_ID' (does it exist? are you authed?)"
  fi
  printf '%s' "$_GCP_PROJECT_NUMBER"
}

gcp::wif_provider_resource() {
  printf 'projects/%s/locations/global/workloadIdentityPools/%s/providers/%s' \
    "$(gcp::project_number)" "$WIF_POOL_ID" "$WIF_PROVIDER_ID"
}

gcp::wif_principal_set() {
  # Members scoped to a single GitHub Environment claim value.
  printf 'principalSet://iam.googleapis.com/projects/%s/locations/global/workloadIdentityPools/%s/attribute.environment/%s' \
    "$(gcp::project_number)" "$WIF_POOL_ID" "$GITHUB_ENVIRONMENT"
}

# ---------------------------------------------------------------------------
# Interaction
# ---------------------------------------------------------------------------
# gcp::confirm "<prompt>"  — returns 0 on an explicit "yes". Honors GCP_ASSUME_YES=1.
gcp::confirm() {
  if [ "${GCP_ASSUME_YES:-0}" = "1" ]; then
    gcp::warn "GCP_ASSUME_YES=1 — skipping confirmation"
    return 0
  fi
  local reply
  printf '%s [type "yes" to proceed]: ' "$1" >&2
  read -r reply
  [ "$reply" = "yes" ]
}
