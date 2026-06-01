#!/usr/bin/env sh
# Pre-commit guard (Milestone 0.6): refuse to commit real environment files,
# which may contain secrets. Only `*.example` templates may be committed.
#
# Matches `.env`, `.env.<anything>` at any depth (e.g. `apps/web/.env.local`),
# and excludes any path ending in `.example`.
set -eu

staged=$(git diff --cached --name-only --diff-filter=ACM \
  | grep -E '(^|/)\.env(\..+)?$' \
  | grep -vE '\.example$' \
  || true)

if [ -n "$staged" ]; then
  echo "✖ Refusing to commit environment files (possible secrets):"
  echo "$staged" | sed 's/^/    /'
  echo ""
  echo "  Only .env.example templates may be committed."
  echo "  Unstage them:  git restore --staged <file>"
  exit 1
fi
