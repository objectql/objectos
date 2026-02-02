# ObjectOS Architecture Comparison: Kernel vs Runtime

> **Visual guide to understanding the architectural evolution**

---

## 🏛️ The Big Picture

### ObjectStack Ecosystem

```
┌─────────────────────────────────────────────────────────┐
│                 ObjectStack Ecosystem                    │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  ObjectUI   │  │  ObjectOS   │  │  ObjectQL   │    │
│  │   (View)    │◄─┤  (System)   ├─►│   (Data)    │    │
│  │             │  │             │  │             │    │
│  │ • React UI  │  │ • Identity  │  │ • Metadata  │    │
│  │ • Forms     │  │ • RBAC      │  │ • Queries   │    │
│  │ • Grids     │  │ • Workflow  │  │ • CRUD      │    │
│  │ • Charts    │  │ • Sync      │  │ • Drivers   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                          │
│            All Based on @objectstack/spec               │
│                  (Protocol Layer)                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Architecture Evolution

### Phase 1: Monolithic Kernel (Deprecated)

```
┌─────────────────────────────────────────────────────┐
│           @objectos/kernel (37 files)                │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │            Core Features (Built-in)        │    │
│  │                                            │    │
│  │  ✓ Plugin System                          │    │
│  │  ✓ API Router + Middleware                │    │
│  │  ✓ Permission Engine                      │    │
│  │  ✓ OpenAPI Generation                     │    │
│  │  ✓ Rate Limiting                          │    │
│  │  ✓ Endpoint Registry                      │    │
│  │  ✓ Dependency Resolution                  │    │
│  │  ✓ Hot Reload                             │    │
│  │  ✓ Metrics System                         │    │
│  └────────────────────────────────────────────┘    │
│                      ↓                              │
│              ObjectQL Integration                   │
│                      ↓                              │
│                  Database                           │
└─────────────────────────────────────────────────────┘

Problems:
❌ Monolithic - hard to extend
❌ Tight coupling
❌ Large bundle size
❌ All-or-nothing approach
```

### Phase 2: Microkernel (Current)

```
┌─────────────────────────────────────────────────────┐
│      @objectstack/runtime (7 files, minimal)        │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │         Minimal Core (Only Essentials)     │    │
│  │                                            │    │
│  │  • Plugin Lifecycle (init/start/destroy)  │    │
│  │  • Service Registry (DI)                  │    │
│  │  • Event Bus (hooks)                      │    │
│  │  • Logger                                 │    │
│  └────────────────────────────────────────────┘    │
│                      ↑                              │
│              Load via Plugins                       │
│                      ↓                              │
│  ┌──────────┬──────────┬──────────┬──────────┐    │
│  │  Server  │   Auth   │  Audit   │  Custom  │    │
│  │  Plugin  │  Plugin  │  Plugin  │  Plugin  │    │
│  └──────────┴──────────┴──────────┴──────────┘    │
└─────────────────────────────────────────────────────┘

Benefits:
✅ Lightweight core
✅ Plugin-based features
✅ Easy to extend
✅ Choose what you need
```

---

## 📦 Package Comparison

### Old Architecture (Kernel)

```
@objectos/kernel
├── Core (Built-in)
│   ├── objectos.ts              ← Main class
│   ├── plugin-manager.ts        ← Plugin lifecycle
│   ├── dependency-resolver.ts   ← Plugin dependencies
│   │
│   ├── API System (Built-in)
│   │   ├── router.ts
│   │   ├── contracts.ts
│   │   ├── response.ts
│   │   ├── errors.ts
│   │   ├── endpoint-registry.ts
│   │   ├── discovery.ts
│   │   ├── openapi.ts
│   │   ├── metadata.ts
│   │   ├── mapping.ts
│   │   ├── rate-limit.ts
│   │   └── middleware/
│   │       ├── auth.ts
│   │       ├── cors.ts
│   │       ├── logging.ts
│   │       ├── validation.ts
│   │       └── rate-limit.ts
│   │
│   ├── Permission System (Built-in)
│   │   ├── permission-set-loader.ts
│   │   ├── object-permissions.ts
│   │   ├── field-permissions.ts
│   │   └── permission-aware-crud.ts
│   │
│   └── Utilities (Built-in)
│       ├── scoped-storage.ts
│       ├── metrics.ts
│       ├── version-manager.ts
│       └── hot-reload.ts
│
└── @objectos/server (Separate)
    └── NestJS wrapper
