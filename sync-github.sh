#!/usr/bin/env bash
# Sync Replit → GitHub via REST API
# Usage: bash sync-github.sh

set -e

echo "🔄 Syncing Replit → GitHub..."

# Check token
if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  echo "❌ GITHUB_PERSONAL_ACCESS_TOKEN not set"
  exit 1
fi

# Run the Node.js sync script
node /home/runner/workspace/sync-github.mjs
