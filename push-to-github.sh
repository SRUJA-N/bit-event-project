#!/bin/bash
# Push this project to GitHub.
#
# Usage (from the Shell tab):
#   bash push-to-github.sh YOUR_GITHUB_TOKEN
#
# How to get a token:
#   1. Go to https://github.com/settings/tokens
#   2. Click "Generate new token (classic)"
#   3. Tick the "repo" scope
#   4. Copy the token and paste it below
#
# Example:
#   bash push-to-github.sh ghp_xxxxxxxxxxxxxxxxxxxx

TOKEN=$1
if [ -z "$TOKEN" ]; then
  echo "Usage: bash push-to-github.sh YOUR_GITHUB_TOKEN"
  exit 1
fi

REPO="SRUJA-N/bit-event-project"
REMOTE="https://SRUJA-N:${TOKEN}@github.com/${REPO}.git"

git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"
git branch -M main
git push -u origin main --force

echo ""
echo "Done! View at: https://github.com/${REPO}"