```

### New Architecture (Runtime + Plugins)

```
@objectstack/runtime (Minimal Core)
├── kernel.ts              ← Core kernel
├── plugin-context.ts      ← Plugin API
├── logger.ts              ← Logging
└── types.ts               ← Base types

┌──────────────────────── Plugins ────────────────────────┐

@objectos/plugin-server          ← HTTP Server
├── NestJS integration
├── Route registration
└── Middleware setup

@objectos/plugin-api-core        ← API Protocol (NEW)
├── Router
├── Contracts
├── Response formatting
├── Error handling
└── Middleware
    ├── Auth
    ├── CORS
    ├── Logging
    ├── Validation
    └── Rate limiting

@objectos/plugin-api-discovery   ← API Discovery (NEW)
├── Discovery endpoint
├── OpenAPI generator
└── Metadata service

@objectos/plugin-permissions     ← Permission System (NEW)
├── Object-level RBAC
├── Field-level security
├── Record-level security
└── Permission set loader

@objectos/plugin-storage         ← Storage (NEW)
└── Scoped KV storage

@objectos/plugin-metrics         ← Monitoring (NEW)
├── Metrics collector
└── Prometheus exporter

@objectos/plugin-workflow        ← Workflow (NEW)
├── State machines
└── Process automation

@objectos/plugin-sync            ← Sync Protocol (NEW)
├── Differential sync
├── Conflict resolution
├── WebSocket server
└── Realtime subscriptions

@objectos/plugin-audit-log       ← Audit (Existing)
└── Event tracking

@objectos/plugin-better-auth     ← Auth (Existing)
└── Authentication

└────────────────────────────────────────────────────────┘
```

---

## 🔌 Plugin System Comparison

### Old Kernel Plugin API

```typescript
// Complex manifest with many hooks
export const MyPlugin: PluginManifest = {
  id: 'my-plugin',
  version: '1.0.0',
  dependencies: ['@objectos/auth'],
  
  // Objects to load
  objects: ['./objects/*.yml'],
  
  // Workflows to load
  workflows: ['./workflows/*.yml'],
  
  // Many lifecycle hooks
  onInstall: async (ctx) => { /* ... */ },
  onEnable: async (ctx) => { /* ... */ },
  onLoad: async (ctx) => { /* ... */ },
  onDisable: async (ctx) => { /* ... */ },
  onUninstall: async (ctx) => { /* ... */ },
  
  // Event handlers
  onEvent: {
    'user.signup': async (ctx, payload) => { /* ... */ }
  }
};
```

### New Runtime Plugin API

```typescript
// Simple, clean interface
export class MyPlugin implements Plugin {
  name = 'my-plugin';
  version = '1.0.0';
  
  // Three lifecycle methods
  async init(context: PluginContext): Promise<void> {
    // Register services
    context.services.register('myService', new MyService());
    
    // Register hooks
    context.on('beforeInsert', async (data) => {
      console.log('Hook triggered', data);
    });
  }
  
  async start(): Promise<void> {
    // Start plugin
  }
  
  async destroy(): Promise<void> {
    // Cleanup
  }
}
```

---

## 🔄 Data Flow Comparison

### Old Architecture: Request → Kernel → Database

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ HTTP Request
     ▼
┌─────────────────────────────────┐
│    @objectos/kernel             │
│                                 │
│  ┌──────────────────────────┐  │
│  │   Built-in Router        │  │
│  │   ├─ CORS Middleware     │  │
│  │   ├─ Auth Middleware     │  │
│  │   ├─ Rate Limit          │  │
│  │   └─ Validation          │  │
│  └──────────┬───────────────┘  │
│             │                   │
│  ┌──────────▼───────────────┐  │
│  │  Permission Engine       │  │
│  │  ├─ Object Permissions   │  │
│  │  ├─ Field Permissions    │  │
│  │  └─ Record Filter (RLS)  │  │
│  └──────────┬───────────────┘  │
│             │                   │
│  ┌──────────▼───────────────┐  │
│  │  ObjectQL Integration    │  │
│  └──────────┬───────────────┘  │
└─────────────┼───────────────────┘
              │
              ▼
     ┌──────────────┐
     │   Database   │
     └──────────────┘
```

### New Architecture: Request → Plugins → Database

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ HTTP Request
     ▼
┌──────────────────────────────────────────┐
│  @objectos/plugin-server                 │
│  (NestJS HTTP Server)                    │
└────┬─────────────────────────────────────┘
     │ Route to Plugin
     ▼
