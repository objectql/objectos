---
layout: home

hero:
  name: "ObjectOS"
  text: "The Business Operating System"
  tagline: "Orchestrate Identity, Workflows, and Local-First Sync in one unified runtime. The Kernel for your Enterprise."
  actions:
    - theme: brand
      text: Quick Start
      link: /guide/
    - theme: alt
      text: Architecture
      link: /guide/architecture
    - theme: alt
      text: View Specs
      link: /spec/

features:
  - title: 🛡️ Identity & Governance
    details: Built-in RBAC, SSO (OIDC/SAML), and granular field-level security. Not just a login library, but a complete governance engine that enforces authentication and authorization at every layer.
  
  - title: ⚙️ Workflow Orchestration
    details: Finite State Machines (FSM) as code. Define approval chains and automation rules declaratively in YAML, not nested if/else statements. Business logic becomes configuration.
  
  - title: 🔄 Local-First Sync Engine
    details: The killer feature. Handles conflict resolution (CRDT/LWW) to keep offline clients in sync with the server. Build truly offline-first applications without reinventing the wheel.
  
  - title: 🔌 Plugin Architecture
    details: Micro-kernel design. Everything—CRM, HRM, ERP—is just a plugin loaded via a Manifest. Extend the OS without modifying the core.
  
  - title: 🎯 Declarative Logic
    details: Business processes defined as metadata, not code. State machines, validation rules, and automation triggers all live in YAML configuration files.
  
  - title: 🏗️ Three-Layer Architecture
    details: Clean separation—Kernel handles orchestration, Drivers handle persistence, Server handles protocols. Swap databases or add features without touching business logic.
---

## The Problem with Traditional Development

You don't build an operating system by writing your own process scheduler and file system from scratch. You use an OS like Linux or Windows.

**So why are you writing your own Auth system, Workflow engine, and Sync logic for every business application?**

Modern enterprise applications suffer from:
- **Microservices Sprawl:** Too many fragmented services with duplicated auth, logging, and data access logic.
- **Spaghetti Monoliths:** Business logic tangled with HTTP handlers, making testing and changes painful.
- **Reinventing Sync:** Every team builds their own half-baked solution for offline-first applications.

## The Solution: ObjectOS as Your Enterprise Kernel

**ObjectOS is the Operating System for your business applications.** It provides the unified Control Plane that orchestrates:

- **Identity & Access:** Centralized authentication and RBAC enforcement
- **Data Synchronization:** Automatic conflict resolution for local-first architectures  
- **Business Processes:** Workflow state machines and automation triggers
- **Plugin Ecosystem:** Modular extensions that integrate seamlessly

Think of it as the **kernel layer** between your business logic and infrastructure. Just as Linux manages processes, memory, and I/O, ObjectOS manages identity, state, and synchronization.

---

## The Four Pillars of the Kernel

### 1. Identity & Governance Engine

ObjectOS isn't just another authentication library—it's a **complete governance framework**.

**Capabilities:**
- **Multi-Strategy Auth:** OIDC, SAML, LDAP, OAuth2—unified under one API
- **Granular RBAC:** Object-level, field-level, and record-level permissions
- **Audit Logging:** Built-in tracking of every mutation (who did what, when)
- **Session Management:** Secure JWT-based sessions with automatic refresh

**Why it matters:** Security isn't bolted on afterward. It's enforced at the kernel level before any data access occurs.

### 2. Workflow Orchestration (FSM Engine)

Traditional code: Business logic buried in controllers as nested `if/else` statements.  
ObjectOS way: Business logic as **Finite State Machines** defined in YAML.

**Example Workflow:** Leave Request Approval Process

```yaml
# workflows/leave_request.workflow.yml
name: leave_request_flow
object: leave_request

states:
  draft:
    initial: true
    transitions:
      submit: pending_approval
  
  pending_approval:
    transitions:
      approve: approved
      reject: rejected
    on_enter:
      - action: notify_manager
        params:
          template: approval_required
  
  approved:
    final: true
    on_enter:
      - action: update_calendar
      - action: notify_employee
  
  rejected:
    final: true
    on_enter:
      - action: notify_employee

# Guards define permission checks before state transitions
guards:
  can_submit:
    condition: "user.id == record.owner"  # Only owner can submit
  can_approve:
    condition: "user.role in ['manager', 'hr']"  # Only managers/HR can approve
```

**The result?** Business analysts can modify approval flows without touching code. Developers avoid spaghetti logic. The kernel executes the transitions reliably.

### 3. Local-First Sync Engine (The Killer Feature)

**The Hard Problem:** Building offline-first applications is notoriously difficult. How do you handle conflicts when Client A and Client B both edit the same record while offline?

