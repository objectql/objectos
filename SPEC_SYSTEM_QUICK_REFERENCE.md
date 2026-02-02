# ObjectOS Spec System - Quick Reference
# 快速参考指南

> **Quick access to key information from the complete development plan**

---

## 🎯 What is ObjectOS? | ObjectOS 是什么？

ObjectOS is the **Business Operating System** for the ObjectStack ecosystem:

- **ObjectQL** = Data Layer (What data looks like)
- **ObjectOS** = System Layer (How business runs)
- **ObjectUI** = View Layer (How users interact)

---

## 📦 Package Overview | 包概览

### Current Status | 当前状态

```
✅ Active Packages (Use These)
├── @objectstack/runtime        - Microkernel (7 files, lightweight)
├── @objectos/plugin-server     - HTTP server plugin
├── @objectos/plugin-audit-log  - Audit logging
├── @objectos/plugin-better-auth - Authentication
└── @objectos/preset-base       - Base data models

⚠️ Deprecated (Do Not Use for New Features)
├── @objectos/kernel            - Old monolithic kernel (37 files)
└── @objectos/server            - Old NestJS wrapper
```

### What Exists vs What's Missing | 现有 vs 缺失

| Feature | Runtime | Kernel | Status |
|---------|---------|--------|--------|
| Plugin Lifecycle | ✅ Basic | ✅ Full | Need to enhance runtime |
| API Protocol | ❌ | ✅ Full | Need as plugin |
| Permissions | ❌ | ✅ Full | Need as plugin |
| Workflow | ❌ | ❌ | Need new plugin |
| Sync Protocol | ❌ | ❌ | Need new plugin |
| Metrics | ❌ | ✅ | Need as plugin |

---

## 🚀 Implementation Plan (16 Weeks) | 实施计划

### Phase 1-2 (Weeks 1-5): Foundation + API
**Goal**: Runtime enhancement + Complete API protocol as plugins

**New Packages**:
- `@objectos/plugin-storage` - Scoped KV storage
- `@objectos/plugin-metrics` - Monitoring
- `@objectos/plugin-api-core` - Router + middleware
- `@objectos/plugin-api-discovery` - OpenAPI + discovery
- `@objectos/plugin-api-endpoints` - Declarative endpoints

### Phase 3-4 (Weeks 6-10): System + Workflow
**Goal**: Permissions + Jobs + Workflow automation

**New Packages**:
- `@objectos/plugin-permissions` - RBAC + RLS
- `@objectos/plugin-jobs` - Background jobs
- `@objectos/plugin-workflow` - State machines
- `@objectos/plugin-automation` - Triggers + actions

### Phase 5-6 (Weeks 11-16): Sync + Testing
**Goal**: Local-first sync + Production readiness

**New Packages**:
- `@objectos/plugin-sync` - Differential sync + WebSocket

---

## 🏗️ Architecture Principles | 架构原则

### The Microkernel Pattern | 微内核模式

```
@objectstack/runtime (Core)
    ↓ (loads)
Plugins (Features)
    ↓ (use)
@objectql/core (Data)
    ↓ (use)
Database Drivers
```

**Rule**: Everything is a plugin except the kernel core.

### Plugin Interface | 插件接口

```typescript
interface Plugin {
  name: string;
  version: string;
  init(context: PluginContext): Promise<void>;
  start(): Promise<void>;
  destroy(): Promise<void>;
}
```

### Plugin Context Capabilities | 插件上下文能力

```typescript
interface PluginContext {
  services: ServiceRegistry;  // DI container
  logger: Logger;            // Structured logging
  on(event, handler);        // Event hooks
  trigger(event, data);      // Event emitter
}
```

---

## 📊 Spec Protocol Compliance | 规范协议合规

### Must Implement from @objectstack/spec

1. **System Protocol** ✅
   - Plugin lifecycle hooks
   - Event bus
   - Metrics

2. **API Protocol** 🚧
   - Endpoint contracts
   - Router + middleware
   - OpenAPI generation

3. **Kernel Protocol** ✅
   - Plugin manifest
   - Service registry
   - Dependency resolution

4. **Data Protocol** ✅ (via ObjectQL)
   - ServiceObject
   - QueryAST
   - CRUD operations

5. **UI Protocol** 🚧
   - App configuration
   - Metadata API (for ObjectUI)

---

## 🔐 Security Requirements | 安全要求

### Authentication (via Better-Auth)
- ✅ JWT tokens
- ✅ OAuth 2.0
- ✅ Session management

### Authorization (Need Plugin)
- 🚧 Object-level RBAC
- 🚧 Field-level security
- 🚧 Record-level security (RLS)

### Audit (Existing Plugin)
- ✅ CRUD operation tracking
- ✅ Field change history
- ✅ User context capture

---

## 🧪 Testing Standards | 测试标准

### Coverage Targets
- **Runtime**: 95%+
- **Plugins**: 90%+
- **Integration**: 85%+