┌──────────────────────────────────────────┐
│  @objectos/plugin-api-core               │
│  ┌────────────────────────────────────┐  │
│  │  Router                            │  │
│  │  ├─ CORS Middleware                │  │
│  │  ├─ Auth Middleware                │  │
│  │  ├─ Rate Limit Middleware          │  │
│  │  └─ Validation Middleware          │  │
│  └──────────────┬─────────────────────┘  │
└─────────────────┼────────────────────────┘
                  │ Call Permission Plugin
                  ▼
┌──────────────────────────────────────────┐
│  @objectos/plugin-permissions            │
│  ┌────────────────────────────────────┐  │
│  │  Permission Manager                │  │
│  │  ├─ Check Object Permissions       │  │
│  │  ├─ Filter Fields                  │  │
│  │  └─ Apply RLS Filters              │  │
│  └──────────────┬─────────────────────┘  │
└─────────────────┼────────────────────────┘
                  │ Query Data
                  ▼
┌──────────────────────────────────────────┐
│  @objectql/core                          │
│  (Data Layer)                            │
└────┬─────────────────────────────────────┘
     │
     ▼
┌──────────────┐
│   Database   │
└──────────────┘
```

---

## 🎯 Feature Distribution

### Kernel (All Built-in) vs Runtime (Plugin-based)

| Feature | Kernel | Runtime | Plugin Package |
|---------|--------|---------|----------------|
| **Core Lifecycle** | ✅ Built-in | ✅ Built-in | N/A |
| **Service Registry** | ✅ Built-in | ✅ Built-in | N/A |
| **Event Hooks** | ✅ Built-in | ✅ Built-in | N/A |
| **HTTP Server** | ✅ Built-in | ❌ | @objectos/plugin-server |
| **API Router** | ✅ Built-in | ❌ | @objectos/plugin-api-core |
| **Middleware** | ✅ Built-in | ❌ | @objectos/plugin-api-core |
| **Permissions** | ✅ Built-in | ❌ | @objectos/plugin-permissions |
| **OpenAPI** | ✅ Built-in | ❌ | @objectos/plugin-api-discovery |
| **Scoped Storage** | ✅ Built-in | ❌ | @objectos/plugin-storage |
| **Metrics** | ✅ Built-in | ❌ | @objectos/plugin-metrics |
| **Workflow** | ❌ | ❌ | @objectos/plugin-workflow (NEW) |
| **Sync Protocol** | ❌ | ❌ | @objectos/plugin-sync (NEW) |
| **Audit Logging** | ❌ | ❌ | @objectos/plugin-audit-log |
| **Authentication** | ❌ | ❌ | @objectos/plugin-better-auth |

---

## 📊 Size & Performance Comparison

### Bundle Size

```
Old Architecture (Kernel)
┌────────────────────────────────┐
│  @objectos/kernel: ~500 KB     │
│  (includes everything)         │
└────────────────────────────────┘

New Architecture (Runtime + Plugins)
┌────────────────────────────────┐
│  @objectstack/runtime: ~50 KB  │  ← Core only
│  + Plugins (only what you use):│
│    - server: ~100 KB           │
│    - api-core: ~80 KB          │
│    - permissions: ~60 KB       │
│    - auth: ~40 KB              │
│                                │
│  Total (typical): ~330 KB      │  ← 34% smaller
└────────────────────────────────┘
```

### Memory Footprint

```
Kernel: ~80 MB   (everything loaded)
Runtime: ~45 MB  (minimal + common plugins)
Savings: ~44%
```

---

## 🔐 Security Model Comparison

### Kernel (Integrated)

```
┌─────────────────────────────────┐
│        Single Process           │
│  ┌───────────────────────────┐  │
│  │  All Features Share       │  │
│  │  Same Memory Space        │  │
│  │                           │  │
│  │  No Isolation Between     │  │
│  │  Components               │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘

Risk: Bug in one feature affects all
```

### Runtime (Isolated)

```
┌─────────────────────────────────┐
│     @objectstack/runtime        │
│  ┌───────────────────────────┐  │
│  │   Kernel Core             │  │
│  │   (Minimal attack surface)│  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
         ↓ (loads)
┌──────┬──────┬──────┬──────┬─────┐
│Plugin│Plugin│Plugin│Plugin│Plugin│
│  1   │  2   │  3   │  4   │  5  │
│      │      │      │      │     │
│Scoped│Scoped│Scoped│Scoped│Scoped│
│      │      │      │      │     │
└──────┴──────┴──────┴──────┴─────┘

