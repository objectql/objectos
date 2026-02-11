# ObjectOS Spec Compliance — Development Design Document

> **Date:** 2026-02-11
> **Version:** 2.0.0
> **Based on:** `@objectstack/spec@2.0.6` protocol analysis + ObjectOS codebase scan
> **Scope:** Full protocol gap analysis across all 14 namespaces, 25 service contracts, and 139 Zod schemas

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [Spec Protocol Gap Analysis](#3-spec-protocol-gap-analysis)
4. [CoreServiceName Compliance Matrix](#4-coreservicename-compliance-matrix)
5. [Contracts Interface Compliance](#5-contracts-interface-compliance)
6. [New Modules Gap Analysis](#6-new-modules-gap-analysis)
7. [New Plugins Required](#7-new-plugins-required)
8. [Existing Plugin Improvements](#8-existing-plugin-improvements)
9. [Upstream Spec Improvement Proposals](#9-upstream-spec-improvement-proposals)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Architecture Changes](#11-architecture-changes)
12. [Appendix — Schema Inventory](#appendix--schema-inventory)

---

## 1. Executive Summary

This document provides a comprehensive compliance analysis of the **ObjectOS** platform against the **`@objectstack/spec@2.0.6`** protocol specification. It supersedes the v1.0.0 document (2026-02-10) which covered only 5 namespaces.

### Key Metrics

| Metric | v1.0.0 Doc | v2.0.0 Doc (Current) |
|--------|-----------|---------------------|
| Spec namespaces analyzed | 5 | **14** |
| Total Zod schemas in spec | ~60 | **139** |
| Service contracts in spec | 0 (proposed) | **25** |
| ObjectOS packages | 14 | **14** |
| CoreServiceNames implemented | 11/15 | **13/18** |
| New spec modules since v1 | — | **6** (Identity, Contracts, Integration, Studio, Hub, QA) |

### What Changed Since v1.0.0

The `@objectstack/spec@2.0.6` protocol has matured significantly:

1. **Contracts module added** — 25 formal TypeScript service interfaces that every compliant service MUST implement. This resolves our previous SPEC-001 proposal.
2. **Identity module added** — User, Organization, Role, and SCIM 2.0 provisioning schemas.
3. **Integration module added** — External system connector framework.
4. **Studio module added** — Console/Studio UI plugin protocol.
5. **Hub module added** — Plugin marketplace and registry schemas.
6. **QA module added** — Testing framework schemas for plugin validation.
7. **AI module expanded** — AI agent, RAG pipeline, and NLQ query schemas.
8. **CoreServiceName expanded** — From 15 to 18 values, adding `ai`, `i18n`, and `ui`.
9. **Service criticality levels** — Formal `required` / `core` / `optional` classification.

### Compliance Summary

- **Operational packages:** 14/14 (all green)
- **CoreServiceName coverage:** 13/18 (72%)
- **Contracts interface adoption:** 0/25 (formal interfaces not yet implemented)
- **Schema coverage (estimated):** ~65/139 schemas have corresponding ObjectOS implementations
- **Critical gap:** No formal Contracts interface adoption in any package

---

## 2. Current State Assessment

### 2.1 ObjectOS Package Inventory

All 14 packages are operational and depend on `@objectstack/spec@2.0.6`:

| # | Package | Service Name | Spec Namespace | Status | Contracts Interface |
|---|---------|-------------|----------------|--------|-------------------|
| 1 | `@objectos/audit` | `audit-log` | System | ✅ Operational | ❌ Not adopted |
| 2 | `@objectos/auth` | `auth`, `better-auth` | System, Identity | ✅ Operational | ❌ Not adopted |
| 3 | `@objectos/automation` | `automation` | Automation | ✅ Operational | ❌ Not adopted |
| 4 | `@objectos/browser` | `browser-*` | Shared | ✅ Operational | N/A |
| 5 | `@objectos/cache` | `cache` | System | ✅ Operational | ❌ Not adopted |
| 6 | `@objectos/i18n` | `i18n` | System | ✅ Operational | ❌ Not adopted |
| 7 | `@objectos/jobs` | `job` | System | ✅ Operational | ❌ Not adopted |
| 8 | `@objectos/metrics` | `metrics` | System | ✅ Operational | N/A |
| 9 | `@objectos/notification` | `notification` | System | ✅ Operational | ❌ Not adopted |
| 10 | `@objectos/permissions` | `permissions` | Security | ✅ Operational | ❌ Not adopted |
| 11 | `@objectos/realtime` | `realtime` | System | ✅ Operational | ❌ Not adopted |
| 12 | `@objectos/storage` | `file-storage` | System | ✅ Operational | ❌ Not adopted |
| 13 | `@objectos/ui` | `ui` | UI | ✅ Operational | ❌ Not adopted |
| 14 | `@objectos/workflow` | `workflow` | Automation | ✅ Operational | ❌ Not adopted |

**Additional:** `@objectstack/plugin-auth` — BetterAuth plugin adapter (operational).

### 2.2 Application Layer

| Application | Stack | Status | Pages |
|-------------|-------|--------|-------|
| `apps/web` | Vite + React 19 + React Router 7 | ✅ Operational | 29 |
| `apps/site` | Next.js 16 + Fumadocs | ✅ Operational | — |

### 2.3 Dependency Versions

All packages are aligned on:

- `@objectstack/spec@2.0.6`
- `@objectstack/runtime@latest`
- `@objectstack/cli@latest`
- TypeScript 5.0+ (strict mode)

---

## 3. Spec Protocol Gap Analysis

### 3.1 Shared Namespace

**Spec path:** `src/shared/`

| Schema / Utility | Spec Status | ObjectOS Status | Gap |
|-----------------|-------------|-----------------|-----|
| Common types | ✅ Defined | ✅ Used | None |
| Base schema utilities | ✅ Defined | ✅ Used | None |
| Error codes | ✅ Defined | ⚠️ Partial | Custom error codes not fully aligned |

**Gap severity:** Low

### 3.2 Data Namespace

**Spec path:** `src/data/`

| Schema | Spec Status | ObjectOS Status | Gap |
|--------|-------------|-----------------|-----|
| Object schemas | ✅ Defined | ✅ Via ObjectQL | None — delegated to ObjectQL |
| Field definitions | ✅ Defined | ✅ Via ObjectQL | None |
| Query protocol | ✅ Defined | ✅ Via ObjectQL | None |
| Data hooks | ✅ Defined | ⚠️ Partial | Hook lifecycle not fully spec-compliant |
| Validation rules | ✅ Defined | ⚠️ Partial | Missing cross-field validation |

**Gap severity:** Low (most Data concerns are handled by ObjectQL)

### 3.3 Security Namespace

**Spec path:** `src/security/`

| Schema | Spec Status | ObjectOS Status | Gap |
|--------|-------------|-----------------|-----|
| Permission sets | ✅ Defined | ✅ `@objectos/permissions` | None |
| Sharing rules | ✅ Defined | ⚠️ Partial | Basic sharing, no hierarchical sharing |
| Field-level security (FLS) | ✅ Defined | ✅ Implemented | None |
| Record-level security (RLS) | ✅ Defined | ⚠️ Partial | Missing criteria-based sharing |
| Profile schemas | ✅ Defined | ⚠️ Partial | No profile-to-permission-set mapping |

**Gap severity:** Medium

### 3.4 UI Namespace

**Spec path:** `src/ui/`

| Schema | Spec Status | ObjectOS Status | Gap |
|--------|-------------|-----------------|-----|
| App definitions | ✅ Defined | ✅ `@objectos/ui` | None |
| View schemas | ✅ Defined | ✅ Implemented | None |
| Dashboard schemas | ✅ Defined | ⚠️ Partial | Basic dashboards only |
| Action definitions | ✅ Defined | ⚠️ Partial | Missing bulk action schemas |
| Layout schemas | ✅ Defined | ✅ Implemented | None |

**Gap severity:** Low

### 3.5 System Namespace (26 Schemas)

**Spec path:** `src/system/`

| Schema | ObjectOS Package | Status | Notes |
|--------|-----------------|--------|-------|
| `audit` | `@objectos/audit` | ✅ Compliant | Full CRUD event capture |
| `auth-config` | `@objectos/auth` | ✅ Compliant | BetterAuth config schema |
| `cache` | `@objectos/cache` | ✅ Compliant | LRU + Redis, TTL, namespaces |
| `change-management` | — | ❌ Missing | No change management system |
| `collaboration` | — | ❌ Missing | No collaboration features |
| `compliance` | `@objectos/audit` | ⚠️ Partial | Audit covers some compliance |
| `core-services` | — | ⚠️ Partial | Service registry exists but incomplete |
| `encryption` | `@objectos/auth` | ⚠️ Partial | Auth handles encryption, not standalone |
| `http-server` | `@objectstack/cli` | ✅ Compliant | Hono + @hono/node-server |
| `job` | `@objectos/jobs` | ✅ Compliant | Multi-priority queues, cron, retry |
| `license` | — | ❌ Missing | No license management |
| `logging` | `@objectos/metrics` | ⚠️ Partial | Metrics includes basic logging |
| `masking` | — | ❌ Missing | No data masking |
| `message-queue` | — | ❌ Missing | No message queue abstraction |
| `metadata-persistence` | — | ⚠️ Partial | Via ObjectQL, not standalone |
| `metrics` | `@objectos/metrics` | ✅ Compliant | Counter/Gauge/Histogram, Prometheus |
| `migration` | — | ❌ Missing | No schema migration system |
| `notification` | `@objectos/notification` | ✅ Compliant | Email/SMS/Push/Webhook |
| `object-storage` | `@objectos/storage` | ✅ Compliant | KV storage, multiple backends |
| `registry-config` | — | ⚠️ Partial | Basic config, not spec-compliant |
| `search-engine` | — | ❌ Missing | No search engine |
| `tenant` | — | ❌ Missing | No multi-tenant isolation |
| `tracing` | — | ❌ Missing | No distributed tracing |
| `translation` | `@objectos/i18n` | ✅ Compliant | Multi-locale, interpolation |
| `worker` | `@objectos/jobs` | ⚠️ Partial | Worker model basic |

**Coverage:** 9/26 fully compliant, 7/26 partial, 10/26 missing
**Gap severity:** High

### 3.6 Kernel Namespace (22 Schemas)

**Spec path:** `src/kernel/`

| Schema | ObjectOS Status | Notes |
|--------|----------------|-------|
| `context` | ✅ Implemented | Request context propagation |
| `events` | ✅ Implemented | Event bus system |
| `execution-context` | ⚠️ Partial | Missing trace correlation |
| `feature` | ⚠️ Partial | Feature flags basic |
| `manifest` | ✅ Implemented | Plugin manifests |
| `metadata-loader` | ✅ Implemented | YAML/JSON loader |
| `package-registry` | ⚠️ Partial | Local only, no remote registry |
| `plugin-capability` | ⚠️ Partial | Basic capabilities |
| `plugin-lifecycle-advanced` | ❌ Missing | No advanced lifecycle hooks |
| `plugin-lifecycle-events` | ⚠️ Partial | Basic start/stop only |
| `plugin-loading` | ✅ Implemented | Dynamic plugin loading |
| `plugin-registry` | ✅ Implemented | In-memory plugin registry |
| `plugin-runtime` | ⚠️ Partial | No sandboxing |
| `plugin-security` | ❌ Missing | No plugin security model |
| `plugin-security-advanced` | ❌ Missing | No plugin permission boundaries |
| `plugin-structure` | ✅ Implemented | Standard plugin structure |
| `plugin-validator` | ⚠️ Partial | Basic validation only |
| `plugin-versioning` | ❌ Missing | No semver enforcement |
| `plugin` | ✅ Implemented | Core plugin interface |
| `service-registry` | ⚠️ Partial | Basic registry, no health checks |
| `startup-orchestrator` | ⚠️ Partial | Sequential boot, no dependency graph |

**Coverage:** 8/22 fully compliant, 10/22 partial, 4/22 missing
**Gap severity:** High

### 3.7 Automation Namespace

**Spec path:** `src/automation/`

| Schema | ObjectOS Package | Status | Notes |
|--------|-----------------|--------|-------|
| Workflow rules | `@objectos/automation` | ✅ Compliant | 7 action types |
| State machines | `@objectos/workflow` | ✅ Compliant | FSM engine |
| Flow format | `@objectos/workflow` | ⚠️ Partial | BPMN-Lite, not full Flow |
| Approval processes | `@objectos/workflow` | ⚠️ Partial | Basic approvals |
| Formula engine | `@objectos/automation` | ⚠️ Partial | Limited formula functions |

**Gap severity:** Medium

### 3.8 API Namespace

**Spec path:** `src/api/`

| Schema | ObjectOS Status | Notes |
|--------|----------------|-------|
| Endpoint contracts | ⚠️ Partial | REST endpoints exist, not formally typed |
| Rate limiting | ❌ Missing | No rate limiting schema |
| Versioning | ⚠️ Partial | `/api/v1` prefix only |

**Gap severity:** Medium

### 3.9 AI Namespace

**Spec path:** `src/ai/`

| Schema | ObjectOS Status | Notes |
|--------|----------------|-------|
| AI agent schemas | ❌ Missing | No AI agent support |
| RAG pipeline | ❌ Missing | No RAG pipeline |
| NLQ (Natural Language Query) | ❌ Missing | No NLQ support |

**Gap severity:** Low (optional service)

### 3.10 Identity Namespace (NEW)

**Spec path:** `src/identity/`

| Schema | ObjectOS Status | Notes |
|--------|----------------|-------|
| `identity.zod.ts` — User schema | ⚠️ Partial | `@objectos/auth` has users, not spec-aligned |
| `organization.zod.ts` — Org schema | ❌ Missing | No organization model |
| `role.zod.ts` — Role schema | ⚠️ Partial | `@objectos/permissions` has roles |
| `scim.zod.ts` — SCIM 2.0 provisioning | ❌ Missing | No SCIM support |
| `protocol.ts` — Identity protocol | ❌ Missing | No identity protocol interface |

**Gap severity:** High

### 3.11 Integration Namespace (NEW)

**Spec path:** `src/integration/`

| Schema | ObjectOS Status | Notes |
|--------|----------------|-------|
| `connector.zod.ts` — Connector framework | ❌ Missing | No connector framework |

**Gap severity:** Medium

### 3.12 Studio Namespace (NEW)

**Spec path:** `src/studio/`

| Schema | ObjectOS Status | Notes |
|--------|----------------|-------|
| `plugin.zod.ts` — Studio UI plugin protocol | ❌ Missing | `apps/web` exists but no plugin protocol |

**Gap severity:** Medium

### 3.13 Hub Namespace (NEW)

**Spec path:** `src/hub/`

| Schema | ObjectOS Status | Notes |
|--------|----------------|-------|
| Plugin marketplace schemas | ❌ Missing | No marketplace |
| Plugin registry protocol | ❌ Missing | No remote registry |

**Gap severity:** Low (future feature)

### 3.14 QA Namespace (NEW)

**Spec path:** `src/qa/`

| Schema | ObjectOS Status | Notes |
|--------|----------------|-------|
| `testing.zod.ts` — Testing framework | ❌ Missing | No spec-compliant test harness |

**Gap severity:** Medium

---

## 4. CoreServiceName Compliance Matrix

The spec defines 18 `CoreServiceName` values with formal criticality levels. ObjectOS implements 13.

### Service Criticality Classification

| Criticality | Services | ObjectOS Coverage |
|-------------|----------|-------------------|
| **required** | `metadata`, `data` | ✅ 2/2 (via ObjectQL) |
| **core** | `auth`, `cache`, `queue`, `job` | ⚠️ 3/4 (missing `queue`) |
| **optional** | `file-storage`, `search`, `automation`, `graphql`, `analytics`, `realtime`, `notification`, `ai`, `i18n`, `ui`, `workflow` | ⚠️ 8/12 |

### Detailed Matrix

| # | CoreServiceName | Criticality | ObjectOS Package | Status | Formal Contract |
|---|----------------|-------------|------------------|--------|-----------------|
| 1 | `metadata` | required | ObjectQL | ✅ Implemented | ❌ Not adopted |
| 2 | `data` | required | ObjectQL | ✅ Implemented | ❌ Not adopted |
| 3 | `auth` | core | `@objectos/auth` | ✅ Implemented | ❌ Not adopted |
| 4 | `cache` | core | `@objectos/cache` | ✅ Implemented | ❌ Not adopted |
| 5 | `queue` | core | — | ❌ **Missing** | ❌ N/A |
| 6 | `job` | core | `@objectos/jobs` | ✅ Implemented | ❌ Not adopted |
| 7 | `file-storage` | optional | `@objectos/storage` | ✅ Implemented | ❌ Not adopted |
| 8 | `search` | optional | — | ❌ **Missing** | ❌ N/A |
| 9 | `automation` | optional | `@objectos/automation` | ✅ Implemented | ❌ Not adopted |
| 10 | `graphql` | optional | — | ❌ **Missing** | ❌ N/A |
| 11 | `analytics` | optional | — | ❌ **Missing** | ❌ N/A |
| 12 | `realtime` | optional | `@objectos/realtime` | ✅ Implemented | ❌ Not adopted |
| 13 | `notification` | optional | `@objectos/notification` | ✅ Implemented | ❌ Not adopted |
| 14 | `ai` | optional | — | ❌ **Missing** | ❌ N/A |
| 15 | `i18n` | optional | `@objectos/i18n` | ✅ Implemented | ❌ Not adopted |
| 16 | `ui` | optional | `@objectos/ui` | ✅ Implemented | ❌ Not adopted |
| 17 | `workflow` | optional | `@objectos/workflow` | ✅ Implemented | ❌ Not adopted |

**Result:** 13/18 CoreServiceNames implemented (72%). 5 missing: `search`, `queue`, `graphql`, `analytics`, `ai`.

---

## 5. Contracts Interface Compliance

The spec's Contracts module defines **25 formal TypeScript service interfaces**. Each service MUST implement these interfaces to be spec-compliant. This is the most significant addition in the spec since v1.0.

### 5.1 Contract-to-Package Mapping

| # | Contract Interface | ObjectOS Package | Implementation Status |
|---|-------------------|------------------|----------------------|
| 1 | `LoggerContract` | `@objectos/metrics` | ⚠️ Partial — logging exists, interface not adopted |
| 2 | `DataEngineContract` | ObjectQL | ⚠️ Partial — data engine exists in ObjectQL |
| 3 | `HttpServerContract` | `@objectstack/cli` | ⚠️ Partial — Hono server exists |
| 4 | `ServiceRegistryContract` | `@objectstack/runtime` | ⚠️ Partial — basic registry |
| 5 | `PluginValidatorContract` | `@objectstack/runtime` | ⚠️ Partial — basic validation |
| 6 | `StartupOrchestratorContract` | `@objectstack/runtime` | ⚠️ Partial — sequential boot |
| 7 | `PluginLifecycleEventsContract` | `@objectstack/runtime` | ⚠️ Partial — basic events |
| 8 | `SchemaDriverContract` | ObjectQL | ⚠️ Partial — schema driver in ObjectQL |
| 9 | `CacheServiceContract` | `@objectos/cache` | ⚠️ Partial — cache works, interface not formal |
| 10 | `SearchServiceContract` | — | ❌ Missing — no search service |
| 11 | `QueueServiceContract` | — | ❌ Missing — no queue service |
| 12 | `NotificationServiceContract` | `@objectos/notification` | ⚠️ Partial — service works |
| 13 | `StorageServiceContract` | `@objectos/storage` | ⚠️ Partial — service works |
| 14 | `MetadataServiceContract` | ObjectQL | ⚠️ Partial — metadata in ObjectQL |
| 15 | `AuthServiceContract` | `@objectos/auth` | ⚠️ Partial — BetterAuth integration |
| 16 | `AutomationServiceContract` | `@objectos/automation` | ⚠️ Partial — service works |
| 17 | `GraphQLServiceContract` | — | ❌ Missing — no GraphQL service |
| 18 | `AnalyticsServiceContract` | — | ❌ Missing — no analytics service |
| 19 | `RealtimeServiceContract` | `@objectos/realtime` | ⚠️ Partial — WebSocket server works |
| 20 | `JobServiceContract` | `@objectos/jobs` | ⚠️ Partial — job system works |
| 21 | `AIServiceContract` | — | ❌ Missing — no AI service |
| 22 | `I18nServiceContract` | `@objectos/i18n` | ⚠️ Partial — i18n works |
| 23 | `UIServiceContract` | `@objectos/ui` | ⚠️ Partial — UI service works |
| 24 | `WorkflowServiceContract` | `@objectos/workflow` | ⚠️ Partial — workflow engine works |
| 25 | `PluginContract` (base) | All plugins | ⚠️ Partial — plugins work but don't implement formally |

### 5.2 Adoption Strategy

**Phase 1 — Required services:** Adopt `DataEngineContract`, `MetadataServiceContract`, `HttpServerContract`
**Phase 2 — Core services:** Adopt `AuthServiceContract`, `CacheServiceContract`, `JobServiceContract`
**Phase 3 — Optional services:** Adopt remaining 19 contracts incrementally
**Phase 4 — Full compliance:** All 25 contracts formally implemented and validated

### 5.3 Contract Implementation Pattern

```typescript
// Example: adopting CacheServiceContract in @objectos/cache
import type { CacheServiceContract } from '@objectstack/spec/contracts';

export class ObjectOSCacheService implements CacheServiceContract {
  readonly name = 'cache' as const;
  readonly version = '1.0.0';

  async get<T>(key: string): Promise<T | null> { /* ... */ }
  async set<T>(key: string, value: T, ttl?: number): Promise<void> { /* ... */ }
  async delete(key: string): Promise<boolean> { /* ... */ }
  async clear(namespace?: string): Promise<void> { /* ... */ }
  async has(key: string): Promise<boolean> { /* ... */ }

  // Health check (required by all contracts)
  async healthCheck(): Promise<ServiceHealth> { /* ... */ }
}
```

---

## 6. New Modules Gap Analysis

### 6.1 Identity Module

**Spec schemas:** `identity.zod.ts`, `organization.zod.ts`, `role.zod.ts`, `scim.zod.ts`, `protocol.ts`

| Feature | ObjectOS Status | Required Action |
|---------|----------------|-----------------|
| User schema (spec-aligned) | ⚠️ Partial | Align `@objectos/auth` user model to spec schema |
| Organization model | ❌ Missing | New schema in `@objectos/auth` or new package |
| Role schema (spec-aligned) | ⚠️ Partial | Align `@objectos/permissions` roles to spec schema |
| SCIM 2.0 provisioning | ❌ Missing | New `@objectos/identity` package or extend auth |
| Identity protocol interface | ❌ Missing | Implement `IdentityProtocol` from spec |

**Recommendation:** Create `@objectos/identity` package to own User/Org/Role/SCIM, delegating authentication to `@objectos/auth`.

### 6.2 Integration Module

**Spec schemas:** `connector.zod.ts`

| Feature | ObjectOS Status | Required Action |
|---------|----------------|-----------------|
| Connector framework | ❌ Missing | New `@objectos/integration` package |
| Connector lifecycle | ❌ Missing | Implement connect/disconnect/sync protocol |
| Credential vault | ❌ Missing | Secure credential storage for connectors |

**Recommendation:** Create `@objectos/integration` package for external system connectors (Salesforce, HubSpot, REST/SOAP adapters).

### 6.3 Studio Module

**Spec schemas:** `plugin.zod.ts`

| Feature | ObjectOS Status | Required Action |
|---------|----------------|-----------------|
| Studio UI plugin protocol | ❌ Missing | Define plugin registration for `apps/web` |
| Plugin sidebar/page injection | ❌ Missing | Extension points in App Shell |
| Plugin settings panel | ❌ Missing | Settings UI for plugins |

**Recommendation:** Implement Studio plugin protocol in `apps/web` to allow plugins to register routes, sidebar items, and settings pages.

### 6.4 Hub Module

**Spec schemas:** Plugin marketplace/registry schemas

| Feature | ObjectOS Status | Required Action |
|---------|----------------|-----------------|
| Plugin marketplace | ❌ Missing | Remote plugin discovery |
| Plugin installation protocol | ❌ Missing | Download + validate + install flow |
| Plugin ratings/reviews | ❌ Missing | Community feedback system |

**Recommendation:** Defer to v2.0. Build local plugin registry first, then extend to remote Hub.

### 6.5 QA Module

**Spec schemas:** `testing.zod.ts`

| Feature | ObjectOS Status | Required Action |
|---------|----------------|-----------------|
| Plugin test harness | ❌ Missing | Spec-compliant test runner for plugins |
| Mock service registry | ❌ Missing | Test doubles for core services |
| Compliance test suite | ❌ Missing | Automated spec compliance validation |

**Recommendation:** Create `@objectos/testing` package providing test utilities for plugin developers.

---

## 7. New Plugins Required

### Priority 1 — Critical (v1.0 Release)

| Plugin | CoreServiceName | Justification |
|--------|----------------|---------------|
| `@objectos/queue` | `queue` | Core criticality. Required for reliable async processing. Jobs currently lacks queue abstraction. |
| `@objectos/identity` | — | Identity module compliance. SCIM provisioning for enterprise SSO. |

### Priority 2 — Important (v1.1 Release)

| Plugin | CoreServiceName | Justification |
|--------|----------------|---------------|
| `@objectos/search` | `search` | Full-text search across objects. Required for discovery UX. |
| `@objectos/graphql` | `graphql` | GraphQL endpoint auto-generation from metadata. |
| `@objectos/integration` | — | External system connectors. Enterprise requirement. |
| `@objectos/testing` | — | QA module compliance. Plugin developer experience. |

### Priority 3 — Enhancement (v1.2 Release)

| Plugin | CoreServiceName | Justification |
|--------|----------------|---------------|
| `@objectos/analytics` | `analytics` | Business intelligence and reporting. |
| `@objectos/tracing` | — | Distributed tracing (OpenTelemetry). System schema compliance. |
| `@objectos/migration` | — | Schema migration system. System schema compliance. |

### Priority 4 — Future (v2.0 Release)

| Plugin | CoreServiceName | Justification |
|--------|----------------|---------------|
| `@objectos/ai` | `ai` | AI agent, RAG pipeline, NLQ. Spec AI namespace. |
| `@objectos/hub` | — | Plugin marketplace. Hub namespace compliance. |
| `@objectos/collaboration` | — | Real-time collaboration features. |
| `@objectos/compliance` | — | Compliance management beyond audit. |

---

## 8. Existing Plugin Improvements

### 8.1 Contracts Interface Adoption (All 14 Plugins)

Every existing plugin must adopt its corresponding Contracts interface from `@objectstack/spec@2.0.6`. This is the single most impactful improvement.

| Plugin | Contract to Adopt | Effort |
|--------|------------------|--------|
| `@objectos/audit` | `LoggerContract` (partial) | Small |
| `@objectos/auth` | `AuthServiceContract` | Medium |
| `@objectos/automation` | `AutomationServiceContract` | Medium |
| `@objectos/browser` | N/A (client-side) | — |
| `@objectos/cache` | `CacheServiceContract` | Small |
| `@objectos/i18n` | `I18nServiceContract` | Small |
| `@objectos/jobs` | `JobServiceContract` | Medium |
| `@objectos/metrics` | `LoggerContract` | Small |
| `@objectos/notification` | `NotificationServiceContract` | Small |
| `@objectos/permissions` | N/A (Security namespace) | — |
| `@objectos/realtime` | `RealtimeServiceContract` | Medium |
| `@objectos/storage` | `StorageServiceContract` | Small |
| `@objectos/ui` | `UIServiceContract` | Medium |
| `@objectos/workflow` | `WorkflowServiceContract` | Medium |

### 8.2 Health Check Implementation

All plugins must implement the `healthCheck()` method required by Contracts:

```typescript
interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  details?: Record<string, unknown>;
}
```

### 8.3 Per-Plugin Improvements

#### `@objectos/auth`
- Align user model with Identity namespace `identity.zod.ts`
- Implement Organization schema from `organization.zod.ts`
- Add SCIM 2.0 provisioning endpoints (or delegate to `@objectos/identity`)
- Implement `AuthServiceContract`

#### `@objectos/permissions`
- Align role model with Identity namespace `role.zod.ts`
- Implement hierarchical sharing rules (Security namespace gap)
- Add criteria-based record sharing
- Add profile-to-permission-set mapping

#### `@objectos/automation`
- Implement `AutomationServiceContract`
- Expand formula engine functions
- Add field update action validation

#### `@objectos/workflow`
- Implement `WorkflowServiceContract`
- Support full Flow format (spec Automation namespace)
- Add parallel state support

#### `@objectos/cache`
- Implement `CacheServiceContract`
- Add cache statistics reporting
- Implement cache warming strategies

#### `@objectos/jobs`
- Implement `JobServiceContract`
- Align worker model with System `worker` schema
- Add job dependency graph

#### `@objectos/notification`
- Implement `NotificationServiceContract`
- Add notification preferences per user
- Add delivery status tracking

#### `@objectos/realtime`
- Implement `RealtimeServiceContract`
- Add presence tracking
- Add channel-based subscriptions

#### `@objectos/storage`
- Implement `StorageServiceContract`
- Add S3-compatible backend
- Add file metadata indexing

#### `@objectos/i18n`
- Implement `I18nServiceContract`
- Align with System `translation` schema
- Add locale detection middleware

#### `@objectos/metrics`
- Implement `LoggerContract`
- Add structured logging (System `logging` schema)
- Add distributed tracing correlation (System `tracing` schema)

#### `@objectos/audit`
- Align with System `audit` schema fully
- Add field-level change tracking
- Add compliance reporting (System `compliance` schema)

#### `@objectos/ui`
- Implement `UIServiceContract`
- Add Studio plugin protocol support
- Add dashboard schema compliance (UI namespace)

#### `@objectos/browser`
- No Contracts interface (client-side package)
- Align sync protocol with spec
- Add conflict resolution strategies

---

## 9. Upstream Spec Improvement Proposals

### SPEC-001: Service Contract Interfaces — ✅ RESOLVED

> **Original proposal:** "The spec should define formal TypeScript interfaces for each CoreServiceName."
>
> **Resolution:** The Contracts module in `@objectstack/spec@2.0.6` now provides 25 formal service interfaces. This proposal is fully resolved.

### SPEC-002: Plugin Security Boundaries

> **Status:** Open
> **Proposal:** The Kernel namespace defines `plugin-security` and `plugin-security-advanced` schemas, but the spec does not yet define:
> - Permission scopes per plugin (what data a plugin can access)
> - Resource quotas (CPU, memory, API call limits)
> - Plugin sandboxing protocol
>
> **ObjectOS Impact:** Cannot implement plugin security without upstream guidance.
> **Recommended Action:** Propose formal `PluginSecurityPolicy` schema to spec maintainers.

### SPEC-003: Sync Protocol Specification

> **Status:** Open
> **Proposal:** The spec does not define a formal synchronization protocol for Local-First scenarios:
> - Mutation log format
> - Conflict resolution strategies (LWW, Vector Clocks, CRDT)
> - Delta packet schema
> - Checkpoint cursor format
>
> **ObjectOS Impact:** `@objectos/browser` implements custom sync, not spec-aligned.
> **Recommended Action:** Propose `sync` namespace to spec.

### SPEC-004: Multi-Tenant Isolation Schema

> **Status:** Open
> **Proposal:** The System namespace includes a `tenant` schema, but it lacks:
> - Tenant provisioning lifecycle
> - Data isolation strategies (schema-per-tenant vs. row-level)
> - Tenant-scoped service configuration
>
> **ObjectOS Impact:** Cannot implement multi-tenancy without clear spec guidance.
> **Recommended Action:** Expand `tenant` schema with isolation strategies.

### SPEC-005: Studio Plugin Protocol Extension

> **Status:** New
> **Proposal:** The Studio namespace defines `plugin.zod.ts` but does not specify:
> - Route injection protocol (how plugins add pages to App Shell)
> - Sidebar/navigation extension points
> - Settings panel schema
> - Plugin asset bundling requirements
>
> **ObjectOS Impact:** `apps/web` cannot support third-party UI plugins without this.
> **Recommended Action:** Propose detailed Studio extension point schema.

### SPEC-006: Identity Federation Protocol

> **Status:** New
> **Proposal:** The Identity namespace defines SCIM 2.0 schemas but does not specify:
> - SAML/OIDC federation protocol
> - Directory sync (AD/LDAP) schema
> - Just-in-time provisioning flow
>
> **ObjectOS Impact:** Enterprise SSO requires federation beyond SCIM.
> **Recommended Action:** Propose `identity/federation.zod.ts` schema.

---

## 10. Implementation Roadmap

### Phase 1 — Foundation (v1.0) — Weeks 1-6

**Goal:** Core compliance + Contracts adoption for required/core services

| Week | Deliverable | Details |
|------|-------------|---------|
| 1-2 | Contracts adoption (required) | Adopt `DataEngineContract`, `MetadataServiceContract`, `HttpServerContract` |
| 2-3 | Contracts adoption (core) | Adopt `AuthServiceContract`, `CacheServiceContract`, `JobServiceContract` |
| 3-4 | `@objectos/queue` | New plugin, `QueueServiceContract`, Priority queue + dead-letter |
| 4-5 | Health check system | All plugins implement `healthCheck()`, `/api/v1/health` endpoint |
| 5-6 | Identity alignment | Align auth user model + permissions role model with Identity namespace |

**Exit criteria:**
- All required + core services implement formal Contracts
- `queue` CoreServiceName operational
- Health check endpoint returns all service statuses

### Phase 2 — Expansion (v1.1) — Weeks 7-12

**Goal:** New plugins + optional Contracts adoption

| Week | Deliverable | Details |
|------|-------------|---------|
| 7-8 | `@objectos/search` | Full-text search, `SearchServiceContract` |
| 8-9 | `@objectos/graphql` | Auto-generated GraphQL from metadata, `GraphQLServiceContract` |
| 9-10 | `@objectos/identity` | SCIM 2.0, Organization model, Identity protocol |
| 10-11 | `@objectos/integration` | Connector framework, credential vault |
| 11-12 | Contracts adoption (optional) | Remaining 11 contracts adopted by existing plugins |

**Exit criteria:**
- 17/18 CoreServiceNames operational (only `ai` missing)
- 25/25 Contracts interfaces adopted
- Identity/Integration modules compliant

### Phase 3 — Maturity (v1.2) — Weeks 13-18

**Goal:** System namespace coverage + QA compliance

| Week | Deliverable | Details |
|------|-------------|---------|
| 13-14 | `@objectos/analytics` | Business intelligence, `AnalyticsServiceContract` |
| 14-15 | `@objectos/tracing` | OpenTelemetry integration, System `tracing` schema |
| 15-16 | `@objectos/migration` | Schema migration engine, System `migration` schema |
| 16-17 | `@objectos/testing` | QA module compliance, plugin test harness |
| 17-18 | Studio plugin protocol | `apps/web` extension points, Studio namespace compliance |

**Exit criteria:**
- System namespace coverage: 20/26
- QA module operational
- Studio plugin protocol functional

### Phase 4 — Enterprise (v2.0) — Weeks 19-26

**Goal:** Full spec compliance + future-facing features

| Week | Deliverable | Details |
|------|-------------|---------|
| 19-20 | `@objectos/ai` | AI service, RAG pipeline, NLQ, `AIServiceContract` |
| 21-22 | `@objectos/hub` | Plugin marketplace, remote registry |
| 23-24 | Multi-tenancy | Tenant isolation, System `tenant` schema |
| 24-25 | Plugin security | Kernel `plugin-security` + `plugin-security-advanced` |
| 25-26 | Full compliance audit | Automated compliance validation, documentation |

**Exit criteria:**
- 18/18 CoreServiceNames operational
- All 14 spec namespaces covered
- Automated compliance test suite passing

### Roadmap Summary

```
v1.0 (Wk 1-6)   ████████████░░░░░░░░░░░░░░  Foundation
v1.1 (Wk 7-12)  ░░░░░░░░░░░░████████████░░  Expansion
v1.2 (Wk 13-18) ░░░░░░░░░░░░░░░░░░░░████░░  Maturity
v2.0 (Wk 19-26) ░░░░░░░░░░░░░░░░░░░░░░░░██  Enterprise
```

---

## 11. Architecture Changes

### 11.1 Plugin Registration (Updated)

Plugins must register with their Contracts interface type:

```typescript
// Before (current)
kernel.register('cache', new CachePlugin());

// After (spec-compliant)
import type { CacheServiceContract } from '@objectstack/spec/contracts';

kernel.register<CacheServiceContract>('cache', new CachePlugin(), {
  contract: 'CacheServiceContract',
  criticality: 'core',
  healthCheck: true,
});
```

### 11.2 Service Registry Validation

The service registry must validate Contracts compliance at boot:

```typescript
// Startup validation
for (const [name, service] of registry.entries()) {
  const contract = spec.getContract(name);
  if (contract) {
    const result = validateContract(service, contract);
    if (!result.valid) {
      logger.error(`Service ${name} does not implement ${contract.name}`, result.errors);
      if (contract.criticality === 'required') {
        throw new KernelBootError(`Required service ${name} is non-compliant`);
      }
    }
  }
}
```

### 11.3 Health Check Endpoint

New aggregate health endpoint:

```
GET /api/v1/health
```

Response:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 86400,
  "services": {
    "metadata": { "status": "healthy", "latency": 2 },
    "data": { "status": "healthy", "latency": 5 },
    "auth": { "status": "healthy", "latency": 12 },
    "cache": { "status": "healthy", "latency": 1 },
    "queue": { "status": "healthy", "latency": 3 },
    "job": { "status": "healthy", "latency": 8 },
    "notification": { "status": "degraded", "latency": 150, "details": { "smtp": "timeout" } }
  },
  "spec": {
    "version": "2.0.6",
    "compliance": {
      "coreServices": "13/18",
      "contracts": "25/25",
      "schemas": "120/139"
    }
  }
}
```

### 11.4 Service Criticality Enforcement

The kernel must enforce service criticality at boot:

```typescript
const CRITICALITY: Record<string, 'required' | 'core' | 'optional'> = {
  metadata: 'required',
  data: 'required',
  auth: 'core',
  cache: 'core',
  queue: 'core',
  job: 'core',
  // ... remaining are 'optional'
};

function validateBoot(registry: ServiceRegistry): void {
  for (const [name, criticality] of Object.entries(CRITICALITY)) {
    const service = registry.get(name);
    if (criticality === 'required' && !service) {
      throw new KernelBootError(`Required service '${name}' is not registered`);
    }
    if (criticality === 'core' && !service) {
      logger.warn(`Core service '${name}' is not registered — degraded mode`);
    }
  }
}
```

### 11.5 Contracts-Aware Event Bus

Events should include service contract metadata:

```typescript
interface ServiceEvent {
  source: CoreServiceName;
  contract: string;        // e.g., 'CacheServiceContract'
  type: string;            // e.g., 'cache.invalidated'
  timestamp: number;
  payload: unknown;
  correlationId: string;   // For distributed tracing
}
```

---

## Appendix — Schema Inventory

### A.1 Shared Namespace

| # | Schema File | Type | Description |
|---|-------------|------|-------------|
| 1 | Common types | Utility | Shared type definitions |
| 2 | Base schema utilities | Utility | Schema composition helpers |
| 3 | Error codes | Enum | Standard error code registry |

### A.2 Data Namespace

| # | Schema File | Type | Description |
|---|-------------|------|-------------|
| 1 | Object schema | Zod | Object definition (fields, relations) |
| 2 | Field definitions | Zod | Field types and constraints |
| 3 | Query protocol | Zod | Query/filter/sort/pagination |
| 4 | Data hooks | Zod | Before/after CRUD hooks |
| 5 | Validation rules | Zod | Cross-field validation |

### A.3 Security Namespace

| # | Schema File | Type | Description |
|---|-------------|------|-------------|
| 1 | Permission sets | Zod | Object/field/record permissions |
| 2 | Sharing rules | Zod | Record sharing configuration |
| 3 | FLS | Zod | Field-level security |
| 4 | RLS | Zod | Record-level security |
| 5 | Profiles | Zod | User profile schemas |

### A.4 UI Namespace

| # | Schema File | Type | Description |
|---|-------------|------|-------------|
| 1 | Apps | Zod | Application definitions |
| 2 | Views | Zod | List/detail/kanban views |
| 3 | Dashboards | Zod | Dashboard layout + widgets |
| 4 | Actions | Zod | Button/quick/bulk actions |
| 5 | Layouts | Zod | Page layout schemas |

### A.5 System Namespace (26 Schemas)

| # | Schema File | ObjectOS Mapping | Compliance |
|---|-------------|------------------|------------|
| 1 | `audit.zod.ts` | `@objectos/audit` | ✅ |
| 2 | `auth-config.zod.ts` | `@objectos/auth` | ✅ |
| 3 | `cache.zod.ts` | `@objectos/cache` | ✅ |
| 4 | `change-management.zod.ts` | — | ❌ |
| 5 | `collaboration.zod.ts` | — | ❌ |
| 6 | `compliance.zod.ts` | `@objectos/audit` (partial) | ⚠️ |
| 7 | `core-services.zod.ts` | Runtime (partial) | ⚠️ |
| 8 | `encryption.zod.ts` | `@objectos/auth` (partial) | ⚠️ |
| 9 | `http-server.zod.ts` | `@objectstack/cli` | ✅ |
| 10 | `job.zod.ts` | `@objectos/jobs` | ✅ |
| 11 | `license.zod.ts` | — | ❌ |
| 12 | `logging.zod.ts` | `@objectos/metrics` (partial) | ⚠️ |
| 13 | `masking.zod.ts` | — | ❌ |
| 14 | `message-queue.zod.ts` | — | ❌ |
| 15 | `metadata-persistence.zod.ts` | ObjectQL (partial) | ⚠️ |
| 16 | `metrics.zod.ts` | `@objectos/metrics` | ✅ |
| 17 | `migration.zod.ts` | — | ❌ |
| 18 | `notification.zod.ts` | `@objectos/notification` | ✅ |
| 19 | `object-storage.zod.ts` | `@objectos/storage` | ✅ |
| 20 | `registry-config.zod.ts` | Runtime (partial) | ⚠️ |
| 21 | `search-engine.zod.ts` | — | ❌ |
| 22 | `tenant.zod.ts` | — | ❌ |
| 23 | `tracing.zod.ts` | — | ❌ |
| 24 | `translation.zod.ts` | `@objectos/i18n` | ✅ |
| 25 | `worker.zod.ts` | `@objectos/jobs` (partial) | ⚠️ |

### A.6 Kernel Namespace (22 Schemas)

| # | Schema File | Compliance |
|---|-------------|------------|
| 1 | `context.zod.ts` | ✅ |
| 2 | `events.zod.ts` | ✅ |
| 3 | `execution-context.zod.ts` | ⚠️ |
| 4 | `feature.zod.ts` | ⚠️ |
| 5 | `manifest.zod.ts` | ✅ |
| 6 | `metadata-loader.zod.ts` | ✅ |
| 7 | `package-registry.zod.ts` | ⚠️ |
| 8 | `plugin-capability.zod.ts` | ⚠️ |
| 9 | `plugin-lifecycle-advanced.zod.ts` | ❌ |
| 10 | `plugin-lifecycle-events.zod.ts` | ⚠️ |
| 11 | `plugin-loading.zod.ts` | ✅ |
| 12 | `plugin-registry.zod.ts` | ✅ |
| 13 | `plugin-runtime.zod.ts` | ⚠️ |
| 14 | `plugin-security.zod.ts` | ❌ |
| 15 | `plugin-security-advanced.zod.ts` | ❌ |
| 16 | `plugin-structure.zod.ts` | ✅ |
| 17 | `plugin-validator.zod.ts` | ⚠️ |
| 18 | `plugin-versioning.zod.ts` | ❌ |
| 19 | `plugin.zod.ts` | ✅ |
| 20 | `service-registry.zod.ts` | ⚠️ |
| 21 | `startup-orchestrator.zod.ts` | ⚠️ |

### A.7 Automation Namespace

| # | Schema File | Compliance |
|---|-------------|------------|
| 1 | Workflow rules | ✅ |
| 2 | State machines | ✅ |
| 3 | Flow format | ⚠️ |
| 4 | Approval processes | ⚠️ |
| 5 | Formula engine | ⚠️ |

### A.8 API Namespace

| # | Schema File | Compliance |
|---|-------------|------------|
| 1 | Endpoint contracts | ⚠️ |
| 2 | Rate limiting | ❌ |
| 3 | Versioning | ⚠️ |

### A.9 AI Namespace

| # | Schema File | Compliance |
|---|-------------|------------|
| 1 | AI agent schemas | ❌ |
| 2 | RAG pipeline | ❌ |
| 3 | NLQ schemas | ❌ |

### A.10 Identity Namespace

| # | Schema File | Compliance |
|---|-------------|------------|
| 1 | `identity.zod.ts` | ⚠️ |
| 2 | `organization.zod.ts` | ❌ |
| 3 | `role.zod.ts` | ⚠️ |
| 4 | `scim.zod.ts` | ❌ |
| 5 | `protocol.ts` | ❌ |

### A.11 Integration Namespace

| # | Schema File | Compliance |
|---|-------------|------------|
| 1 | `connector.zod.ts` | ❌ |

### A.12 Studio Namespace

| # | Schema File | Compliance |
|---|-------------|------------|
| 1 | `plugin.zod.ts` | ❌ |

### A.13 Hub Namespace

| # | Schema File | Compliance |
|---|-------------|------------|
| 1 | Marketplace schemas | ❌ |
| 2 | Registry protocol | ❌ |

### A.14 QA Namespace

| # | Schema File | Compliance |
|---|-------------|------------|
| 1 | `testing.zod.ts` | ❌ |

### A.15 Stack Definition

| # | Schema File | Compliance |
|---|-------------|------------|
| 1 | `stack.zod.ts` — `defineStack()` | ✅ |

### A.16 Contracts Module (25 Interfaces)

| # | Contract | ObjectOS Implementation | Status |
|---|----------|----------------------|--------|
| 1 | `LoggerContract` | `@objectos/metrics` | ⚠️ Partial |
| 2 | `DataEngineContract` | ObjectQL | ⚠️ Partial |
| 3 | `HttpServerContract` | `@objectstack/cli` | ⚠️ Partial |
| 4 | `ServiceRegistryContract` | `@objectstack/runtime` | ⚠️ Partial |
| 5 | `PluginValidatorContract` | `@objectstack/runtime` | ⚠️ Partial |
| 6 | `StartupOrchestratorContract` | `@objectstack/runtime` | ⚠️ Partial |
| 7 | `PluginLifecycleEventsContract` | `@objectstack/runtime` | ⚠️ Partial |
| 8 | `SchemaDriverContract` | ObjectQL | ⚠️ Partial |
| 9 | `CacheServiceContract` | `@objectos/cache` | ⚠️ Partial |
| 10 | `SearchServiceContract` | — | ❌ Missing |
| 11 | `QueueServiceContract` | — | ❌ Missing |
| 12 | `NotificationServiceContract` | `@objectos/notification` | ⚠️ Partial |
| 13 | `StorageServiceContract` | `@objectos/storage` | ⚠️ Partial |
| 14 | `MetadataServiceContract` | ObjectQL | ⚠️ Partial |
| 15 | `AuthServiceContract` | `@objectos/auth` | ⚠️ Partial |
| 16 | `AutomationServiceContract` | `@objectos/automation` | ⚠️ Partial |
| 17 | `GraphQLServiceContract` | — | ❌ Missing |
| 18 | `AnalyticsServiceContract` | — | ❌ Missing |
| 19 | `RealtimeServiceContract` | `@objectos/realtime` | ⚠️ Partial |
| 20 | `JobServiceContract` | `@objectos/jobs` | ⚠️ Partial |
| 21 | `AIServiceContract` | — | ❌ Missing |
| 22 | `I18nServiceContract` | `@objectos/i18n` | ⚠️ Partial |
| 23 | `UIServiceContract` | `@objectos/ui` | ⚠️ Partial |
| 24 | `WorkflowServiceContract` | `@objectos/workflow` | ⚠️ Partial |
| 25 | `PluginContract` | All plugins | ⚠️ Partial |

### A.17 Overall Compliance Summary

| Namespace | Total Schemas | ✅ Compliant | ⚠️ Partial | ❌ Missing |
|-----------|--------------|-------------|-----------|-----------|
| Shared | 3 | 2 | 1 | 0 |
| Data | 5 | 3 | 2 | 0 |
| Security | 5 | 2 | 3 | 0 |
| UI | 5 | 3 | 2 | 0 |
| System | 26 | 9 | 7 | 10 |
| Kernel | 22 | 8 | 10 | 4 |
| Automation | 5 | 2 | 3 | 0 |
| API | 3 | 0 | 2 | 1 |
| AI | 3 | 0 | 0 | 3 |
| Identity | 5 | 0 | 2 | 3 |
| Integration | 1 | 0 | 0 | 1 |
| Studio | 1 | 0 | 0 | 1 |
| Hub | 2 | 0 | 0 | 2 |
| QA | 1 | 0 | 0 | 1 |
| Contracts | 25 | 0 | 20 | 5 |
| Stack | 1 | 1 | 0 | 0 |
| **Total** | **113** | **30** | **52** | **31** |

> **Note:** Some schemas overlap across namespaces. The 139 total Zod schemas referenced in the Executive Summary includes sub-schemas and variants within each file. The 113 count above represents distinct schema files.

---

**Document maintained by:** ObjectOS Core Team
**Last updated:** 2026-02-11
**Status:** Draft v2.0 — Pending Review