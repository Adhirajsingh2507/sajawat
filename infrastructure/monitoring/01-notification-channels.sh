#!/usr/bin/env bash
# 1.10b.3 · Step 01 — Email notification channel.
# Idempotent: creates the channel only if one with the same display name is
# absent. Alert policies (step 04) resolve it by display name.
#
# Usage: ./01-notification-channels.sh <staging|production>
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

mon::load_config "${1:-}"
mon::require_cmd gcloud
mon::require_auth

existing="$(mon::channel_name)"
if [ -n "$existing" ]; then
  mon::ok "Notification channel already exists: $existing"
  exit 0
fi

mon::log "Creating email notification channel → $NOTIFICATION_EMAIL"
mon::run gcloud beta monitoring channels create \
  --project="$MON_PROJECT_ID" \
  --type=email \
  --display-name="$NOTIFICATION_DISPLAY_NAME" \
  --channel-labels="email_address=${NOTIFICATION_EMAIL}"

mon::ok "Notification channel created ($NOTIFICATION_DISPLAY_NAME)"