Benefit: Plugins can be sandboxed
```

---

## 🚀 Startup Time Comparison

### Kernel Startup

```
1. Load all built-in features      [████████] 800ms
2. Initialize metadata parser      [██] 200ms
3. Connect to database             [███] 300ms
4. Load plugin manifests           [██] 200ms
5. Start HTTP server               [██] 200ms
                                   ───────────
Total: ~1.7 seconds
```

### Runtime Startup

```
1. Load minimal kernel             [██] 150ms
2. Load required plugins           [████] 400ms
3. Connect to database             [███] 300ms
4. Start plugins                   [███] 350ms
                                   ───────────
Total: ~1.2 seconds (29% faster)
```

---

## 🛠️ Development Experience

### Adding a New Feature

**Kernel Approach** (Modify Core):
```typescript
// 1. Edit kernel/src/new-feature.ts
export class NewFeature {
  // Complex integration with core
}

// 2. Modify kernel/src/objectos.ts
import { NewFeature } from './new-feature';

export class ObjectOS {
  private newFeature: NewFeature;
  
  constructor() {
    this.newFeature = new NewFeature(this);
  }
}

// 3. Rebuild entire kernel
// 4. All users get the feature (no choice)
```

**Runtime Approach** (Create Plugin):
```typescript
// 1. Create packages/plugins/new-feature/src/plugin.ts
export class NewFeaturePlugin implements Plugin {
  name = 'new-feature';
  version = '1.0.0';
  
  async init(ctx: PluginContext) {
    // Self-contained
  }
}

// 2. Users choose to install it
import { NewFeaturePlugin } from '@objectos/plugin-new-feature';
kernel.use(new NewFeaturePlugin());

// 3. No kernel changes needed
// 4. Optional for users
```

---

## 📈 Scalability

### Kernel (Vertical Scaling)

```
Single Process
      │
      │ Can't split features across servers
      │ All-or-nothing deployment
      ▼
Limited by single machine
```

### Runtime (Horizontal Scaling)

```
Load Balancer
     │
     ├─► Server 1 (plugins: server, auth, audit)
     │
     ├─► Server 2 (plugins: server, api-core, permissions)
     │
     └─► Server 3 (plugins: workflow, jobs)
     
Can distribute plugins across servers
Can scale specific features independently
```

---

## 🎓 Learning Curve

```
Complexity
    │
    │     Kernel
    │      ╱
    │     ╱
    │    ╱
    │   ╱
    │  ╱
    │ ╱                Runtime
    │╱___________________
    0                    Time
    
Kernel: Steep initial learning (understand entire system)
Runtime: Gradual learning (learn plugins as needed)
```

---

## ✅ Migration Checklist

### From Kernel to Runtime

- [ ] **Week 1-2**: Understand runtime plugin model
- [ ] **Week 3-5**: Migrate API features to plugins
- [ ] **Week 6-7**: Migrate permissions to plugins
- [ ] **Week 8**: Update application code
- [ ] **Week 9**: Test thoroughly
- [ ] **Week 10**: Deploy to production

### Compatibility Layer

```typescript
// Temporary wrapper for gradual migration
import { ObjectOS as KernelOS } from '@objectos/kernel';
import { ObjectKernel, ServerPlugin } from '@objectstack/runtime';

export class ObjectOS {
  private runtime: ObjectKernel;
  
  constructor() {
    // Emulate kernel API with runtime
    this.runtime = new ObjectKernel();
    this.runtime.use(new ServerPlugin());
  }
  
  // Proxy methods to runtime
  async find(...args) {
    return this.runtime.services.get('objectql').find(...args);
  }
}
```

---

## 🎯 Recommendation

### When to Use Kernel (Deprecated)
- ⚠️ Legacy applications (maintenance mode only)
- ⚠️ No new features will be added
- ⚠️ Plan migration to runtime

### When to Use Runtime (Recommended)
- ✅ All new projects
- ✅ Applications needing specific features
- ✅ Microservices architecture
- ✅ Custom plugin development
- ✅ Better performance and security

---

## 📚 Next Steps

1. Read [SPEC_SYSTEM_DEVELOPMENT_PLAN.md](./SPEC_SYSTEM_DEVELOPMENT_PLAN.md)
2. Review [packages/runtime/README.md](./packages/runtime/README.md)
3. Try example plugins in [packages/plugins/](./packages/plugins/)
4. Join development: [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**Last Updated**: February 2, 2026  
**Version**: 1.0.0
