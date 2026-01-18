# ObjectOS


  **The Enterprise Low-Code Runtime Engine.**
  
  Instant Backend. Security Kernel. Workflow Automation.
  
  *Built on [ObjectQL](https://github.com/objectql/objectql) & [NestJS](https://nestjs.com/).*

  [![License](https://img.shields.io/badge/license-AGPL%20v3-red.svg)](LICENSE)
  [![Stack](https://img.shields.io/badge/stack-Node.js%20%7C%20NestJS-E0234E.svg)](https://nestjs.com/)
  [![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](docker-compose.yml)

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

ObjectOS is built as a modular Monorepo using **NestJS**.

| Package | Role | Description |
| :--- | :--- | :--- |
| **`@objectos/kernel`** | **The Brain** | The core logic engine. Wraps ObjectQL, manages plugins, and handles the event bus. |
| **`@objectos/server`** | **The Gateway** | NestJS application layer. Handles HTTP/WS traffic, Middlewares, and Guards. |
| **`@objectos/plugin-auth`** | **Auth** | Authentication strategies (Local, OAuth2, Enterprise SSO). |
| **`@objectos/plugin-workflow`** | **Logic** | Workflow engine and trigger runner. |
| **`@objectos/presets`** | **Config** | Standard system objects (`_users`, `_roles`, `_audit_log`). |

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

- **[Development Plan (Q1 2026)](./docs/guide/development-plan.md)** - Detailed implementation plan for upcoming features
- **[Long-term Roadmap](./ROADMAP.md)** - Strategic vision through 2026 and beyond
- **[Architecture Guide](./ARCHITECTURE.md)** - Deep dive into system design
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute to ObjectOS

**Key Q1 2026 Goals:**
- 🔐 Production-grade permission system (Object/Field/Record-level)
- 🪝 Complete lifecycle hooks system
- 🔗 Full relationship support (Lookup, Master-Detail, Many-to-Many)
- 🧪 Test coverage (90% Kernel, 80% Server, 70% UI)

---

## ⚖️ License & Commercial Usage

**ObjectOS is open-source software licensed under the [GNU Affero General Public License v3.0 (AGPLv3)](https://www.google.com/search?q=AGPLv3).**

### What this means:

* ✅ **Free for internal use:** You can use ObjectOS internally within your company for free.
* ✅ **Free for open source:** You can use ObjectOS in AGPL-licensed open-source projects.
* ⚠️ **Copyleft:** If you modify ObjectOS or link it into your application and convey it to users (e.g., as a SaaS), you **must** open-source your entire application under AGPL.

### Commercial License

If you wish to build proprietary/closed-source SaaS applications using ObjectOS, or cannot comply with the AGPL, you must purchase a **Commercial License**.

👉 [Contact Sales for Enterprise Licensing](https://www.objectos.org/enterprise)

---

<div align="center">
<sub>Part of the <b>Object Ecosystem</b>.</sub>




<sub><a href="https://github.com/objectql/objectql">ObjectQL (Data)</a> • <b>ObjectOS (System)</b> • <a href="https://github.com/objectql/objectui">Object UI (View)</a></sub>
</div>
