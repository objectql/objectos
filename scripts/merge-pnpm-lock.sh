#!/bin/bash
# Git merge driver for pnpm-lock.yaml
# This script automatically resolves merge conflicts in pnpm-lock.yaml
# by regenerating it with pnpm install

set -e

# Arguments passed by git:
# %O - ancestor's version
# %A - current version  
# %B - other branches' version
# %P - pathname

ANCESTOR="$1"
CURRENT="$2"
OTHER="$3"
PATHNAME="$4"

echo "Resolving pnpm-lock.yaml merge conflict..."

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "Error: pnpm is not installed or not in PATH"
    echo "Please install pnpm: npm install -g pnpm"
    exit 1
fi

# Regenerate pnpm-lock.yaml by running pnpm install
echo "Running pnpm install to regenerate pnpm-lock.yaml..."
pnpm install --lockfile-only

# Copy the regenerated lockfile to the current version location
# This ensures git sees the file as resolved
cp pnpm-lock.yaml "$CURRENT"

echo "✓ pnpm-lock.yaml successfully regenerated and merge conflict resolved"
exit 0
