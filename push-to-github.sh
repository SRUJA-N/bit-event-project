#!/bin/bash
# Run this from the Replit Shell tab:
#   bash push-to-github.sh YOUR_GITHUB_TOKEN
#
# Example:
#   bash push-to-github.sh ghp_xxxxxxxxxxxx

TOKEN=$1
if [ -z "$TOKEN" ]; then
  echo "Usage: bash push-to-github.sh YOUR_GITHUB_TOKEN"
  exit 1
fi

REMOTE="https://SRUJA-N:${TOKEN}@github.com/SRUJA-N/bit_event_project.git"

git remote remove origin 2>/dev/null || true
git remote remove gitsafe-backup 2>/dev/null || true
git remote add origin "$REMOTE"
git branch -M main
git push -u origin main --force

echo ""
echo "Done! Check https://github.com/SRUJA-N/bit_event_project"
