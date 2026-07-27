#!/usr/bin/env bash
# Shared helpers for the Sajawat Cloud Monitoring provisioning scripts
# (Milestone 1.10b.3 — Observability & Alerting).
#
# Sourced by the numbered scripts (01..05), provision-monitoring.sh and
# verify-monitoring.sh. No top-level side effects beyond defining functions +
# resolving the config, so it is safe to source repeatedly.
#
# Conventions (identical to infrastructure/scripts/gcp/lib.sh):
#   - Every gcloud call passes --project explicitly — never rely on the active
#     gcloud config, so a wrong active project can't misfire.
#   - Functions are namespaced mon::* to avoid clobbering the caller's shell.
#   - Create/ensure only. Nothing here deletes a resource.
#   - Idempotent: every resource is looked up by its stable display-name / id
#     and only created when absent ("describe-or-create").

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
mon::_color() { if [ -t 2 ]; then printf '\033[%sm' "$1" >&2; fi; }
mon::log()  { mon::_color '0;36'; printf '› %s\n' "$*" >&2; mon::_color '0'; }
mon::ok()   { mon::_color '0;32'; printf '✓ %s\n' "$*" >&2; mon::_color '0'; }
mon::warn() { mon::_color '1;33'; printf '! %s\n' "$*" >&2; mon::_color '0'; }
mon::err()  { mon::_color '0;31'; printf '✗ %s\n' "$*" >&2; mon::_color '0'; }
mon::die()  { mon::err "$*"; exit 1; }

# Echo a command, then run it — an auditable trail of every mutation.
mon::run() {
  mon::_color '0;90'; printf '  $ %s\n' "$*" >&2; mon::_color '0'
  "$@"
}

# ---------------------------------------------------------------------------
# Preconditions
# ---------------------------------------------------------------------------
mon::require_cmd() {
  command -v "$1" >/dev/null 2>&1 || mon::die "Required command not found on PATH: $1"
}

mon::require_auth() {
  local account
  account="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | head -n1)"
  [ -n "$account" ] || mon::die "No active gcloud account. Run: gcloud auth login"
  mon::log "Active gcloud account: $account"
}

# ---------------------------------------------------------------------------
# Config loading
# ---------------------------------------------------------------------------
MON_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# mon::load_config <env>   where env is "staging" or "production"
mon::load_config() {
  local env="${1:-}"
  case "$env" in
    staging|production) ;;
    "") mon::die "Usage: $(basename "${0:-script}") <staging|production>" ;;
    *)  mon::die "Unknown environment '$env' (expected: staging | production)" ;;
  esac

  local cfg="$MON_LIB_DIR/config.$env.sh"
  [ -f "$cfg" ] || mon::die "Config file not found: $cfg"
  # shellcheck source=/dev/null
  source "$cfg"

  : "${MON_ENV:?config missing MON_ENV}"
  : "${MON_PROJECT_ID:?config missing MON_PROJECT_ID}"
  : "${MON_REGION:?config missing MON_REGION}"
  : "${API_SERVICE:?config missing API_SERVICE}"
  : "${API_HOST:?config missing API_HOST}"
  : "${NOTIFICATION_EMAIL:?config missing NOTIFICATION_EMAIL}"
  : "${NOTIFICATION_DISPLAY_NAME:?config missing NOTIFICATION_DISPLAY_NAME}"
  : "${LATENCY_P95_MS:?config missing LATENCY_P95_MS}"
  # WEB_HOST is optional (web is not auto-deployed yet — AD-54); "" disables the
  # web uptime check + its alert.

  mon::log "Loaded config for '$MON_ENV' (project: $MON_PROJECT_ID, region: $MON_REGION)"
}

# ---------------------------------------------------------------------------
# Idempotent resolvers ("describe-or-create" building blocks)
# ---------------------------------------------------------------------------

# Resolve the resource name of the email notification channel for
# NOTIFICATION_DISPLAY_NAME, or empty string if it does not exist yet.
mon::channel_name() {
  gcloud beta monitoring channels list \
    --project="$MON_PROJECT_ID" \
    --filter="type='email' AND displayName='${NOTIFICATION_DISPLAY_NAME}'" \
    --format='value(name)' 2>/dev/null | head -n1
}

# Resolve an uptime check's config id by display name (empty if absent).
mon::uptime_name() {  # mon::uptime_name <display-name>
  gcloud monitoring uptime list-configs \
    --project="$MON_PROJECT_ID" \
    --filter="displayName='${1}'" \
    --format='value(name)' 2>/dev/null | head -n1
}

# Resolve an alert policy name by display name (empty if absent).
mon::policy_name() {  # mon::policy_name <display-name>
  gcloud alpha monitoring policies list \
    --project="$MON_PROJECT_ID" \
    --filter="displayName='${1}'" \
    --format='value(name)' 2>/dev/null | head -n1
}

# True if a log-based metric already exists.
mon::metric_exists() {  # mon::metric_exists <metric-name>
  gcloud logging metrics describe "$1" --project="$MON_PROJECT_ID" >/dev/null 2>&1
}

# Resolve a dashboard name by display name (empty if absent).
mon::dashboard_name() {  # mon::dashboard_name <display-name>
  gcloud monitoring dashboards list \
    --project="$MON_PROJECT_ID" \
    --filter="displayName='${1}'" \
    --format='value(name)' 2>/dev/null | head -n1
}

# ---------------------------------------------------------------------------
# Interaction
# ---------------------------------------------------------------------------
# mon::confirm "<prompt>" — returns 0 on an explicit "yes". Honors MON_ASSUME_YES=1.
mon::confirm() {
  if [ "${MON_ASSUME_YES:-0}" = "1" ]; then
    mon::warn "MON_ASSUME_YES=1 — skipping confirmation"
    return 0
  fi
  local reply
  printf '%s [type "yes" to proceed]: ' "$1" >&2
  read -r reply
  [ "$reply" = "yes" ]
}