**The ObjectOS Solution:** A built-in **Replication Protocol** that acts as the Sync Master.

**How it works:**

1. **Push Phase:** Client sends a **Mutation Log** (sequence of actions), not just final state
2. **Conflict Detection:** ObjectOS detects conflicts using Vector Clocks or Last-Write-Wins (LWW)
3. **Resolution:** Configurable strategies—LWW, CRDT merge, or custom resolvers
4. **Pull Phase:** Server sends **Delta Packets** (changes since last checkpoint) to clients

**API Design:**

```typescript
// Client-side (ObjectUI or Mobile)
await syncEngine.push({
  since_cursor: '1234567890',
  mutations: [
    { type: 'update', object: 'contacts', id: '123', data: {...} }
  ]
});

// Server responds with resolved state + new cursor
const delta = await syncEngine.pull({
  since_cursor: '1234567890'
});
```

**Why it matters:** You get Notion-like sync capabilities without building it yourself. The kernel handles the hard parts—delta compression, conflict resolution, and incremental sync.

### 4. Plugin Architecture (Micro-Kernel Design)

ObjectOS follows the **micro-kernel pattern**: The core provides essential services (auth, sync, workflow), and everything else is a plugin.

**Plugin Manifest Example:**

```typescript
// plugins/crm/manifest.ts
// Note: This is a conceptual example of the plugin architecture
import { PluginManifest } from '@objectos/kernel';

export const CrmPlugin: PluginManifest = {
  id: 'steedos-crm',
  version: '1.0.0',
  
  // Dependencies (other plugins this one needs)
  dependencies: ['@objectos/auth'],
  
  // Register capabilities
  objects: ['./objects/*.object.yml'],
  workflows: ['./workflows/*.workflow.yml'],
  
  // Lifecycle hooks
  onLoad: async (ctx) => {
    ctx.logger.info('CRM Plugin loaded');
    await initializeCrmDefaults();
  },
  
  // Event listeners
  onEvent: {
    'user.signup': async (ctx, payload) => {
      // Automatically create a Lead when a user signs up
      await ctx.broker.call('data.create', {
        object: 'leads',
        data: {
          name: payload.name,
          email: payload.email,
          source: 'website_signup'
        }
      });
    }
  }
};
```

**The benefits:**
- **Isolation:** Plugins can't crash the kernel
- **Versioning:** Load different versions of plugins for A/B testing
- **Marketplace:** Community plugins install via `objectos install @vendor/plugin-name`

---

## Declarative Architecture: Show, Don't Tell

Traditional development: Imperative code scattered across controllers.  
ObjectOS development: **Architecture as Configuration.**

### Example: Order Fulfillment Workflow

Instead of this mess:

```javascript
// ❌ Traditional approach - Logic buried in code
app.post('/orders/:id/submit', async (req, res) => {
  const order = await db.findOne('orders', req.params.id);
  
  if (order.status !== 'draft') {
    return res.status(400).json({ error: 'Already submitted' });
  }
  
  if (req.user.id !== order.owner && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  order.status = 'pending_approval';
  await db.update('orders', order.id, order);
  
  await emailService.send(order.approver, 'approval_needed', {...});
  
  res.json(order);
});
```

You write this:

```yaml
# ✅ ObjectOS approach - Logic as configuration
name: order_fulfillment
object: orders

states:
  draft:
    initial: true
    transitions:
      submit: pending_approval
  
  pending_approval:
    transitions:
      approve: processing
      reject: cancelled
    on_enter:
      - action: reserve_inventory
      - action: notify_approver

guards:
  can_submit:
    condition: "user.id == record.owner OR user.role == 'admin'"
```