### Test Types
```typescript
// Unit Test
describe('PluginManager', () => {
  it('should load plugins in dependency order', async () => {
    // ...
  });
});

// Integration Test
describe('API Endpoint', () => {
  it('should enforce permissions', async () => {
    const response = await request(app)
      .get('/api/data/contacts')
      .expect(403);
  });
});
```

---

## 🔄 Migration from Kernel | 从内核迁移

### For Applications Using @objectos/kernel

**Step 1**: Switch to runtime
```typescript
// OLD
import { ObjectOS } from '@objectos/kernel';

// NEW
import { ObjectKernel } from '@objectstack/runtime';
import ServerPlugin from '@objectos/plugin-server';
```

**Step 2**: Convert features to plugins
```typescript
// OLD: Built-in API
kernel.router.get('/api/test', handler);

// NEW: Plugin-based API
const apiPlugin = new ApiCorePlugin();
kernel.use(apiPlugin);
```

**Step 3**: Update configuration
```yaml
# OLD: objectos.config.ts
# NEW: objectstack.config.ts with plugin list
```

---

## 📂 File Structure | 文件结构

### Recommended Plugin Structure
```
packages/plugins/my-plugin/
├── package.json
├── src/
│   ├── plugin.ts           # Main plugin class
│   ├── types.ts            # Type definitions
│   ├── services/           # Business logic
│   │   └── my-service.ts
│   └── index.ts            # Exports
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── README.md
```

---

## 🛠️ Development Commands | 开发命令

### Common Tasks
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run specific plugin tests
pnpm --filter @objectos/plugin-server test

# Start development server
pnpm dev

# Run server plugin
pnpm server
```

---

## 📚 Key Files to Read | 关键文件

1. **[SPEC_SYSTEM_DEVELOPMENT_PLAN.md](./SPEC_SYSTEM_DEVELOPMENT_PLAN.md)** - Complete plan (this summary)
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
3. **[API_PROTOCOL_IMPLEMENTATION_PLAN.md](./API_PROTOCOL_IMPLEMENTATION_PLAN.md)** - API details
4. **[ROADMAP.md](./ROADMAP.md)** - Long-term vision
5. **[packages/runtime/README.md](./packages/runtime/README.md)** - Runtime guide

---

## ⚡ Quick Start | 快速开始

### Creating a New Plugin

```typescript
// 1. Create plugin class
import { Plugin, PluginContext } from '@objectstack/runtime';

export class MyPlugin implements Plugin {
  name = 'my-plugin';
  version = '1.0.0';
  
  async init(ctx: PluginContext) {
    ctx.logger.info('Initializing my plugin');
    
    // Register a service
    ctx.services.register('myService', {
      doSomething: () => 'Hello from my plugin'
    });
    
    // Hook into events
    ctx.on('beforeInsert', async (data) => {
      console.log('Data about to be inserted:', data);
    });
  }
  
  async start() {
    console.log('Plugin started');
  }
  
  async destroy() {
    console.log('Plugin destroyed');
  }
}

// 2. Use in application
import { ObjectKernel } from '@objectstack/runtime';
import { MyPlugin } from './plugins/my-plugin';

const kernel = new ObjectKernel();
await kernel.use(new MyPlugin());
await kernel.start();
```

---

## 🎯 Success Criteria | 成功标准

### Technical
- [ ] 90%+ test coverage across all packages
- [ ] <100ms API response time (p95)
- [ ] Support 10k+ concurrent WebSocket connections
- [ ] Pass OWASP Top 10 security audit

### Adoption
- [ ] 10+ community plugins
- [ ] 100+ production deployments
- [ ] 20+ active contributors
- [ ] 10k+ monthly NPM downloads

---

## 🔗 Related Projects | 相关项目

- **[@objectstack/spec](https://github.com/objectstack-ai/spec)** - Protocol definition
- **[ObjectQL](https://github.com/objectql/objectql)** - Data layer
- **[ObjectUI](https://github.com/objectql/objectui)** - View layer (upcoming)

---

## 📞 Getting Help | 获取帮助

- **Documentation**: [docs/](./docs/)
- **GitHub Issues**: [Report a bug](https://github.com/objectstack-ai/objectos/issues)
- **Discussions**: [Ask questions](https://github.com/objectstack-ai/objectos/discussions)

---

## 🗺️ Where Are We Now? | 当前进度

**Current Version**: v0.1.0  
**Target Version**: v1.0.0 (May 2026)

**Completed**:
- ✅ Microkernel architecture (@objectstack/runtime)
- ✅ Basic plugin system
- ✅ Server plugin
- ✅ Authentication plugin
- ✅ Audit plugin

**In Progress**:
- 🚧 Complete development plan (this document)

**Next Up**:
- 🎯 Runtime enhancements (manifest, dependency resolution)
- 🎯 API protocol plugins
- 🎯 Permission system plugin

---

**For detailed information, see [SPEC_SYSTEM_DEVELOPMENT_PLAN.md](./SPEC_SYSTEM_DEVELOPMENT_PLAN.md)**
