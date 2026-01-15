# Scripts

This directory contains utility scripts for the ObjectOS repository.

## merge-pnpm-lock.sh

Custom Git merge driver for automatically resolving conflicts in `pnpm-lock.yaml`.

**How it works:**
- When Git detects a merge conflict in `pnpm-lock.yaml`, this script is invoked
- It runs `pnpm install --lockfile-only` to regenerate the lockfile
- The regenerated file incorporates changes from both branches
- The conflict is automatically resolved

**Usage:**
This script is called automatically by Git when configured. Do not run manually.

## setup-merge-driver.sh

One-time setup script to configure the pnpm-lock.yaml merge driver.

**Usage:**
```bash
./scripts/setup-merge-driver.sh
```

**What it does:**
- Configures Git to use `merge-pnpm-lock.sh` as the merge driver for `pnpm-lock.yaml`
- This only needs to be run once per local clone of the repository

**Configuration details:**
- Sets `merge.pnpm-lock.name` in Git config
- Sets `merge.pnpm-lock.driver` to point to the merge script
- The `.gitattributes` file maps `pnpm-lock.yaml` to use this driver

## Why This Matters

In a monorepo with multiple packages, `pnpm-lock.yaml` frequently has merge conflicts when multiple branches add or update dependencies. Rather than manually resolving these conflicts (which is error-prone), the merge driver automatically regenerates the lockfile using pnpm's own dependency resolution logic.

This ensures:
- ✅ Consistent dependency resolution
- ✅ No manual merge conflict resolution needed
- ✅ Less time wasted on lockfile conflicts
- ✅ Reduced risk of corrupted lockfiles