**The Kernel handles:**
- ✅ State validation (can't submit if not in draft)
- ✅ Permission checks (guard conditions)
- ✅ Action execution (notifications, inventory)
- ✅ Audit logging (automatic trail)

---

## The Local-First Deep Dive

Offline-first applications are the future, but they're hard to build. ObjectOS makes it trivial.

### The Challenge

When users work offline:
- **Client A** edits Contact #123 at 10:00 AM (offline)
- **Client B** edits Contact #123 at 10:05 AM (offline)
- Both sync at 10:15 AM → **Conflict!**

### The ObjectOS Replication Protocol

**Architecture:**

```
┌─────────────────┐          ┌─────────────────┐
│  Client (RxDB)  │          │  Server (Kernel)│
│                 │          │                 │
│  Local SQLite   │◄────────►│  PostgreSQL     │
│  Mutation Log   │   Sync   │  Source of Truth│
└─────────────────┘          └─────────────────┘
```

**Step 1: Track Mutations**

Clients don't just send final state—they send **operation logs:**

```typescript
// Client logs each change
mutations: [
  { type: 'update', object: 'contacts', id: '123', 
    field: 'email', value: 'new@example.com', 
    timestamp: 1674567890, client_id: 'A' }
]
```

**Step 2: Conflict Detection**

Server uses **Vector Clocks** to detect concurrent edits:

```typescript
// Server detects conflict
if (serverVersion > clientVersion && clientVersion > lastSyncVersion) {
  // Concurrent modification detected
  resolveConflict(serverData, clientData);
}
```

**Step 3: Resolution Strategies**

Configurable per field:

```yaml
# object definition
fields:
  email:
    type: email
    sync_strategy: last_write_wins  # Last Write Wins (LWW): Timestamp wins
  
  description:
    type: textarea
    sync_strategy: crdt_merge       # CRDT: Merge both edits
```

**Step 4: Delta Transmission**

Server only sends changes since last sync:

```typescript
// Client requests delta
GET /api/sync/pull?since_cursor=1674567890

// Server responds with minimal payload
{
  cursor: 1674568000,
  changes: [
    { type: 'update', object: 'contacts', id: '456', data: {...} }
  ]
}
```

**The Result:** Your mobile app works seamlessly offline, syncs reliably, and handles conflicts intelligently—all without writing sync logic.

---

## The ObjectStack Trinity

ObjectOS doesn't work in isolation. It's part of a cohesive ecosystem:

```
┌─────────────────────────────────────────────────┐
│              ObjectStack Trinity                │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   │
│  │ ObjectQL │   │ ObjectOS │   │ ObjectUI │   │
│  │  (Data)  │──►│ (System) │──►│  (View)  │   │
│  └──────────┘   └──────────┘   └──────────┘   │
│       │               │               │        │
│       ▼               ▼               ▼        │
│   Defines        Breathes Life    Renders     │
│   Structure      Into Data        Interface   │
└─────────────────────────────────────────────────┘
```

### ObjectQL: The Data Layer

**Role:** Defines the structure of your business objects.

```yaml
# ObjectQL defines WHAT
name: contacts
fields:
  email: { type: email, required: true }
```

### ObjectOS: The System Layer

**Role:** Governs HOW the business operates.

- Enforces who can access the contact (RBAC)
- Executes workflows when contacts are created
- Syncs contacts between devices
- Runs the plugin that extends contact functionality

### ObjectUI: The View Layer

**Role:** Presents data to humans.

```typescript
// ObjectUI consumes metadata from ObjectOS
<ObjectGrid 
  objectName="contacts" 
  kernel={objectOS}
/>
```

**The Integration:**

1. **Developer writes:** One YAML file (ObjectQL)
2. **ObjectOS processes:** Loads metadata, enforces security, manages state
3. **ObjectUI renders:** Auto-generated forms, grids, charts

**The result:** Full-stack application from a single source of truth.

---

## Getting Started

### Quick Start: The 5-Minute Demo

```bash
# 1. Clone and install
git clone https://github.com/objectstack-ai/objectos
cd objectos && pnpm install

# 2. Start the kernel
pnpm dev

# 3. The API is live at http://localhost:3000
# Visit http://localhost:3000/api/metadata to see loaded objects
```

### Define Your First Business Object

```yaml
# objects/tasks.object.yml
name: tasks
label: Task
icon: check-square  # Lucide icon name (https://lucide.dev)

fields:
  title:
    type: text
    label: Title
    required: true
  
  status:
    type: select
    label: Status
    options:
      - value: todo
        label: To Do
      - value: in_progress
        label: In Progress
      - value: done
        label: Done
    default: todo
  
  assigned_to:
    type: lookup
    reference_to: users
    label: Assigned To

permission_set:
  allowRead: true
  allowCreate: ['user']
  allowEdit: ['owner', 'admin']
  allowDelete: ['admin']
```

**Immediately available:**
- ✅ `POST /api/data/tasks` - Create tasks
- ✅ `GET /api/data/tasks` - Query tasks
- ✅ Permission enforcement (only owner or admin can edit)
- ✅ Relationship resolution (loads assigned user automatically)

### Next Steps

- [Architecture Guide](./guide/architecture.md) - Deep dive into the kernel design
- [Plugin Development](./guide/logic-hooks.md) - Extend ObjectOS with custom logic
- [Sync Protocol](./spec/http-protocol.md) - Build offline-first clients

---

## Why ObjectOS?

**For CTOs:** Reduce technical debt. Centralize governance. Scale with confidence.

**For Architects:** Clean separation of concerns. Testable. Standards-based.

**For Developers:** Write less code. Define business logic declaratively. Ship faster.

**The Core Principle:**

> **"You don't build infrastructure. You orchestrate capabilities."**

ObjectOS is the orchestrator. The kernel. The foundation of your digital enterprise.

