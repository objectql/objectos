#!/bin/bash
# Setup script for configuring the pnpm-lock.yaml merge driver
# This needs to be run once by each developer after cloning the repository

set -e

echo "Setting up pnpm-lock.yaml merge driver..."

# Get the repository root directory
REPO_ROOT="$(git rev-parse --show-toplevel)"
SCRIPT_PATH="$REPO_ROOT/scripts/merge-pnpm-lock.sh"

# Configure the merge driver in git config
git config merge.pnpm-lock.name "pnpm lockfile merge driver"
git config merge.pnpm-lock.driver "$SCRIPT_PATH %O %A %B %P"

echo "✓ pnpm-lock.yaml merge driver configured successfully!"
echo ""
echo "The merge driver will now automatically resolve conflicts in pnpm-lock.yaml"
echo "by regenerating the lockfile when conflicts occur."
