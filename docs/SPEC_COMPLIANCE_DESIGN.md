# ObjectOS Spec Compliance — Development Design Document

> **Date:** 2026-02-10
> **Version:** 1.0.0
> **Based on:** `@objectstack/spec@2.0.4` protocol analysis + ObjectOS codebase scan
> **Scope:** Full gap analysis, improvement plan, and upstream spec recommendations

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [Spec Protocol Gap Analysis](#3-spec-protocol-gap-analysis)
4. [CoreServiceName Compliance Matrix](#4-coreservicename-compliance-matrix)
5. [New Plugins Required](#5-new-plugins-required)
6. [Existing Plugin Improvements](#6-existing-plugin-improvements)
7. [Upstream Spec Improvement Proposals](#7-upstream-spec-improvement-proposals)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [Architecture Changes](#9-architecture-changes)
10. [Appendix: Spec Schema Inventory](#appendix-spec-schema-inventory)

---

## 1. Executive Summary

ObjectOS currently implements **13 out of 18 CoreServiceName services** defined in `@objectstack/spec/system/core-services.zod.ts`. All existing plugins follow the kernel plugin lifecycle and register as kernel services. However, the spec's `system/` module defines **26 protocol schemas** covering Infrastructure, Observability, Security, Runtime, and Multi-Tenancy — many of which are not yet implemented or only partially covered.

**Key Findings:**

| Category | Spec Schemas | ObjectOS Coverage | Gap |
|----------|-------------|-------------------|-----|
| Infrastructure | 5 | 3 partial | 2 missing |
| Observability | 6 | 2 partial | 4 missing |
| Security & Compliance | 4 | 1 partial | 3 missing |
| Runtime Services | 7 | 5 partial | 2 missing |
| Multi-Tenant & Licensing | 3 | 0 | 3 missing |
| **Total** | **26** | **11 partial** | **14 gaps** |

**Recommendation:** Implement 8 new plugins (Priority 1 & 2) and enhance 6 existing plugins to achieve full spec compliance. This also requires 5 upstream spec improvement proposals.

---

## 2. Current State Assessment

### 2.1 Existing Plugin Inventory

| # | Package | Service Name | Spec Schema Coverage | Status |
|---|---------|-------------|---------------------|--------|
| 1 | `@objectos/audit` | `audit-log` | `system/audit.zod.ts` | ✅ Operational — 34+ event types, field history |
| 2 | `@objectos/automation` | `automation` | `automation/*.zod.ts` | ✅ Operational — 7 action types, queue |
| 3 | `@objectos/browser` | `browser-*` | N/A (client-side) | ✅ Operational — SQLite WASM, OPFS |
| 4 | `@objectos/cache` | `cache` | `system/cache.zod.ts` | ⚠️ Partial — Missing CacheConfig validation |
| 5 | `@objectos/i18n` | `i18n` | `system/translation.zod.ts` | ⚠️ Partial — Missing TranslationBundle schema usage |
| 6 | `@objectos/jobs` | `job` | `system/job.zod.ts` | ⚠️ Partial — Missing full Task/Queue schema |
| 7 | `@objectos/metrics` | `metrics` | `system/metrics.zod.ts` | ⚠️ Partial — Missing MetricRegistry schema |
| 8 | `@objectos/notification` | `notification` | `system/notification.zod.ts` | ⚠️ Partial — Missing NotificationTemplate schema |
| 9 | `@objectos/permissions` | `permissions` | `security/*.zod.ts` | ✅ Operational — RBAC, RLS, sharing rules |
| 10 | `@objectos/realtime` | `realtime` | `system/collaboration.zod.ts` | ⚠️ Partial — Missing OT/CRDT/Cursor protocols |
| 11 | `@objectos/storage` | `file-storage` | `system/object-storage.zod.ts` | ⚠️ Partial — KV only, missing object storage |
| 12 | `@objectos/ui` | `ui` | `ui/*.zod.ts` | ✅ Operational — View CRUD |
| 13 | `@objectos/workflow` | `workflow` | `automation/workflow.zod.ts` | ✅ Operational — FSM + Flow format |
| 14 | `@objectstack/plugin-auth` | `auth` | `system/auth-config.zod.ts` | ✅ Operational — Better-Auth, SSO, 2FA |

### 2.2 Architecture Strengths

- **Plugin lifecycle compliance:** All plugins implement `init()`, `start()`, `destroy()`.
- **Service registry usage:** All plugins register via `ctx.registerService(name, instance)`.
- **Event-driven communication:** Plugins use `ctx.hook()` / `ctx.trigger()` for inter-plugin events.
- **Spec type imports:** Several plugins import from `@objectstack/spec` for Zod validation.

### 2.3 Architecture Weaknesses

- **Inconsistent spec schema usage:** Most plugins define internal types rather than reusing spec Zod schemas for config/data validation.
- **Missing CoreServiceName alignment:** Service names like `audit-log`, `file-storage` don't exactly match spec's `CoreServiceName` enum.
- **No configuration validation:** Plugin configs are not validated against spec Zod schemas at boot time.
- **No health reporting:** Plugins don't implement `PluginHealthStatus` / `PluginHealthReport` from spec's kernel module.
- **No capability manifests:** Plugins don't declare `PluginCapabilityManifest` from spec's kernel module.

---

## 3. Spec Protocol Gap Analysis

### 3.1 System Protocol Schemas (26 total)

The `@objectstack/spec/system` module defines 26 schema files organized into 5 categories:

#### Infrastructure Services

| Schema File | Key Types | ObjectOS Plugin | Status |
|-------------|-----------|----------------|--------|
| `cache.zod.ts` | `CacheConfig`, `CacheStrategy` | `@objectos/cache` | ⚠️ Config not validated via Zod |
| `message-queue.zod.ts` | `QueueConfig`, `QueueDriver` | None (jobs has basic queue) | ❌ **Missing** |
| `object-storage.zod.ts` | `ObjectStorageConfig`, `StorageBucket` | `@objectos/storage` (KV only) | ⚠️ Missing S3/object storage |
| `search-engine.zod.ts` | `SearchEngineConfig`, `SearchIndex` | None | ❌ **Missing** |
| `http-server.zod.ts` | `HttpServerConfig`, `CORSConfig` | Root config (not a plugin) | ⚠️ Not plugin-managed |

#### Observability & Operations

| Schema File | Key Types | ObjectOS Plugin | Status |
|-------------|-----------|----------------|--------|
| `audit.zod.ts` | `AuditEvent`, `AuditConfig`, `AuditRetentionPolicy` | `@objectos/audit` | ⚠️ Config not Zod-validated |
| `logging.zod.ts` | `LoggingConfig`, `LogDestination`, `StructuredLogEntry` | None | ❌ **Missing** |
| `metrics.zod.ts` | `MetricSchema`, `MetricRegistry`, `PrometheusConfig` | `@objectos/metrics` | ⚠️ Partial schema usage |
| `tracing.zod.ts` | `TracingConfig`, `Span`, `TraceContext` | None | ❌ **Missing** |
| `change-management.zod.ts` | `ChangeRequest`, `RollbackPlan` | None | ❌ **Missing** |
| `migration.zod.ts` | `MigrationConfig`, `MigrationStep` | None | ❌ **Missing** |

#### Security & Compliance

| Schema File | Key Types | ObjectOS Plugin | Status |
|-------------|-----------|----------------|--------|
| `auth-config.zod.ts` | `AuthConfig`, `OIDCConfig`, `SAMLConfig` | `@objectstack/plugin-auth` | ⚠️ Partial |
| `compliance.zod.ts` | `ComplianceConfig`, `GDPRConfig` | None | ❌ **Missing** |
| `encryption.zod.ts` | `EncryptionConfig`, `KeyManagement` | None | ❌ **Missing** |
| `masking.zod.ts` | `MaskingRule`, `MaskingStrategy` | None | ❌ **Missing** |

#### Runtime Services

| Schema File | Key Types | ObjectOS Plugin | Status |
|-------------|-----------|----------------|--------|
| `job.zod.ts` | `JobConfig`, `JobSchedule` | `@objectos/jobs` | ⚠️ Partial |
| `worker.zod.ts` | `Task`, `WorkerConfig`, `BatchTask`, `QueueConfig` | None (partial in jobs) | ❌ **Missing** |
| `notification.zod.ts` | `NotificationConfig`, `NotificationTemplate` | `@objectos/notification` | ⚠️ Partial |
| `translation.zod.ts` | `TranslationBundle`, `TranslationEntry` | `@objectos/i18n` | ⚠️ Partial |
| `collaboration.zod.ts` | `OTOperation`, `CRDTState`, `CollaborativeCursor` | `@objectos/realtime` | ⚠️ Very partial |
| `metadata-persistence.zod.ts` | `MetadataPersistence`, `PersistenceStrategy` | None | ❌ **Missing** |
| `core-services.zod.ts` | `CoreServiceName`, `ServiceStatus` | Implicit (no validation) | ⚠️ Not validated |

#### Multi-Tenant & Licensing

| Schema File | Key Types | ObjectOS Plugin | Status |
|-------------|-----------|----------------|--------|
| `tenant.zod.ts` | `TenantSchema`, `TenantIsolationConfig`, `TenantSecurityPolicy` | None | ❌ **Missing** |
| `license.zod.ts` | `LicenseConfig`, `LicenseMetricType` | None | ❌ **Missing** |
| `registry-config.zod.ts` | `RegistryConfig` | None | ❌ **Missing** |

### 3.2 Kernel Protocol Gaps

The `@objectstack/spec/kernel` module defines 22 schemas. ObjectOS plugins don't fully leverage:

| Kernel Schema | Purpose | ObjectOS Usage |
|--------------|---------|----------------|
| `plugin-capability.zod.ts` | `PluginCapabilityManifest` | ❌ Not declared by any plugin |
| `plugin-lifecycle-advanced.zod.ts` | `PluginHealthStatus`, `PluginHealthReport` | ❌ No health reporting |
| `plugin-lifecycle-events.zod.ts` | Standardized lifecycle events | ⚠️ Partial (custom events) |
| `plugin-security.zod.ts` | `PluginSecurityManifest` | ❌ Not declared by any plugin |
| `plugin-runtime.zod.ts` | `PluginRuntimeConfig` | ❌ Not used |
| `service-registry.zod.ts` | `ServiceRegistryConfig` | ❌ Not used |
| `startup-orchestrator.zod.ts` | `StartupOrchestrator` | ❌ Not used |
| `feature.zod.ts` | `FeatureFlag`, `FeatureFlagConfig` | ❌ No feature flag system |
| `context.zod.ts` | `ExecutionContext`, `RequestContext` | ❌ Not structured per spec |
| `execution-context.zod.ts` | Enhanced execution context | ❌ Not used |

---

## 4. CoreServiceName Compliance Matrix

The spec defines 18 CoreServiceName values. Here is ObjectOS's compliance:

| CoreServiceName | Spec Criticality | ObjectOS Plugin | Registered? | Fully Compliant? |
|----------------|-----------------|----------------|-------------|-----------------|
| `metadata` | **required** | ObjectQLPlugin | ✅ via `objectql` | ⚠️ Name mismatch |
| `data` | **required** | ObjectQLPlugin | ✅ via `objectql` | ⚠️ Name mismatch |
| `auth` | **core** | `@objectstack/plugin-auth` | ✅ `auth` | ✅ |
| `cache` | **core** | `@objectos/cache` | ✅ `cache` | ✅ |
| `queue` | **core** | None (jobs has basic) | ❌ | ❌ **Missing** |
| `job` | **core** | `@objectos/jobs` | ✅ `job` | ⚠️ Partial |
| `file-storage` | optional | `@objectos/storage` | ✅ `file-storage` | ⚠️ KV only |
| `search` | optional | None | ❌ | ❌ **Missing** |
| `automation` | optional | `@objectos/automation` | ✅ `automation` | ✅ |
| `graphql` | optional | None | ❌ | ❌ **Missing** |
| `analytics` | optional | None | ❌ | ❌ **Missing** |
| `realtime` | optional | `@objectos/realtime` | ✅ `realtime` | ⚠️ Partial |
| `notification` | optional | `@objectos/notification` | ✅ `notification` | ⚠️ Partial |
| `ai` | optional | None | ❌ | ❌ **Missing** |
| `i18n` | optional | `@objectos/i18n` | ✅ `i18n` | ⚠️ Partial |
| `ui` | optional | `@objectos/ui` | ✅ `ui` | ✅ |
| `workflow` | optional | `@objectos/workflow` | ✅ `workflow` | ✅ |

**Score: 13/18 registered (72%), 5/18 fully compliant (28%)**

---

## 5. New Plugins Required

### 5.1 Priority 1 — Core System Services (Phase 1)

#### P1.1 `@objectos/logging` — Structured Logging Plugin

**Spec compliance:** `system/logging.zod.ts`

**Rationale:** The spec defines a comprehensive logging protocol with multiple destinations (file, console, Elasticsearch, CloudWatch, Loki), structured log entries, log enrichment, and sampling. ObjectOS currently uses the kernel's basic Pino logger with no configuration API.

**Implementation scope:**
- `LoggingConfig` validation from spec
- Multiple `LogDestination` support (console, file, HTTP, external services)
- `StructuredLogEntry` format for all log output
- `LogEnrichmentConfig` for automatic context injection (traceId, userId, requestId)
- Log sampling for high-traffic production environments
- Buffered async logging for performance
- Routes: `GET /api/v1/logging/config`, `PUT /api/v1/logging/config`
- Events: `logging.config.changed`

**Service name:** Not in CoreServiceName (new service or integrated into kernel)

**Estimated effort:** 3-5 days

---

#### P1.2 `@objectos/tracing` — Distributed Tracing Plugin

**Spec compliance:** `system/tracing.zod.ts`

**Rationale:** The spec defines a full OpenTelemetry-compatible tracing protocol with W3C Trace Context, span management, sampling strategies, and exporter configuration. ObjectOS has no distributed tracing capability.

**Implementation scope:**
- `TracingConfig` validation from spec
- W3C `TraceContext` propagation (inject/extract on HTTP requests)
- `Span` creation for data operations, auth checks, plugin calls
- `TraceSamplingConfig` with ratio-based, rate-limited, and parent-based strategies
- OpenTelemetry exporter support (OTLP, Jaeger, Zipkin via config)
- Integration with audit events (traceId correlation)
- Middleware to auto-create server spans for all `/api/v1/*` requests
- Routes: `GET /api/v1/tracing/config`, `GET /api/v1/tracing/stats`
- Events: `trace.span.created`, `trace.span.ended`

**Service name:** New service (propose adding to CoreServiceName)

**Estimated effort:** 5-7 days

---

#### P1.3 `@objectos/search` — Search Engine Plugin

**Spec compliance:** `system/search-engine.zod.ts`

**Rationale:** The spec defines `search` as a CoreServiceName but ObjectOS has no implementation. Full-text search is critical for metadata-driven applications.

**Implementation scope:**
- `SearchEngineConfig` validation from spec
- Search index management (create, update, delete indexes)
- Pluggable search backends (in-memory MiniSearch for dev, Elasticsearch/MeiliSearch for prod)
- Auto-indexing on `data.afterCreate` / `data.afterUpdate` / `data.afterDelete` events
- Query API: `GET /api/v1/search?q=...&object=...&fields=...`
- Faceted search support
- Highlight/snippet support
- Routes: `GET /api/v1/search`, `GET /api/v1/search/indexes`, `POST /api/v1/search/reindex`
- Service name: `search`

**Estimated effort:** 5-7 days

---

#### P1.4 `@objectos/compliance` — Compliance & Data Governance Plugin

**Spec compliance:** `system/compliance.zod.ts`, `system/encryption.zod.ts`, `system/masking.zod.ts`

**Rationale:** The spec defines compliance (GDPR, HIPAA, SOC2), encryption, and data masking as separate schemas. ObjectOS has no compliance engine. These three protocols are tightly related and should be implemented as a single plugin.

**Implementation scope:**
- `ComplianceConfig` validation (GDPR, HIPAA, PCI-DSS, SOC2 profiles)
- Field-level `EncryptionConfig` (AES-256-GCM, KMS integration stubs)
- `MaskingRule` engine for PII data (email masking, phone masking, SSN masking)
- Data retention policy enforcement (auto-delete expired records)
- Data export / right-to-be-forgotten support (GDPR Article 17)
- Consent tracking
- Hook into `data.beforeFind` to apply masking rules based on user permissions
- Hook into `data.beforeCreate` / `data.beforeUpdate` for field encryption
- Routes: `GET /api/v1/compliance/status`, `POST /api/v1/compliance/export/:userId`, `DELETE /api/v1/compliance/erase/:userId`
- Events: `compliance.data.exported`, `compliance.data.erased`, `compliance.violation.detected`

**Estimated effort:** 7-10 days

---

### 5.2 Priority 2 — Advanced System Services (Phase 2)

#### P2.1 `@objectos/tenant` — Multi-Tenant Plugin

**Spec compliance:** `system/tenant.zod.ts`

**Rationale:** The spec defines 3 isolation strategies (shared_schema, isolated_schema, isolated_db) with detailed configuration for PostgreSQL RLS, schema management, and database-level isolation. ObjectOS auth supports multi-tenant via Better-Auth, but there is no tenant lifecycle management.

**Implementation scope:**
- `TenantIsolationConfig` validation (discriminated union of 3 strategies)
- `TenantSecurityPolicy` enforcement (encryption, access control, compliance per tenant)
- `TenantQuota` management (maxUsers, maxStorage, apiRateLimit)
- Tenant CRUD: create, update, suspend, delete
- Tenant context middleware (set `app.current_tenant` per request)
- Integration with auth (tenant-scoped sessions)
- Integration with permissions (tenant-scoped RBAC)
- Routes: `GET /api/v1/tenants`, `POST /api/v1/tenants`, `GET /api/v1/tenants/:id`, `PUT /api/v1/tenants/:id`
- Events: `tenant.created`, `tenant.updated`, `tenant.suspended`, `tenant.deleted`

**Estimated effort:** 7-10 days

---

#### P2.2 `@objectos/queue` — Message Queue Plugin

**Spec compliance:** `system/message-queue.zod.ts`, `system/worker.zod.ts`

**Rationale:** The spec defines `queue` as a core CoreServiceName and has detailed schemas for message queues, worker configuration, batch processing, and dead letter queues. The current `@objectos/jobs` plugin handles basic job scheduling but doesn't implement the full queue/worker protocol.

**Implementation scope:**
- `QueueConfig` validation from spec (concurrency, rate limiting, dead letter queue)
- `WorkerConfig` validation (poll interval, visibility timeout, handlers)
- `Task` / `TaskExecutionResult` lifecycle
- `BatchTask` / `BatchProgress` for bulk operations
- `TaskRetryPolicy` with exponential backoff
- Dead letter queue management
- Auto-scaling configuration stubs
- Pluggable backends (in-memory for dev, Redis/BullMQ for prod)
- Routes: `GET /api/v1/queues`, `GET /api/v1/queues/:name/stats`, `POST /api/v1/queues/:name/tasks`
- Service name: `queue`
- Events: `queue.task.enqueued`, `queue.task.completed`, `queue.task.failed`, `queue.task.dead`

**Estimated effort:** 5-7 days

---

#### P2.3 `@objectos/migration` — Schema Migration Plugin

**Spec compliance:** `system/migration.zod.ts`, `system/change-management.zod.ts`

**Rationale:** The spec defines migration and change management protocols. ObjectOS has no schema migration system — objects are defined declaratively but there's no way to evolve schemas safely.

**Implementation scope:**
- `MigrationConfig` validation from spec
- `MigrationStep` tracking (applied, pending, failed migrations)
- Schema diff detection (compare current objects with new definitions)
- Rollback support via `RollbackPlan` from change-management
- `ChangeRequest` tracking for enterprise environments
- Integration with metadata loader (detect schema changes on boot)
- Routes: `GET /api/v1/migrations`, `POST /api/v1/migrations/run`, `POST /api/v1/migrations/:id/rollback`
- Events: `migration.started`, `migration.completed`, `migration.failed`, `migration.rolled-back`

**Estimated effort:** 7-10 days

---

### 5.3 Priority 3 — Optional Services (Phase 3)

#### P3.1 `@objectos/analytics` — Analytics & BI Plugin

**Spec compliance:** `data/analytics.zod.ts` (Cube schema), ObjectOSCapabilities.analytics

**Rationale:** The spec defines `analytics` as a CoreServiceName for BI & Semantic Layer.

**Implementation scope:**
- Semantic layer using `CubeSchema` from spec/data
- Aggregation queries (GROUP BY, HAVING, window functions)
- Dashboard data API
- Service name: `analytics`

**Estimated effort:** 5-7 days

---

#### P3.2 `@objectos/graphql` — GraphQL API Plugin

**Spec compliance:** CoreServiceName `graphql`

**Rationale:** The spec defines `graphql` as an optional CoreServiceName. Many enterprise users expect GraphQL.

**Implementation scope:**
- Auto-generate GraphQL schema from ObjectQL metadata
- Query, Mutation, Subscription resolvers
- Integration with permissions (field-level security in resolvers)
- Route: `POST /api/v1/graphql`
- Service name: `graphql`

**Estimated effort:** 7-10 days

---

#### P3.3 `@objectos/ai` — AI Engine Plugin

**Spec compliance:** `ai/*.zod.ts`, CoreServiceName `ai`

**Rationale:** The spec defines AI as a CoreServiceName with Agent, RAG Pipeline schemas.

**Implementation scope:**
- Natural Language Query (NLQ) → ObjectQL conversion
- AI chat / assistant API
- RAG pipeline integration
- Service name: `ai`

**Estimated effort:** 10-14 days (depends on LLM provider)

---

#### P3.4 `@objectos/license` — License Management Plugin

**Spec compliance:** `system/license.zod.ts`

**Rationale:** Enterprise deployments need license validation.

**Implementation scope:**
- `LicenseConfig` validation from spec
- License key verification
- Feature gating based on license tier
- Usage metric collection
- Routes: `GET /api/v1/license`, `POST /api/v1/license/activate`

**Estimated effort:** 3-5 days

---

## 6. Existing Plugin Improvements

### 6.1 All Plugins — Kernel Protocol Compliance

**Apply to all 14 existing plugins:**

1. **Add `PluginCapabilityManifest`**: Each plugin should declare capabilities via spec's `plugin-capability.zod.ts`:
   ```typescript
   static readonly capabilities: PluginCapabilityManifest = {
     implements: ['com.objectstack.service.cache'],
     provides: [{ name: 'cache', version: '1.0.0' }],
     requires: [],
   };
   ```

2. **Add `PluginHealthReport`**: Each plugin should implement health checking:
   ```typescript
   async healthCheck(): Promise<PluginHealthStatus> {
     return { status: 'healthy', message: 'Cache operational', latency: 2 };
   }
   ```

3. **Validate config via spec Zod schemas**: Plugin constructors should validate their input config against the corresponding spec Zod schema.

4. **Emit standardized lifecycle events**: Use spec's `plugin-lifecycle-events.zod.ts` event names.

**Estimated effort:** 1-2 days (systematic refactor across all plugins)

---

### 6.2 `@objectos/cache` — Full Spec Alignment

**Current gap:** Uses internal config types instead of spec's `CacheConfig`.

**Changes:**
- Import and validate config against `CacheConfig` from `@objectstack/spec/system`
- Add `CacheStrategy` support (LRU, LFU, FIFO)
- Expose cache stats via `ServiceStatusSchema`
- Add `GET /api/v1/cache/stats` endpoint

**Estimated effort:** 1 day

---

### 6.3 `@objectos/jobs` — Worker Protocol Integration

**Current gap:** Basic job queue, missing full Task/Worker spec schemas.

**Changes:**
- Validate jobs against `TaskSchema` from spec
- Implement `TaskRetryPolicy` with configurable backoff
- Add `TaskExecutionResult` tracking
- Add `BatchTask` support for bulk job creation
- Add `QueueConfig` validation per named queue
- Register as both `job` and `queue` services (or separate them)

**Estimated effort:** 2-3 days

---

### 6.4 `@objectos/realtime` — Collaboration Protocol

**Current gap:** Basic WebSocket with presence, missing OT/CRDT/Cursor.

**Changes:**
- Add `CollaborativeCursor` schema support
- Add `AwarenessUserState` / `AwarenessSession` tracking
- Add `OTOperation` message type for future OT support
- Add `CollaborationSessionConfig` management
- These can be additive (extend existing WebSocket protocol)

**Estimated effort:** 3-5 days

---

### 6.5 `@objectos/metrics` — Prometheus & OpenTelemetry

**Current gap:** Basic counter/gauge/histogram, no spec schema validation.

**Changes:**
- Validate metrics against `MetricSchema` from spec
- Implement `PrometheusConfig` validation
- Add metric tagging/labeling per spec
- Add `MetricRegistry` management API

**Estimated effort:** 1-2 days

---

### 6.6 `@objectos/notification` — Template & Preference System

**Current gap:** Basic notification sending, missing template and preference management.

**Changes:**
- Add `NotificationTemplate` management (Handlebars templates stored via ObjectQL)
- Add `NotificationPreference` per user (channel preferences, quiet hours)
- Add `NotificationLog` tracking with delivery status
- Validate config against spec's `NotificationConfig`

**Estimated effort:** 2-3 days

---

### 6.7 `@objectos/storage` — Object Storage API

**Current gap:** Implements KV storage only (Memory/SQLite/Redis). Spec defines full object storage (buckets, files, presigned URLs).

**Changes:**
- Implement `ObjectStorageConfig` validation
- Add bucket management (create, list, delete)
- Add file operations (upload, download, delete, list)
- Add presigned URL generation for direct uploads
- Pluggable backends (local filesystem for dev, S3/GCS for prod)
- Routes: `GET /api/v1/storage/buckets`, `POST /api/v1/storage/upload`, `GET /api/v1/storage/download/:key`

**Estimated effort:** 3-5 days

---

## 7. Upstream Spec Improvement Proposals

Based on ObjectOS implementation experience, we propose these improvements to `@objectstack/spec`:

### 7.1 SPEC-001: Add Service Contract Interfaces

**Problem:** `core-services.zod.ts` defines `CoreServiceName` as an enum and `ServiceStatusSchema` for status reporting, but there are no TypeScript interfaces defining what methods each service MUST implement.

**Proposal:** Add formal service contract interfaces in `contracts/`:

```typescript
// contracts/cache-service.ts
export interface ICacheService {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
  stats(): Promise<CacheStats>;
}

// contracts/search-service.ts
export interface ISearchService {
  index(object: string, id: string, doc: Record<string, unknown>): Promise<void>;
  search(query: SearchQuery): Promise<SearchResult>;
  deleteIndex(name: string): Promise<void>;
}
```

**Impact on ObjectOS:** ObjectOS plugins can implement these interfaces for type-safe service registry.

---

### 7.2 SPEC-002: Extend CoreServiceName Enum

**Problem:** Several system protocols in the spec (logging, tracing, compliance, tenant, migration) have no corresponding CoreServiceName. This makes it unclear whether they should be standalone services.

**Proposal:** Add to `CoreServiceName` enum:

```typescript
export const CoreServiceName = z.enum([
  // ... existing ...
  'logging',       // Structured Logging Service
  'tracing',       // Distributed Tracing Service
  'compliance',    // Compliance & Data Governance
  'tenant',        // Multi-Tenant Management
  'migration',     // Schema Migration Service
  'encryption',    // Field-Level Encryption Service
]);
```

**Impact on ObjectOS:** Clear mapping from spec protocol to plugin service names.

---

### 7.3 SPEC-003: Add Plugin Health Check Standard

**Problem:** `plugin-lifecycle-advanced.zod.ts` defines `PluginHealthStatus` / `PluginHealthReport` but there's no standard contract for how plugins report health.

**Proposal:** Add to `contracts/`:

```typescript
// contracts/healthcheck.ts
export interface IHealthCheckable {
  healthCheck(): Promise<PluginHealthStatus>;
  getMetrics(): Promise<Record<string, number>>;
}
```

**Impact on ObjectOS:** All plugins implement `IHealthCheckable` for centralized health monitoring.

---

### 7.4 SPEC-004: Define Standard Event Taxonomy

**Problem:** `kernel/events.zod.ts` defines event schemas but doesn't prescribe a standard event naming convention that all implementations should follow.

**Proposal:** Add an event taxonomy document and Zod enum:

```typescript
export const StandardEventName = z.enum([
  // Kernel lifecycle
  'kernel.boot', 'kernel.ready', 'kernel.shutdown',
  // Data lifecycle
  'data.beforeCreate', 'data.afterCreate',
  'data.beforeUpdate', 'data.afterUpdate',
  'data.beforeDelete', 'data.afterDelete',
  'data.beforeFind', 'data.afterFind',
  // Auth lifecycle
  'auth.login', 'auth.logout', 'auth.session.created',
  // Plugin lifecycle
  'plugin.init', 'plugin.start', 'plugin.destroy',
]);
```

**Impact on ObjectOS:** Standardize event names across all plugins (some already diverge).

---

### 7.5 SPEC-005: Add Configuration Composition Schema

**Problem:** `stack.zod.ts` defines `ObjectStackDefinitionSchema` for project definition but doesn't include system configuration (logging, tracing, cache config, etc.).

**Proposal:** Extend `ObjectStackDefinitionSchema` with a `system` section:

```typescript
// In stack.zod.ts
export const ObjectStackDefinitionSchema = z.object({
  // ... existing ...
  
  /** System Configuration */
  system: z.object({
    logging: LoggingConfigSchema.optional(),
    tracing: TracingConfigSchema.optional(),
    cache: CacheConfigSchema.optional(),
    queue: QueueConfigSchema.optional(),
    search: SearchEngineConfigSchema.optional(),
    compliance: ComplianceConfigSchema.optional(),
    tenant: TenantIsolationConfigSchema.optional(),
    encryption: EncryptionConfigSchema.optional(),
  }).optional().describe('System service configurations'),
});
```

**Impact on ObjectOS:** Plugins can read validated system config from `objectstack.config.ts` instead of custom config objects.

---

## 8. Implementation Roadmap

### Phase 1: Foundation Hardening (2 weeks)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| 1.1 | Apply kernel protocol compliance to all 14 plugins (capabilities, health, lifecycle events) | 2d | 🔴 High |
| 1.2 | Implement `@objectos/logging` plugin | 4d | 🔴 High |
| 1.3 | Implement `@objectos/search` plugin | 5d | 🔴 High |
| 1.4 | Enhance `@objectos/cache` with spec schema validation | 1d | 🟡 Medium |
| 1.5 | Enhance `@objectos/metrics` with spec schema validation | 1d | 🟡 Medium |

### Phase 2: Security & Governance (2 weeks)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| 2.1 | Implement `@objectos/compliance` plugin (GDPR/encryption/masking) | 8d | 🔴 High |
| 2.2 | Implement `@objectos/tracing` plugin | 5d | 🟡 Medium |
| 2.3 | Enhance `@objectos/notification` with templates | 2d | 🟡 Medium |
| 2.4 | Enhance `@objectos/storage` with object storage API | 4d | 🟡 Medium |

### Phase 3: Enterprise Features (2 weeks)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| 3.1 | Implement `@objectos/tenant` plugin | 8d | 🟡 Medium |
| 3.2 | Implement `@objectos/queue` plugin (or merge into jobs) | 5d | 🟡 Medium |
| 3.3 | Implement `@objectos/migration` plugin | 7d | 🟡 Medium |
| 3.4 | Enhance `@objectos/realtime` with collaboration protocol | 4d | 🟢 Low |
| 3.5 | Enhance `@objectos/jobs` with worker protocol | 3d | 🟢 Low |

### Phase 4: Advanced Capabilities (2 weeks)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| 4.1 | Implement `@objectos/analytics` plugin | 5d | 🟢 Low |
| 4.2 | Implement `@objectos/graphql` plugin | 8d | 🟢 Low |
| 4.3 | Implement `@objectos/license` plugin | 3d | 🟢 Low |
| 4.4 | Implement `@objectos/ai` plugin (stub) | 5d | 🟢 Low |
| 4.5 | File spec upstream PRs (SPEC-001 through SPEC-005) | 3d | 🟡 Medium |

---

## 9. Architecture Changes

### 9.1 Plugin Registration Update

After implementing all new plugins, `objectstack.config.ts` should register them in dependency order:

```typescript
// objectstack.config.ts — Target State
export default defineStack({
  plugins: [
    // Layer 0: Data Engine
    new ObjectQLPlugin({ ... }),
    new DriverPlugin('memory', new InMemoryDriver()),

    // Layer 1: Foundation (no inter-dependencies)
    new MetricsPlugin({ ... }),
    new CachePlugin({ ... }),
    new StoragePlugin({ ... }),
    new LoggingPlugin({ ... }),      // NEW
    new TracingPlugin({ ... }),      // NEW
    new SearchPlugin({ ... }),       // NEW

    // Layer 2: Security & Identity
    new AuthPlugin({ ... }),
    new PermissionsPlugin({ ... }),
    new AuditLogPlugin({ ... }),
    new CompliancePlugin({ ... }),   // NEW

    // Layer 3: Business Logic
    new WorkflowPlugin({ ... }),
    new AutomationPlugin({ ... }),
    new JobsPlugin({ ... }),
    new QueuePlugin({ ... }),        // NEW (or merged into jobs)

    // Layer 4: Services
    new NotificationPlugin({ ... }),
    new I18nPlugin({ ... }),
    new UIPlugin({ ... }),
    new RealtimePlugin({ ... }),

    // Layer 5: Enterprise
    new TenantPlugin({ ... }),       // NEW
    new MigrationPlugin({ ... }),    // NEW
    new LicensePlugin({ ... }),      // NEW

    // Layer 6: Advanced (optional)
    new AnalyticsPlugin({ ... }),    // NEW
    new GraphQLPlugin({ ... }),      // NEW
    new AIPlugin({ ... }),           // NEW

    // Layer 7: Applications
    new AppPlugin(CrmApp),
    new AppPlugin(TodoApp),
  ],
});
```

### 9.2 Service Registry Validation

Add a boot-time validation step that checks all `required` and `core` CoreServiceNames are registered:

```typescript
// In kernel bootstrap, after all plugins init:
function validateServiceRegistry(kernel: ObjectKernel) {
  const required = ['metadata', 'data'];
  const core = ['auth', 'cache', 'queue', 'job'];

  for (const name of required) {
    if (!kernel.hasService(name)) {
      throw new Error(`Required service '${name}' not registered. Cannot start.`);
    }
  }
  for (const name of core) {
    if (!kernel.hasService(name)) {
      kernel.logger.warn(`Core service '${name}' not registered. Functionality degraded.`);
    }
  }
}
```

### 9.3 Health Check Endpoint

Add a centralized health endpoint that queries all plugins:

```
GET /api/v1/health
```

Response:
```json
{
  "status": "healthy",
  "uptime": 86400,
  "services": {
    "metadata": { "status": "running", "latency": 2 },
    "data": { "status": "running", "latency": 5 },
    "auth": { "status": "running", "latency": 10 },
    "cache": { "status": "running", "latency": 1 },
    "search": { "status": "stopped", "reason": "not configured" }
  }
}
```

### 9.4 Configuration Schema Validation

Add spec-powered config validation at boot time:

```typescript
// In objectstack.config.ts or runtime bootstrap
import { System } from '@objectstack/spec';

// Validate cache config
const cacheResult = System.CacheConfigSchema.safeParse(cacheConfig);
if (!cacheResult.success) {
  throw new Error(`Invalid cache config: ${cacheResult.error.message}`);
}
```

---

## Appendix: Spec Schema Inventory

### System Protocol Schemas (`@objectstack/spec/system`)

| # | File | Schemas | Size | Category |
|---|------|---------|------|----------|
| 1 | `audit.zod.ts` | AuditEvent, AuditConfig, AuditRetentionPolicy, 34 event types | 20KB | Observability |
| 2 | `auth-config.zod.ts` | AuthConfig, OIDCConfig, SAMLConfig | 2KB | Security |
| 3 | `cache.zod.ts` | CacheConfig, CacheStrategy, CacheEvictionPolicy | 3KB | Infrastructure |
| 4 | `change-management.zod.ts` | ChangeRequest, ChangeImpact, RollbackPlan | 9KB | Operations |
| 5 | `collaboration.zod.ts` | OTOperation, CRDTState, CollaborativeCursor, AwarenessSession | 18KB | Runtime |
| 6 | `compliance.zod.ts` | ComplianceConfig, GDPRConfig, DataRetentionPolicy | 5KB | Security |
| 7 | `core-services.zod.ts` | CoreServiceName, ServiceStatus, ServiceRequirementDef | 4KB | Kernel |
| 8 | `encryption.zod.ts` | EncryptionConfig, KeyManagement, FieldEncryption | 3KB | Security |
| 9 | `http-server.zod.ts` | HttpServerConfig, CORSConfig, StaticMount | 10KB | Infrastructure |
| 10 | `job.zod.ts` | JobConfig, JobSchedule, CronExpression | 4KB | Runtime |
| 11 | `license.zod.ts` | LicenseConfig, LicenseMetricType, LicenseTier | 3KB | Licensing |
| 12 | `logging.zod.ts` | LoggingConfig, LogDestination, StructuredLogEntry | 17KB | Observability |
| 13 | `masking.zod.ts` | MaskingRule, MaskingStrategy, MaskingType | 2KB | Security |
| 14 | `message-queue.zod.ts` | QueueConfig, QueueDriver, MessageSchema | 3KB | Infrastructure |
| 15 | `metadata-persistence.zod.ts` | MetadataPersistence, PersistenceStrategy | 8KB | Infrastructure |
| 16 | `metrics.zod.ts` | MetricSchema, MetricRegistry, PrometheusConfig | 17KB | Observability |
| 17 | `migration.zod.ts` | MigrationConfig, MigrationStep, MigrationStrategy | 4KB | Operations |
| 18 | `notification.zod.ts` | NotificationConfig, NotificationTemplate | 9KB | Runtime |
| 19 | `object-storage.zod.ts` | ObjectStorageConfig, StorageBucket, PresignedUrl | 22KB | Infrastructure |
| 20 | `registry-config.zod.ts` | RegistryConfig, PackageSource | 5KB | Configuration |
| 21 | `search-engine.zod.ts` | SearchEngineConfig, SearchIndex, SearchQuery | 4KB | Infrastructure |
| 22 | `tenant.zod.ts` | TenantSchema, TenantIsolationConfig, TenantSecurityPolicy | 19KB | Multi-Tenant |
| 23 | `tracing.zod.ts` | TracingConfig, Span, TraceContext, SamplingConfig | 17KB | Observability |
| 24 | `translation.zod.ts` | TranslationBundle, TranslationEntry | 2KB | Runtime |
| 25 | `worker.zod.ts` | Task, WorkerConfig, BatchTask, QueueConfig | 15KB | Runtime |
| 26 | `registry-config.zod.ts` | RegistryConfig | 5KB | Configuration |

### Kernel Protocol Schemas (`@objectstack/spec/kernel`)

| # | File | Key Schemas | Used by ObjectOS? |
|---|------|-------------|-------------------|
| 1 | `plugin.zod.ts` | `definePlugin`, `PluginContext` | ⚠️ Partially |
| 2 | `manifest.zod.ts` | `ManifestSchema` | ✅ Yes |
| 3 | `plugin-capability.zod.ts` | `PluginCapabilityManifest` | ❌ Not used |
| 4 | `plugin-lifecycle-advanced.zod.ts` | `PluginHealthStatus` | ❌ Not used |
| 5 | `plugin-lifecycle-events.zod.ts` | Lifecycle event schemas | ⚠️ Partially |
| 6 | `plugin-security.zod.ts` | `PluginSecurityManifest` | ❌ Not used |
| 7 | `plugin-runtime.zod.ts` | `PluginRuntimeConfig` | ❌ Not used |
| 8 | `service-registry.zod.ts` | `ServiceRegistryConfig` | ❌ Not used |
| 9 | `startup-orchestrator.zod.ts` | `StartupOrchestrator` | ❌ Not used |
| 10 | `feature.zod.ts` | `FeatureFlag` | ❌ Not used |
| 11 | `context.zod.ts` | `ExecutionContext` | ❌ Not used |
| 12 | `events.zod.ts` | Event taxonomy | ⚠️ Partially |

---

## Summary of Deliverables

| Category | Count | Est. Effort |
|----------|-------|-------------|
| New plugins (Priority 1) | 4 | 20-30 days |
| New plugins (Priority 2) | 3 | 20-27 days |
| New plugins (Priority 3) | 4 | 21-34 days |
| Existing plugin improvements | 7 | 13-21 days |
| Upstream spec proposals | 5 | 3-5 days |
| **Total** | **23 work items** | **~77-117 days** |

---

**Document maintained by:** ObjectOS Core Team
**Last updated:** 2026-02-10
**Status:** Draft — Pending Review
