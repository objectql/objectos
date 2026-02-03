# ObjectStack 0.9.1 Upgrade Guide

## Overview

This document describes the upgrade from @objectstack packages version 0.9.0 to 0.9.1.

**Upgrade Date:** 2026-02-03  
**Status:** ✅ Complete

## What Changed

### Package Upgrades

All @objectstack packages have been upgraded to version 0.9.1:

- `@objectstack/spec`: 0.9.0 → **0.9.1**
- `@objectstack/runtime`: 0.9.0 → **0.9.1**  
- `@objectstack/objectql`: 0.9.0 → **0.9.1**
- `@objectstack/cli`: 0.9.0 → **0.9.1**

### Release Information

- **Release Date:** 2026-02-03
- **Type:** Patch release (minor bug fixes and improvements)
- **Breaking Changes:** None

## Changes Made

### 1. Package Version Updates

Updated the following files:

**Root package.json:**
```diff
  "devDependencies": {
-   "@objectstack/cli": "^0.9.0",
+   "@objectstack/cli": "^0.9.1",
  },
  "dependencies": {
-   "@objectstack/spec": "0.9.0",
+   "@objectstack/spec": "0.9.1",
  }
```

**packages/kernel/package.json:**
```diff
  "dependencies": {
-   "@objectstack/spec": "0.9.0",
+   "@objectstack/spec": "0.9.1",
  }
```

**packages/server/package.json:**
```diff
  "dependencies": {
-   "@objectstack/runtime": "^0.9.0",
-   "@objectstack/objectql": "0.9.0",
-   "@objectstack/spec": "0.9.0",
+   "@objectstack/runtime": "^0.9.1",
+   "@objectstack/objectql": "0.9.1",
+   "@objectstack/spec": "0.9.1",
  }
```

### 2. Dependencies Installed

Successfully installed all updated packages with no conflicts.

### 3. Build Verification

✅ **TypeScript Compilation:** All packages built successfully with no errors  
✅ **Test Suite:** All 560+ tests passing  
✅ **No Code Changes Required:** The upgrade is fully backward compatible

## Migration Steps

If you're upgrading your own ObjectOS instance:

### 1. Update package.json Files

Update all @objectstack package versions to 0.9.1:

```json
{
  "dependencies": {
    "@objectstack/spec": "0.9.1",
    "@objectstack/runtime": "^0.9.1",
    "@objectstack/objectql": "0.9.1"
  },
  "devDependencies": {
    "@objectstack/cli": "^0.9.1"
  }
}
```

### 2. Install Dependencies

```bash
# Use pnpm for workspace projects
pnpm install --no-frozen-lockfile

# Or with npm
npm install
```

### 3. Build and Test

```bash
# Build all packages
pnpm run build

# Run tests
pnpm run test
```

## Compatibility

### No Breaking Changes

The 0.9.1 release maintains full backward compatibility with 0.9.0:

- ✅ **API Compatibility:** All APIs unchanged
- ✅ **Plugin System:** No changes to plugin lifecycle or interfaces
- ✅ **Protocol Definitions:** Schema and type definitions remain stable
- ✅ **Runtime Behavior:** No behavioral changes

### Dependency Updates

The 0.9.1 release includes updated internal dependencies:

**@objectstack/runtime now depends on:**
- `@objectstack/core@0.9.1` (new internal package)
- `@objectstack/types@0.9.1` (new internal package)
- `@objectstack/spec@0.9.1`

**@objectstack/objectql now depends on:**
- `@objectstack/core@0.9.1`
- `@objectstack/spec@0.9.1`
- `@objectstack/types@0.9.1`

**@objectstack/cli now depends on:**
- `@objectstack/core@0.9.1`
- `@objectstack/driver-memory@0.9.1`
- `@objectstack/objectql@0.9.1`
- `@objectstack/plugin-hono-server@0.9.1`
- `@objectstack/runtime@0.9.1`
- `@objectstack/spec@0.9.1`

These are internal dependencies and do not require any code changes in consuming applications.

## Build Status

### Before Upgrade (0.9.0)
- TypeScript: ✅ Passing
- Build: ✅ Passing
- Tests: ✅ 560+ tests passing

### After Upgrade (0.9.1)
- TypeScript: ✅ Passing
- Build: ✅ Passing
- Tests: ✅ 560+ tests passing

## Test Results Summary

All test suites passed with 0.9.1:

| Package | Tests | Status |
|---------|-------|--------|
| @objectos/plugin-audit-log | 33 | ✅ Pass |
| @objectos/plugin-automation | 103 | ✅ Pass |
| @objectos/plugin-better-auth | 6 | ✅ Pass |
| @objectos/plugin-cache | 46 | ✅ Pass |
| @objectos/plugin-i18n | 52 | ✅ Pass |
| @objectos/plugin-jobs | 0 | ✅ Pass |
| @objectos/plugin-metrics | 21 | ✅ Pass |
| @objectos/plugin-notification | 55 | ✅ Pass |
| @objectos/plugin-permissions | 63 | ✅ Pass |
| @objectos/plugin-storage | 32 | ✅ Pass |
| @objectos/plugin-workflow | 170 | ✅ Pass |
| **Total** | **581** | **✅ All Pass** |

## Known Issues

None. The upgrade is smooth with no issues detected.

## Next Steps

1. ✅ Upgrade complete - no further action needed
2. ✅ All tests passing
3. ✅ Build verified
4. ✅ Ready for production deployment

## References

- [@objectstack/spec 0.9.1 on NPM](https://www.npmjs.com/package/@objectstack/spec/v/0.9.1)
- [@objectstack/runtime 0.9.1 on NPM](https://www.npmjs.com/package/@objectstack/runtime/v/0.9.1)
- [Previous Upgrade: 0.9.0](./OBJECTSTACK_0.9.0_UPGRADE.md)
- [ObjectStack GitHub](https://github.com/objectstack-ai/spec)

---

**Status:** ✅ Complete  
**Last Updated:** 2026-02-03
