# pnpm Lockfile Hash Format Mismatch Fix

## Problem

The CI/CD pipeline for PR #142 (branch: `copilot/optimize-kernel-dependencies`) was failing with the following error:

```
ERR_PNPM_LOCKFILE_CONFIG_MISMATCH  Cannot proceed with the frozen installation. The current "patchedDependencies" configuration doesn't match the value found in the lockfile

Update your lockfile using "pnpm install --no-frozen-lockfile"
```

Reference: https://github.com/objectstack-ai/objectos/actions/runs/21510222290/job/61975178955#step:5:1

## Root Cause

The `pnpm-lock.yaml` file in the PR branch contained SHA-256 hashes for patched dependencies, while the main branch uses base32-encoded hashes (pnpm's default format). This format mismatch caused pnpm to reject the frozen lockfile installation.

**Main branch format:**
```yaml
patchedDependencies:
  '@objectstack/objectql@0.6.1':
    hash: m453g2cynjjgivlraeycde4nqm  # base32-encoded
    path: patches/@objectstack__objectql@0.6.1.patch
```

**PR branch format (before fix):**
```yaml
patchedDependencies:
  '@objectstack/objectql@0.6.1':
    hash: ee45cfa5b5be581fbe98b32ba5615b9369fb8be0c8a20d35f5c4988453a5720a  # SHA-256
    path: patches/@objectstack__objectql@0.6.1.patch
```

## Solution

Regenerate the `pnpm-lock.yaml` file to use the consistent hash format:

```bash
pnpm install --no-frozen-lockfile
```

This command:
1. Regenerates the lockfile with the correct hash format
2. Maintains all existing dependencies and versions
3. Ensures compatibility with the main branch configuration

## Verification

After regenerating, verify the fix works:

```bash
# Clean install to verify
rm -rf node_modules
pnpm install --frozen-lockfile

# Run tests to ensure nothing broke
pnpm test
```

## Changes Made

- Updated `pnpm-lock.yaml` with base32-encoded hashes for patched dependencies
- Changed hash for `@objectstack/objectql@0.6.1` from SHA-256 to base32 format
- Changed hash for `@objectstack/runtime@0.6.1` from SHA-256 to base32 format
- Removed unnecessary metadata from sharp package entries (67 lines reduced)

## Test Results

All 677 tests pass successfully after the fix:
- 30 test suites passed
- 677 tests passed
- Time: 21.546s

## Applying the Fix to PR #142

To apply this fix to the failing PR branch (`copilot/optimize-kernel-dependencies`):

1. Checkout the PR branch:
   ```bash
   git checkout copilot/optimize-kernel-dependencies
   ```

2. Regenerate the lockfile:
   ```bash
   pnpm install --no-frozen-lockfile
   ```

3. Verify the fix:
   ```bash
   rm -rf node_modules
   pnpm install --frozen-lockfile
   pnpm test
   ```

4. Commit and push:
   ```bash
   git add pnpm-lock.yaml
   git commit -m "Fix pnpm lockfile hash format mismatch"
   git push
   ```

This will resolve the CI/CD failure and allow the workflow to proceed.
