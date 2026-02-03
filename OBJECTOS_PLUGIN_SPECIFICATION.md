# ObjectOS 插件系统规范 | ObjectOS Plugin System Specification

> **版本 Version**: 1.0.0  
> **日期 Date**: 2026年2月3日 | February 3, 2026  
> **状态 Status**: 规范文档 | Specification Document

---

## 目录 | Table of Contents

### 中文部分
1. [插件系统概述](#一插件系统概述)
2. [插件开发指南](#二插件开发指南)
3. [标准插件清单](#三标准插件清单)
4. [插件最佳实践](#四插件最佳实践)

### English Section
1. [Plugin System Overview](#i-plugin-system-overview)
2. [Plugin Development Guide](#ii-plugin-development-guide)
3. [Standard Plugins Catalog](#iii-standard-plugins-catalog)
4. [Plugin Best Practices](#iv-plugin-best-practices)

---

## 中文版 | Chinese Version

### 一、插件系统概述

#### 1.1 设计原则

ObjectOS 插件系统遵循以下核心原则：

1. **一切皆插件** (Everything is a Plugin)
   - 连HTTP服务器都是插件 (`plugin-server`)
   - 认证系统是插件 (`plugin-better-auth`)
   - 审计日志是插件 (`plugin-audit-log`)
   - 甚至ObjectQL集成也是插件 (`plugin-objectql`)

2. **松耦合** (Loose Coupling)
   - 插件之间通过**事件总线**通信
   - 不允许直接 `import` 其他插件
   - 通过服务注册表共享功能

3. **高内聚** (High Cohesion)
   - 每个插件只负责一个明确的功能域
   - 插件内部高度封装

4. **可测试** (Testable)
   - 插件可以独立测试
   - 支持Mock依赖

5. **热插拔** (Hot-swappable)
   - 开发模式支持热重载
   - 生产环境可选

#### 1.2 插件分类

| 类型 | 描述 | 示例 |
|-----|------|------|
| **核心插件** | ObjectOS必需的基础功能 | plugin-server, plugin-objectql |
| **系统插件** | 企业级功能增强 | plugin-better-auth, plugin-audit-log |
| **业务插件** | 特定业务领域 | plugin-crm, plugin-hrm |
| **集成插件** | 第三方服务集成 | plugin-salesforce, plugin-slack |

---

### 二、插件开发指南

#### 2.1 创建新插件

**步骤1: 使用脚手架工具**

```bash
# 使用CLI创建插件骨架
$ objectos plugin:create my-plugin

✔ Plugin name: My Plugin
✔ Plugin ID: objectos-my-plugin
✔ Author: Your Name
✔ License: MIT

✨ Created plugin at packages/plugins/my-plugin/
```

**步骤2: 目录结构**

```
packages/plugins/my-plugin/
├── src/
│   ├── index.ts              # 插件入口
│   ├── manifest.ts           # 插件清单
│   ├── services/             # 业务服务
│   │   └── MyService.ts
│   ├── handlers/             # 事件处理器
│   │   └── MyHandler.ts
│   └── types.ts              # 类型定义
├── tests/
│   └── index.test.ts         # 单元测试
├── package.json
├── tsconfig.json
└── README.md
```

**步骤3: 编写插件清单**

```typescript
// src/manifest.ts
import type { PluginManifest } from '@objectstack/spec';

export const manifest: PluginManifest = {
  // 基础信息
  id: 'objectos-my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  description: 'A sample plugin for ObjectOS',
  author: 'Your Name',
  license: 'MIT',
  
  // 依赖声明
  dependencies: {
    'objectos-auth': '^1.0.0',      // 依赖认证插件
  },
  
  // 生命周期钩子
  hooks: {
    // 插件首次安装
    onInstall: async (ctx) => {
      ctx.logger.info('Installing My Plugin...');
      
      // 创建数据库表
      await ctx.objectql.execute(`
        CREATE TABLE IF NOT EXISTS my_plugin_data (
          id SERIAL PRIMARY KEY,
          data JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      ctx.logger.info('My Plugin installed successfully');
    },
    
    // 插件启用
    onEnable: async (ctx) => {
      ctx.logger.info('Enabling My Plugin...');
      
      // 注册服务
      const myService = new MyService(ctx);
      ctx.services.register('myService', myService);
      
      // 启动后台任务
      await myService.start();
    },
    
    // 插件加载
    onLoad: async (ctx) => {
      ctx.logger.info('Loading My Plugin...');
      
      // 注册事件监听器
      ctx.events.on('user.created', async (payload) => {
        ctx.logger.info(`New user created: ${payload.userId}`);
        // 执行自定义逻辑
        await handleNewUser(payload);
      });
      
      // 注册HTTP路由 (如果plugin-server可用)
      if (ctx.http) {
        ctx.http.registerRoute('/api/my-plugin/status', async (req, res) => {
          res.json({ status: 'ok' });
        });
      }
    },
    
    // 插件禁用
    onDisable: async (ctx) => {
      ctx.logger.info('Disabling My Plugin...');
      
      // 停止后台任务
      const myService = ctx.services.get('myService');
      await myService.stop();
    },
    
    // 插件卸载
    onUninstall: async (ctx) => {
      ctx.logger.info('Uninstalling My Plugin...');
      
      // 删除数据库表
      await ctx.objectql.execute(`
        DROP TABLE IF EXISTS my_plugin_data
      `);
      
      ctx.logger.info('My Plugin uninstalled');
    }
  },
  
  // 导出服务 (供其他插件使用)
  exports: {
    myService: () => new MyService()
  }
};
```

**步骤4: 实现业务逻辑**

```typescript
// src/services/MyService.ts
import type { PluginContext } from '@objectstack/spec';

export class MyService {
  private ctx: PluginContext;
  private timer?: NodeJS.Timer;
  
  constructor(ctx: PluginContext) {
    this.ctx = ctx;
  }
  
  async start(): Promise<void> {
    // 启动定时任务 (每小时执行)
    this.timer = setInterval(async () => {
      await this.doPeriodicTask();
    }, 3600000);
    
    this.ctx.logger.info('MyService started');
  }
  
  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.ctx.logger.info('MyService stopped');
  }
  
  private async doPeriodicTask(): Promise<void> {
    // 定时任务逻辑
    this.ctx.logger.debug('Executing periodic task...');
  }
  
  async processData(data: any): Promise<any> {
    // 业务逻辑
    return { processed: true, data };
  }
}
```

**步骤5: 编写测试**

```typescript
// tests/index.test.ts
import { manifest } from '../src/manifest';
import { MyService } from '../src/services/MyService';

describe('MyPlugin', () => {
  it('should have valid manifest', () => {
    expect(manifest.id).toBe('objectos-my-plugin');
    expect(manifest.version).toBeTruthy();
  });
  
  it('should process data correctly', async () => {
    const ctx = createMockContext();
    const service = new MyService(ctx);
    
    const result = await service.processData({ test: 'data' });
    expect(result.processed).toBe(true);
  });
});
```

#### 2.2 插件配置

插件可以通过以下方式获取配置：

```typescript
// 方式1: 环境变量
const apiKey = process.env.MY_PLUGIN_API_KEY;

// 方式2: 配置文件
const config = await ctx.storage.get('config');

// 方式3: ObjectQL查询
const settings = await ctx.objectql.findOne('plugin_settings', {
  filters: { plugin_id: ctx.pluginId }
});
```

#### 2.3 插件间通信

**通过事件总线**:

```typescript
// 插件A: 发送事件
ctx.events.emit('order.created', {
  orderId: 'O123',
  total: 999.99
});

// 插件B: 监听事件
ctx.events.on('order.created', async (payload) => {
  // 发送订单确认邮件
  await sendEmail({
    to: payload.customerEmail,
    subject: `订单确认 #${payload.orderId}`
  });
});
```

**通过服务注册表**:

```typescript
// 插件A: 注册服务
ctx.services.register('paymentService', new PaymentService());

// 插件B: 调用服务
const paymentService = ctx.services.get('paymentService');
await paymentService.processPayment({ amount: 100 });
```

---

### 三、标准插件清单

#### 3.1 核心插件

##### plugin-objectql

**功能**: ObjectQL数据层集成

```typescript
{
  id: 'objectos-objectql',
  name: 'ObjectQL Plugin',
  
  exports: {
    // 提供ObjectQL实例
    objectql: ObjectQLInstance
  },
  
  hooks: {
    onLoad: async (ctx) => {
      // 加载所有元数据
      await objectql.loadMetadata('./objects/**/*.yml');
      
      // 提供数据访问接口
      ctx.objectql = {
        find: (object, options) => objectql.find(object, options),
        insert: (object, data) => objectql.insert(object, data),
        update: (object, id, data) => objectql.update(object, id, data),
        delete: (object, id) => objectql.delete(object, id)
      };
    }
  }
}
```

##### plugin-server

**功能**: HTTP服务器 (NestJS)

```typescript
{
  id: 'objectos-server',
  name: 'Server Plugin',
  
  dependencies: {
    'objectos-objectql': '^1.0.0'
  },
  
  hooks: {
    onEnable: async (ctx) => {
      // 启动NestJS应用
      const app = await NestFactory.create(AppModule);
      
      // 注册路由
      app.post('/api/data/:object/query', queryHandler);
      app.post('/api/data/:object', createHandler);
      app.patch('/api/data/:object/:id', updateHandler);
      app.delete('/api/data/:object/:id', deleteHandler);
      
      // 监听端口
      await app.listen(process.env.PORT || 3000);
      
      // 提供HTTP能力给其他插件
      ctx.http = {
        registerRoute: (path, handler) => app.use(path, handler),
        registerMiddleware: (middleware) => app.use(middleware)
      };
    }
  }
}
```

#### 3.2 系统插件

##### plugin-better-auth

**功能**: 身份认证 (Better-Auth)

```typescript
{
  id: 'objectos-better-auth',
  name: 'Better-Auth Plugin',
  
  hooks: {
    onLoad: async (ctx) => {
      // 初始化Better-Auth
      const auth = await betterAuth({
        database: ctx.objectql.db,
        emailAndPassword: {
          enabled: true
        },
        socialProviders: {
          google: { ... },
          github: { ... }
        }
      });
      
      // 注册认证中间件
      if (ctx.http) {
        ctx.http.registerMiddleware(auth.middleware());
      }
      
      // 导出认证服务
      ctx.services.register('auth', auth);
    }
  }
}
```

##### plugin-audit-log

**功能**: 审计日志

```typescript
{
  id: 'objectos-audit-log',
  name: 'Audit Log Plugin',
  
  hooks: {
    onLoad: async (ctx) => {
      // 监听所有数据变更
      const events = [
        'beforeInsert', 'afterInsert',
        'beforeUpdate', 'afterUpdate',
        'beforeDelete', 'afterDelete'
      ];
      
      events.forEach(event => {
        ctx.events.on(event, async (payload) => {
          // 记录审计日志
          await ctx.objectql.insert('_audit_log', {
            user_id: payload.userId,
            action: event.replace('before', '').replace('after', ''),
            object_name: payload.objectName,
            record_id: payload.recordId,
            changes: payload.changes,
            ip_address: payload.ip,
            user_agent: payload.userAgent,
            timestamp: new Date()
          });
        });
      });
    }
  }
}
```

##### plugin-workflow

**功能**: 工作流引擎

```typescript
{
  id: 'objectos-workflow',
  name: 'Workflow Plugin',
  
  metadata: {
    workflows: ['./workflows/*.workflow.yml']
  },
  
  hooks: {
    onLoad: async (ctx) => {
      // 加载工作流定义
      const workflows = await loadWorkflows();
      
      // 注册工作流引擎
      const engine = new WorkflowEngine(workflows);
      ctx.services.register('workflow', engine);
      
      // 监听触发事件
      ctx.events.on('workflow.trigger', async (payload) => {
        await engine.execute(payload.workflowId, payload.context);
      });
    }
  }
}
```

##### plugin-permissions

**功能**: 权限引擎

```typescript
{
  id: 'objectos-permissions',
  name: 'Permissions Plugin',
  
  hooks: {
    onLoad: async (ctx) => {
      // 在所有查询前检查权限
      ctx.events.on('beforeFind', async (payload) => {
        const canRead = await checkPermission(
          payload.userId,
          payload.objectName,
          'read'
        );
        
        if (!canRead) {
          throw new ForbiddenError('No permission to read');
        }
      });
      
      // 字段级权限过滤
      ctx.events.on('afterFind', async (payload) => {
        const visibleFields = await getVisibleFields(
          payload.userId,
          payload.objectName
        );
        
        payload.records.forEach(record => {
          Object.keys(record).forEach(field => {
            if (!visibleFields.includes(field)) {
              delete record[field];
            }
          });
        });
      });
    }
  }
}
```

#### 3.3 扩展插件

##### plugin-notification

**功能**: 多渠道通知

```typescript
{
  id: 'objectos-notification',
  name: 'Notification Plugin',
  
  hooks: {
    onEnable: async (ctx) => {
      const notificationService = new NotificationService({
        email: {
          provider: 'smtp',
          config: { ... }
        },
        sms: {
          provider: 'twilio',
          config: { ... }
        },
        push: {
          provider: 'firebase',
          config: { ... }
        }
      });
      
      ctx.services.register('notification', notificationService);
    },
    
    onLoad: async (ctx) => {
      // 监听通知事件
      ctx.events.on('notification.send', async (payload) => {
        const service = ctx.services.get('notification');
        await service.send(payload.channel, payload.message);
      });
    }
  }
}
```

##### plugin-storage

**功能**: 插件隔离KV存储

```typescript
{
  id: 'objectos-storage',
  name: 'Storage Plugin',
  
  hooks: {
    onEnable: async (ctx) => {
      // 支持多种后端
      const backend = process.env.STORAGE_BACKEND || 'memory';
      
      const storage = createStorage(backend, {
        memory: { maxSize: 1000 },
        sqlite: { path: './storage.db' },
        redis: { url: process.env.REDIS_URL }
      });
      
      // 为每个插件提供隔离存储
      ctx.storage = {
        get: (key) => storage.get(`${ctx.pluginId}:${key}`),
        set: (key, value) => storage.set(`${ctx.pluginId}:${key}`, value),
        delete: (key) => storage.delete(`${ctx.pluginId}:${key}`)
      };
    }
  }
}
```

##### plugin-jobs

**功能**: 后台任务队列

```typescript
{
  id: 'objectos-jobs',
  name: 'Jobs Plugin',
  
  dependencies: {
    'objectos-storage': '^1.0.0'  // 需要Redis
  },
  
  hooks: {
    onEnable: async (ctx) => {
      // 初始化Bull队列
      const queue = new Queue('objectos-jobs', {
        connection: ctx.storage.getRedisClient()
      });
      
      // 注册任务处理器
      queue.process(async (job) => {
        const { type, payload } = job.data;
        
        // 触发事件让其他插件处理
        await ctx.events.emit(`job.${type}`, payload);
      });
      
      // 导出队列服务
      ctx.services.register('jobs', queue);
    }
  }
}
```

##### plugin-cache

**功能**: 缓存抽象层

```typescript
{
  id: 'objectos-cache',
  name: 'Cache Plugin',
  
  hooks: {
    onEnable: async (ctx) => {
      // L1: 内存缓存 (LRU)
      const memoryCache = new LRUCache({ max: 1000 });
      
      // L2: Redis缓存
      const redisCache = new RedisCache({
        url: process.env.REDIS_URL
      });
      
      // 多层缓存策略
      const cache = {
        get: async (key) => {
          // 先查L1
          let value = memoryCache.get(key);
          if (value) return value;
          
          // 再查L2
          value = await redisCache.get(key);
          if (value) {
            memoryCache.set(key, value);
            return value;
          }
          
          return null;
        },
        
        set: async (key, value, ttl) => {
          memoryCache.set(key, value);
          await redisCache.set(key, value, ttl);
        }
      };
      
      ctx.services.register('cache', cache);
    }
  }
}
```

---

### 四、插件最佳实践

#### 4.1 版本管理

**遵循语义化版本 (Semantic Versioning)**:

- **主版本 (MAJOR)**: 不兼容的API变更
- **次版本 (MINOR)**: 向后兼容的功能新增
- **修订版本 (PATCH)**: 向后兼容的问题修复

```json
{
  "version": "1.2.3",
  "dependencies": {
    "objectos-auth": "^1.0.0",    // 接受 1.x.x
    "objectos-workflow": "~2.1.0"  // 接受 2.1.x
  }
}
```

#### 4.2 错误处理

**统一错误类型**:

```typescript
// 自定义错误类
class PluginError extends Error {
  constructor(
    public pluginId: string,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'PluginError';
  }
}

// 使用示例
throw new PluginError(
  'objectos-my-plugin',
  'INVALID_CONFIG',
  'Missing required configuration: API_KEY'
);
```

**优雅降级**:

```typescript
hooks: {
  onEnable: async (ctx) => {
    try {
      await initializeExternalService();
    } catch (error) {
      ctx.logger.warn('External service unavailable, using fallback');
      await initializeFallback();
    }
  }
}
```

#### 4.3 性能优化

**延迟加载**:

```typescript
// ❌ 不好: 立即加载所有依赖
import { HeavyLibrary } from 'heavy-library';

// ✅ 好: 按需加载
async function processData() {
  const { HeavyLibrary } = await import('heavy-library');
  // ...
}
```

**批量处理**:

```typescript
// ❌ 不好: 逐条处理
for (const item of items) {
  await processItem(item);  // N次数据库查询
}

// ✅ 好: 批量处理
await processBatch(items);  // 1次数据库查询
```

#### 4.4 安全实践

**输入验证**:

```typescript
import { z } from 'zod';

// 定义数据模式
const UserInputSchema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(150)
});

// 验证输入
function handleInput(data: unknown) {
  const validated = UserInputSchema.parse(data);  // 抛出错误如果无效
  // 使用 validated
}
```

**敏感数据保护**:

```typescript
// ❌ 不好: 明文存储
await ctx.storage.set('api_key', 'secret123');

// ✅ 好: 加密存储
const encrypted = await encrypt('secret123', process.env.MASTER_KEY);
await ctx.storage.set('api_key', encrypted);
```

#### 4.5 文档规范

每个插件必须包含:

1. **README.md**
   ```markdown
   # My Plugin
   
   ## 功能
   - 功能1
   - 功能2
   
   ## 安装
   ```bash
   pnpm add @objectos/plugin-my-plugin
   ```
   
   ## 配置
   ```typescript
   {
     MY_PLUGIN_API_KEY: 'your-key'
   }
   ```
   
   ## API
   ### MyService
   #### processData(data)
   处理数据
   ```

2. **CHANGELOG.md**
   ```markdown
   # Changelog
   
   ## [1.0.1] - 2026-02-03
   ### Fixed
   - 修复配置加载错误
   
   ## [1.0.0] - 2026-02-01
   ### Added
   - 初始版本
   ```

---

## English Version

### I. Plugin System Overview

#### 1.1 Design Principles

ObjectOS plugin system follows these core principles:

1. **Everything is a Plugin**
2. **Loose Coupling**
3. **High Cohesion**
4. **Testable**
5. **Hot-swappable**

*(Details same as Chinese version)*

---

### II. Plugin Development Guide

#### 2.1 Creating a New Plugin

**Step 1: Use Scaffolding Tool**

```bash
$ objectos plugin:create my-plugin
```

*(Implementation steps same as Chinese version with English comments)*

---

### III. Standard Plugins Catalog

#### 3.1 Core Plugins

- **plugin-objectql**: ObjectQL data layer integration
- **plugin-server**: HTTP server (NestJS)

#### 3.2 System Plugins

- **plugin-better-auth**: Authentication (Better-Auth)
- **plugin-audit-log**: Audit logging
- **plugin-workflow**: Workflow engine
- **plugin-permissions**: Permission engine

#### 3.3 Extension Plugins

- **plugin-notification**: Multi-channel notifications
- **plugin-storage**: Plugin-isolated KV storage
- **plugin-jobs**: Background job queue
- **plugin-cache**: Cache abstraction layer

*(Implementation details same as Chinese version)*

---

### IV. Plugin Best Practices

#### 4.1 Version Management

Follow Semantic Versioning (SemVer)

#### 4.2 Error Handling

Unified error types and graceful degradation

#### 4.3 Performance Optimization

Lazy loading and batch processing

#### 4.4 Security Practices

Input validation and sensitive data protection

#### 4.5 Documentation Standards

Every plugin must include README.md and CHANGELOG.md

---

## 附录 | Appendix

### 插件开发检查清单 | Plugin Development Checklist

- [ ] 插件清单完整 (id, name, version, dependencies)
- [ ] 实现所有必需的生命周期钩子
- [ ] 编写单元测试 (覆盖率 > 80%)
- [ ] 编写README文档
- [ ] 编写CHANGELOG
- [ ] 验证语义化版本号
- [ ] 检查安全性 (输入验证、加密)
- [ ] 性能测试 (无内存泄漏)
- [ ] 与现有插件兼容性测试

---

<div align="center">
<sub>Build Amazing Plugins for ObjectOS</sub>
</div>
