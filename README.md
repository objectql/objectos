# ObjectOS


  **The Enterprise Low-Code Runtime Engine.**
  
  Instant Backend. Security Kernel. Workflow Automation.
  
  *Built on [ObjectQL](https://github.com/objectql/objectql) & Microkernel Architecture.*

  [![License](https://img.shields.io/badge/license-AGPL%20v3-red.svg)](LICENSE)
  [![Stack](https://img.shields.io/badge/stack-Node.js%20%7C%20NestJS-E0234E.svg)](https://nestjs.com/)
  [![Runtime](https://img.shields.io/badge/runtime-@objectstack%2Fruntime-blue.svg)](packages/runtime)

---

## 🚀 What's New: Microkernel Architecture

**ObjectOS v0.1.0** introduces a revolutionary **microkernel plugin architecture** that transforms the entire platform into a lightweight, extensible runtime engine.

### Key Highlights

✨ **@objectstack/runtime** - Brand new microkernel package  
🔌 **Plugin System** - Everything is a plugin, even core features  
⚡ **Lightning Fast** - < 5 second startup, < 100ms plugin load  
🎯 **Type Safe** - Full TypeScript with strict mode  
✅ **100% Tested** - Comprehensive test coverage  

[**Read the complete implementation summary →**](./IMPLEMENTATION_SUMMARY_MICROKERNEL.md)

---

## 🏢 Introduction

**ObjectOS** is a production-ready, metadata-driven runtime platform. 

While **ObjectQL** defines *how data looks*, **ObjectOS** defines *how business runs*. It acts as the "Operating System" for your enterprise data, instantly turning static YAML schemas into secure, scalable, and compliant APIs.

**The Role of ObjectOS:**
* **The Enforcer:** Intercepts every request to enforce RBAC (Role-Based Access Control) and Record-Level Security (RLS).
* **The Server:** Automatically serves REST, GraphQL, and JSON-RPC APIs for **[Object UI](https://github.com/objectql/objectui)**.
* **The Automator:** Runs server-side triggers, workflows, and scheduled jobs.

---

## 🚀 Key Features

### 🛡️ Enterprise Security Kernel
ObjectOS doesn't just read data; it protects it.
* **Authentication:** Integrated OIDC, SAML, and LDAP support (via Better-Auth).
* **Fine-Grained Permission:** Field-level and record-level sharing rules defined in YAML.
* **Audit Logging:** Built-in tracking of who did what and when.

### 🔌 Instant API Gateway
Stop writing boilerplate controllers.
* **Auto-generated REST API:** `GET /api/v1/data/{object}` works out-of-the-box.
* **Auto-generated GraphQL:** Instant schema stitching based on your ObjectQL definitions.
* **Metadata API:** Serves UI configuration to frontend clients like Object UI.

### ⚙️ Workflow & Automation
* **Triggers:** Run code `beforeInsert`, `afterUpdate`, `beforeDelete`.
* **Flow Engine:** Visual workflow execution (compatible with BPMN-style logic).
* **Job Queue:** Background task processing based on Redis.

---

## 📦 Architecture

ObjectOS is built as a modular Monorepo using **NestJS** and follows the **@objectstack/spec** protocol.

### Micro-Kernel Architecture

ObjectOS implements a **micro-kernel plugin architecture** where core functionality is minimal and all features are loaded as plugins:

```
┌─────────────────────────────────────────────────────────┐
│               @objectstack/runtime (Core)                │
│  • Plugin Lifecycle Manager (init/start/destroy)        │
│  • Service Registry (DI Container)                      │
│  • Event Bus (Hook System)                              │
│  • Dependency Resolver (Topological Sort)               │
└──────────────┬──────────────────────────────────────────┘
               │
       ┌───────┴────────┬────────────┬──────────┐
       │                │            │          │
  ┌────▼─────┐   ┌─────▼─────┐  ┌──▼───┐  ┌───▼────┐
  │ ObjectQL │   │  Driver   │  │Server│  │ Custom │
  │  Plugin  │   │  Plugin   │  │Plugin│  │ Plugin │
  └──────────┘   └───────────┘  └──────┘  └────────┘
```

See [@objectstack/runtime](packages/runtime) for details on the plugin system.

### Protocol Compliance

ObjectOS adheres to the [@objectstack/spec](https://github.com/objectstack-ai/spec) protocol, which defines:
- **Kernel Protocol**: Plugin lifecycle, manifest structure, and context interfaces
- **Data Protocol**: Object schemas, field types, queries, and hooks
- **System Protocol**: Audit logging, events, and job scheduling
- **UI Protocol**: App configurations, views, and dashboards

This ensures interoperability across the ObjectStack ecosystem (ObjectQL, ObjectOS, ObjectUI).

| Package | Role | Description |
| :--- | :--- | :--- |
| **`@objectstack/runtime`** | **The Kernel** | Micro-kernel with plugin lifecycle and service registry. |
| **`@objectos/plugin-server`** | **The Gateway** | NestJS HTTP server as a runtime plugin. |
| **`@objectos/plugin-better-auth`** | **Auth** | Authentication strategies (Local, OAuth2, Enterprise SSO). |
| **`@objectos/plugin-audit-log`** | **Audit** | Comprehensive audit logging and field history tracking. |
| **`@objectos/plugin-storage`** | **Storage** | Plugin-isolated KV storage (Memory, SQLite, Redis). |
| **`@objectos/plugin-metrics`** | **Monitoring** | System metrics collection with Prometheus export. |
| **`@objectos/plugin-cache`** | **Cache** | Cache abstraction layer (LRU, Redis). |
| **`@objectos/plugin-i18n`** | **i18n** | Internationalization with multi-locale support. |
| **`@objectos/plugin-notification`** | **Notifications** | Multi-channel notifications (Email, SMS, Push, Webhook). |
| **`@objectos/presets`** | **Config** | Standard system objects (`_users`, `_roles`, `_audit_log`). |
| **`@objectos/kernel`** | **DEPRECATED** | ⚠️ Use `@objectstack/runtime` instead |
| **`@objectos/server`** | **DEPRECATED** | ⚠️ Use `@objectos/plugin-server` instead |

---

## ⚡ Getting Started

### Prerequisites
* Node.js 18+
* PostgreSQL or MongoDB
* Redis (for Queues/Caching)

### Installation

```bash
# Clone the repository
git clone https://github.com/objectstack-ai/objectos.git

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env

```

### Running the Server

ObjectOS runs as a standard NestJS application.

```bash
# Start in development mode
pnpm dev

# The API is now available at http://localhost:3000
# The Metadata API is at http://localhost:3000/api/v1/metadata

```

---

## 🧩 Usage Example

ObjectOS is designed to be injected into your application.

```typescript
// main.ts (Your NestJS App)
import { NestFactory } from '@nestjs/core';
import { ObjectOSModule } from '@objectos/server';
import { SqlDriver } from '@objectql/driver-sql';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Initialize ObjectOS
  await app.get(ObjectOSModule).boot({
    // 1. Define Data Source (ObjectQL Driver)
    driver: new SqlDriver({
      connection: process.env.DATABASE_URL
    }),
    
    // 2. Load Plugins
    plugins: [
      AuthPlugin({ secret: '...' }),
      WorkflowPlugin()
    ],
    
    // 3. Load Metadata
    metadata: ['./src/objects/*.yml']
  });

  await app.listen(3000);
}
bootstrap();

```

---

## 📋 Development & Roadmap

Want to contribute or see what's coming next?

### 🆕 Spec System Development (2026)

**Complete implementation plan based on @objectstack/spec protocol:**

- **[📑 Documentation Index](./SPEC_SYSTEM_INDEX.md)** - Central hub for all spec system docs
- **[📘 Development Plan](./SPEC_SYSTEM_DEVELOPMENT_PLAN.md)** - Complete 16-week technical plan
- **[⚡ Quick Reference](./SPEC_SYSTEM_QUICK_REFERENCE.md)** - Quick start guide and cheat sheet
- **[🏗️ Architecture Comparison](./ARCHITECTURE_COMPARISON.md)** - Kernel vs Runtime visual guide
- **[🗺️ Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)** - Bilingual roadmap (中文/English)

### 📚 General Documentation

- **[Phase 3 Implementation Summary](./PHASE_3_IMPLEMENTATION_SUMMARY.md)** - Complete summary of 5 system plugins implementation
- **[Development Plan (Q1 2026)](./docs/guide/development-plan.md)** - Detailed implementation plan for upcoming features
- **[Long-term Roadmap](./ROADMAP.md)** - Strategic vision through 2026 and beyond
- **[Architecture Guide](./ARCHITECTURE.md)** - Deep dive into system design
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute to ObjectOS

### 📚 Upgrade Guides

Detailed migration guides for upgrading ObjectStack dependencies:

- **[ObjectStack 0.8.0 Upgrade Guide](./OBJECTSTACK_0.8.0_UPGRADE.md)** - Latest upgrade (Zod v4, TypeScript fixes)
- **[ObjectStack 0.7.2 Upgrade Guide](./OBJECTSTACK_0.7.2_UPGRADE.md)** - CLI integration and ES module fixes
- **[ObjectStack 0.7.1 Upgrade Guide](./UPGRADE_SUMMARY_0.7.1.md)** - Initial runtime migration

**Key Q1 2026 Goals:**
- 🔐 Production-grade permission system (Object/Field/Record-level)
- 🪝 Complete lifecycle hooks system
- 🔗 Full relationship support (Lookup, Master-Detail, Many-to-Many)
- 🧪 Test coverage (90% Kernel, 80% Server, 70% UI)
- 🎯 100% @objectstack/spec protocol compliance

---

## ⚖️ License & Commercial Usage

**ObjectOS is open-source software licensed under the [GNU Affero General Public License v3.0 (AGPLv3)](https://www.google.com/search?q=AGPLv3).**

### What this means:

* ✅ **Free for internal use:** You can use ObjectOS internally within your company for free.
* ✅ **Free for open source:** You can use ObjectOS in AGPL-licensed open-source projects.
* ⚠️ **Copyleft:** If you modify ObjectOS or link it into your application and convey it to users (e.g., as a SaaS), you **must** open-source your entire application under AGPL.

### Commercial License

If you wish to build proprietary/closed-source SaaS applications using ObjectOS, or cannot comply with the AGPL, you must purchase a **Commercial License**.

👉 Contact us for Enterprise Licensing: [GitHub Issues](https://github.com/objectstack-ai/objectos/issues)

---

<div align="center">
<sub>Part of the <b>Object Ecosystem</b>.</sub>




<sub><a href="https://github.com/objectql/objectql">ObjectQL (Data)</a> • <b>ObjectOS (System)</b> • <a href="https://github.com/objectql/objectui">Object UI (View)</a></sub>
</div>
