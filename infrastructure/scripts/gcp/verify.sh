#!/usr/bin/env bash
# 0.10b.1 — Read-only verifier. Asserts every resource/binding from steps 01..05
# exists and is correctly scoped. Makes NO changes. Exits non-zero on any failure.
#
# Usage: ./verify.sh staging   |   ./verify.sh production
set -uo pipefail   # note: NOT -e — we want to run every check and tally failures
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

gcp::load_config "${1:-}"
gcp::require_cmd gcloud
gcp::require_auth

PASS=0
FAIL=0
check() {  # check "<label>" <cmd...>
  local label="$1"; shift
  if "$@" >/dev/null 2>&1; then
    gcp::ok "$label"; PASS=$((PASS + 1))
  else
    gcp::err "$label"; FAIL=$((FAIL + 1))
  fi
}

# Assert that an IAM policy on a resource contains a given member+role pair.
# member_has <descr> <gcloud-getpolicy-cmd...> -- <member> <role>
#
# We filter server-side by ROLE only (quoted, since role ids contain '/' and '.')
# and match the MEMBER client-side with an exact fixed-string line compare —
# member values like "principalSet://…/attribute.environment/production" contain
# ':' and '/' that the gcloud filter grammar would otherwise misparse.
member_has() {
  local label="$1"; shift
  local args=() member role
  while [ "$1" != "--" ]; do args+=("$1"); shift; done
  shift; member="$1"; role="$2"
  if "${args[@]}" --flatten='bindings[].members' \
       --filter="bindings.role=\"${role}\"" \
       --format='value(bindings.members)' 2>/dev/null \
       | grep -Fxq "$member"; then
    gcp::ok "$label"; PASS=$((PASS + 1))
  else
    gcp::err "$label"; FAIL=$((FAIL + 1))
  fi
}

api_email="$(gcp::sa_email "$API_RUNTIME_SA")"
web_email="$(gcp::sa_email "$WEB_RUNTIME_SA")"
admin_email="$(gcp::sa_email "$ADMIN_RUNTIME_SA")"
deployer_email="$(gcp::sa_email "$DEPLOYER_SA")"

gcp::log "── Artifact Registry ──"
check "AR repo '$AR_REPO' exists" \
  gcloud artifacts repositories describe "$AR_REPO" --location="$GCP_REGION" --project="$GCP_PROJECT_ID"

gcp::log "── Secret Manager (containers) ──"
for s in "${SECRETS[@]}"; do
  check "secret '$s' exists" gcloud secrets describe "$s" --project="$GCP_PROJECT_ID"
done

gcp::log "── Service accounts ──"
for e in "$api_email" "$web_email" "$admin_email" "$deployer_email"; do
  check "SA exists: $e" gcloud iam service-accounts describe "$e" --project="$GCP_PROJECT_ID"
done

gcp::log "── api-run reads secrets; web/admin-run do NOT ──"
for s in "${SECRETS[@]}"; do
  member_has "api-run secretAccessor on $s" \
    gcloud secrets get-iam-policy "$s" --project="$GCP_PROJECT_ID" \
    -- "serviceAccount:${api_email}" "roles/secretmanager.secretAccessor"
done
for s in "${SECRETS[@]}"; do
  if gcloud secrets get-iam-policy "$s" --project="$GCP_PROJECT_ID" \
       --flatten='bindings[].members' \
       --filter="bindings.role=\"roles/secretmanager.secretAccessor\"" \
       --format='value(bindings.members)' 2>/dev/null \
       | grep -Fxq "serviceAccount:${web_email}"; then
    gcp::err "web-run UNEXPECTEDLY has secretAccessor on $s"; FAIL=$((FAIL + 1))
  else
    gcp::ok "web-run has no secret access on $s"; PASS=$((PASS + 1))
  fi
done

gcp::log "── Deployer IAM ──"
member_has "deployer artifactregistry.writer on repo" \
  gcloud artifacts repositories get-iam-policy "$AR_REPO" --location="$GCP_REGION" --project="$GCP_PROJECT_ID" \
  -- "serviceAccount:${deployer_email}" "roles/artifactregistry.writer"
member_has "deployer run.admin on project" \
  gcloud projects get-iam-policy "$GCP_PROJECT_ID" \
  -- "serviceAccount:${deployer_email}" "roles/run.admin"
for rt_email in "$api_email" "$web_email" "$admin_email"; do
  member_has "deployer serviceAccountUser on $rt_email" \
    gcloud iam service-accounts get-iam-policy "$rt_email" --project="$GCP_PROJECT_ID" \
    -- "serviceAccount:${deployer_email}" "roles/iam.serviceAccountUser"
done

gcp::log "── Workload Identity Federation ──"
check "WIF pool '$WIF_POOL_ID' exists" \
  gcloud iam workload-identity-pools describe "$WIF_POOL_ID" --location=global --project="$GCP_PROJECT_ID"
check "WIF provider '$WIF_PROVIDER_ID' exists" \
  gcloud iam workload-identity-pools providers describe "$WIF_PROVIDER_ID" \
    --workload-identity-pool="$WIF_POOL_ID" --location=global --project="$GCP_PROJECT_ID"
member_has "deployer workloadIdentityUser for environment '$GITHUB_ENVIRONMENT'" \
  gcloud iam service-accounts get-iam-policy "$deployer_email" --project="$GCP_PROJECT_ID" \
  -- "$(gcp::wif_principal_set)" "roles/iam.workloadIdentityUser"

echo >&2
if [ "$FAIL" -eq 0 ]; then
  gcp::ok "VERIFY PASSED — $PASS checks green for '$GCP_ENV'"
  exit 0
else
  gcp::err "VERIFY FAILED — $FAIL failed, $PASS passed for '$GCP_ENV'"
  exit 1
fi
