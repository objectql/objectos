# ObjectOS 架构设计文档 | ObjectOS Architecture Design

> **版本 Version**: 1.0.0  
> **日期 Date**: 2026年2月3日 | February 3, 2026

---

## 目录 | Table of Contents

### 中文部分
1. [系统架构总览](#一系统架构总览)
2. [微内核设计](#二微内核设计)
3. [插件系统架构](#三插件系统架构)
4. [数据流设计](#四数据流设计)
5. [安全架构](#五安全架构)
6. [性能优化策略](#六性能优化策略)

### English Section
1. [System Architecture Overview](#i-system-architecture-overview)
2. [Microkernel Design](#ii-microkernel-design)
3. [Plugin System Architecture](#iii-plugin-system-architecture)
4. [Data Flow Design](#iv-data-flow-design)
5. [Security Architecture](#v-security-architecture)
6. [Performance Optimization](#vi-performance-optimization)

---

## 中文版 | Chinese Version

### 一、系统架构总览

#### 1.1 整体架构图

```
┌────────────────────────────────────────────────────────────────────┐
│                         用户层 User Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  Web Browser  │  │ Mobile App   │  │  API Client  │            │
│  └───────┬──────┘  └───────┬──────┘  └───────┬──────┘            │
└──────────┼─────────────────┼─────────────────┼───────────────────┘
           │                 │                 │
           └─────────────────┴─────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────────┐
│                    API网关层 API Gateway Layer                      │
│                             ▼                                       │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │         @objectos/plugin-server (NestJS)                   │   │
│  │  • REST API (/api/data/:object)                            │   │
│  │  • GraphQL (/graphql)                                      │   │
│  │  • WebSocket (/ws) - 实时同步                               │   │
│  │  • Metadata API (/api/metadata)                            │   │
│  └────────────────────────┬───────────────────────────────────┘   │
└───────────────────────────┼───────────────────────────────────────┘
                            │
┌───────────────────────────┼───────────────────────────────────────┐
│                  业务逻辑层 Business Logic Layer                   │
│                            ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │      @objectstack/runtime (微内核 Microkernel)              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │ │
│  │  │ 插件注册表    │  │   事件总线    │  │  依赖解析器  │      │ │
│  │  │Plugin Registry│  │  Event Bus   │  │ Dep Resolver │      │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                             │                                     │
│  ┌──────────────────────────┴──────────────────────────────────┐ │
│  │                    插件生态 Plugin Ecosystem                 │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │ │
│  │  │ ObjectQL   │  │Better-Auth │  │  Workflow  │            │ │
│  │  │  Plugin    │  │   Plugin   │  │   Plugin   │            │ │
│  │  └────────────┘  └────────────┘  └────────────┘            │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │ │
│  │  │ Audit-Log  │  │   Cache    │  │  Storage   │            │ │
│  │  │  Plugin    │  │   Plugin   │  │   Plugin   │            │ │
│  │  └────────────┘  └────────────┘  └────────────┘            │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │ │
│  │  │Permissions │  │    Jobs    │  │Notification│            │ │
│  │  │  Plugin    │  │   Plugin   │  │   Plugin   │            │ │
│  │  └────────────┘  └────────────┘  └────────────┘            │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬───────────────────────────────────────┘
                            │
┌───────────────────────────┼───────────────────────────────────────┐
│                    数据层 Data Layer                               │
│                            ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │         @objectql/core (数据引擎 Data Engine)                │ │
│  │  • 元数据注册表 (Metadata Registry)                          │ │
│  │  • 查询编译器 (Query Compiler)                               │ │
│  │  • 关系解析器 (Relationship Resolver)                        │ │
│  └────────────────────────┬────────────────────────────────────┘ │
│                            │                                       │
│  ┌────────────────────────┴────────────────────────────────────┐ │
│  │              数据库驱动 Database Drivers                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │ │
│  │  │@objectql/    │  │@objectql/    │  │@objectql/    │      │ │
│  │  │driver-sql    │  │driver-mongo  │  │driver-sqlite │      │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │ │
│  └─────────┼──────────────────┼──────────────────┼─────────────┘ │
└────────────┼──────────────────┼──────────────────┼───────────────┘
             │                  │                  │
        ┌────▼────┐        ┌───▼────┐        ┌────▼────┐
        │PostgreSQL│        │MongoDB │        │ SQLite  │
        └─────────┘        └────────┘        └─────────┘
```

#### 1.2 分层职责

| 层级 | 职责 | 关键技术 |
|-----|------|---------|
| **用户层** | 用户界面展现 | React (ObjectUI), HTML5, Mobile Apps |
| **API网关层** | 请求路由、认证、限流 | NestJS, Express, JWT |
| **业务逻辑层** | 权限控制、工作流、业务规则 | TypeScript, Event-Driven |
| **数据层** | 数据持久化、查询优化 | ObjectQL, SQL/NoSQL Drivers |

---

### 二、微内核设计

#### 2.1 微内核架构原则

**设计理念**: "最小化内核，最大化可扩展性"

```typescript
// 微内核接口定义
interface MicroKernel {
  // 插件生命周期管理
  registerPlugin(plugin: Plugin): Promise<void>;
  enablePlugin(pluginId: string): Promise<void>;
  disablePlugin(pluginId: string): Promise<void>;
  uninstallPlugin(pluginId: string): Promise<void>;
  
  // 服务注册
  registerService(name: string, service: any): void;
  getService<T>(name: string): T;
  
  // 事件总线
  emit(event: string, payload: any): Promise<void>;
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
  
  // 上下文管理
  createContext(): PluginContext;
}
```

#### 2.2 插件生命周期

```
┌─────────────────────────────────────────────────────────┐
│                   插件生命周期 Plugin Lifecycle          │
└─────────────────────────────────────────────────────────┘

     ┌─────────────┐
     │  INSTALLED  │  插件已安装但未启用
     └──────┬──────┘
            │ onEnable()
            ▼
     ┌─────────────┐
     │   ENABLED   │  插件已启用，准备加载
     └──────┬──────┘
            │ onLoad()
            ▼
     ┌─────────────┐
     │   LOADED    │  ✅ 插件正常运行
     └──────┬──────┘
            │ onDisable()
            ▼
     ┌─────────────┐
     │  DISABLED   │  插件已禁用，可重新启用
     └──────┬──────┘
            │ onUninstall()
            ▼
     ┌─────────────┐
     │ UNINSTALLED │  插件已卸载
     └─────────────┘
```

**生命周期钩子详解**:

| 钩子 | 时机 | 用途 | 示例 |
|-----|------|------|------|
| `onInstall` | 首次安装 | 初始化数据库表、创建配置 | 创建审计日志表 |
| `onEnable` | 启用插件 | 启动服务、注册路由 | 注册REST端点 |
| `onLoad` | 加载元数据 | 加载配置、注册钩子 | 注册beforeInsert钩子 |
| `onDisable` | 禁用插件 | 停止服务、清理资源 | 关闭WebSocket连接 |
| `onUninstall` | 卸载插件 | 删除数据、清理配置 | 删除插件数据表 |

#### 2.3 依赖注入容器

```typescript
// 服务注册示例
class ServiceRegistry {
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();
  
  // 注册单例服务
  registerSingleton<T>(name: string, instance: T): void {
    this.services.set(name, instance);
  }
  
  // 注册工厂服务
  registerFactory<T>(name: string, factory: () => T): void {
    this.factories.set(name, factory);
  }
  
  // 获取服务
  resolve<T>(name: string): T {
    // 优先返回单例
    if (this.services.has(name)) {
      return this.services.get(name) as T;
    }
    
    // 使用工厂创建
    if (this.factories.has(name)) {
      const factory = this.factories.get(name)!;
      const instance = factory();
      this.services.set(name, instance);
      return instance as T;
    }
    
    throw new Error(`Service not found: ${name}`);
  }
}
```

---

### 三、插件系统架构

#### 3.1 插件清单结构

```typescript
// PluginManifest 标准结构
interface PluginManifest {
  // 基础信息
  id: string;                    // 唯一标识: 'objectos-crm'
  name: string;                  // 显示名称: 'CRM Plugin'
  version: string;               // 语义化版本: '1.0.0'
  description?: string;          // 描述
  author?: string;               // 作者
  license?: string;              // 许可证
  
  // 依赖声明
  dependencies?: {
    [pluginId: string]: string;  // 'objectos-auth': '^1.0.0'
  };
  
  // 元数据路径
  metadata?: {
    objects?: string[];          // ['./objects/*.yml']
    workflows?: string[];        // ['./workflows/*.yml']
    views?: string[];            // ['./views/*.yml']
  };
  
  // 生命周期钩子
  hooks: {
    onInstall?: (ctx: PluginContext) => Promise<void>;
    onEnable?: (ctx: PluginContext) => Promise<void>;
    onLoad?: (ctx: PluginContext) => Promise<void>;
    onDisable?: (ctx: PluginContext) => Promise<void>;
    onUninstall?: (ctx: PluginContext) => Promise<void>;
  };
  
  // 事件监听
  listeners?: {
    [event: string]: (ctx: PluginContext, payload: any) => Promise<void>;
  };
  
  // 服务导出
  exports?: {
    [serviceName: string]: any;
  };
}
```

#### 3.2 插件上下文

```typescript
// PluginContext 提供给插件的能力
interface PluginContext {
  // 插件信息
  pluginId: string;
  pluginName: string;
  
  // 日志记录
  logger: Logger;
  
  // 服务访问
  services: {
    get<T>(name: string): T;
    register(name: string, service: any): void;
  };
  
  // 事件总线
  events: {
    emit(event: string, payload: any): Promise<void>;
    on(event: string, handler: EventHandler): void;
    off(event: string, handler: EventHandler): void;
  };
  
  // 存储访问 (插件隔离)
  storage: {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    delete(key: string): Promise<void>;
  };
  
  // ObjectQL访问
  objectql: {
    find(object: string, options: FindOptions): Promise<any[]>;
    insert(object: string, data: any): Promise<any>;
    update(object: string, id: string, data: any): Promise<any>;
    delete(object: string, id: string): Promise<void>;
  };
  
  // HTTP路由注册 (仅plugin-server提供)
  http?: {
    registerRoute(path: string, handler: RequestHandler): void;
    registerMiddleware(middleware: Middleware): void;
  };
}
```

#### 3.3 插件示例

```typescript
// plugins/crm/manifest.ts
export const CrmPlugin: PluginManifest = {
  id: 'objectos-crm',
  name: 'CRM Plugin',
  version: '1.0.0',
  
  // 依赖其他插件
  dependencies: {
    'objectos-auth': '^1.0.0',
    'objectos-workflow': '^1.0.0'
  },
  
  // 加载元数据
  metadata: {
    objects: ['./objects/*.yml'],
    workflows: ['./workflows/*.yml']
  },
  
  // 生命周期钩子
  hooks: {
    onLoad: async (ctx) => {
      ctx.logger.info('CRM Plugin loaded');
      
      // 注册业务逻辑钩子
      ctx.events.on('lead.created', async (payload) => {
        // 新线索创建时自动分配给销售
        await autoAssignLead(payload.leadId);
      });
    }
  },
  
  // 导出服务
  exports: {
    leadService: new LeadService(),
    opportunityService: new OpportunityService()
  }
};
```

---

### 四、数据流设计

#### 4.1 请求处理流程

```
┌──────────────────────────────────────────────────────────────┐
│  1. HTTP请求进入                                              │
│     POST /api/data/contacts                                  │
│     Body: { first_name: "张三", company: "ABC公司" }          │
└──────────────────┬───────────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────────┐
│  2. NestJS Controller (plugin-server)                        │
│     • 解析JWT令牌                                             │
│     • 提取用户上下文                                           │
│     • 验证请求参数                                             │
└──────────────────┬───────────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────────┐
│  3. 权限检查 (plugin-permissions)                             │
│     • 检查用户是否有 contacts.create 权限                      │
│     • 检查字段级权限                                           │
│     • ✅ 通过 → 继续                                           │
│     • ❌ 拒绝 → 返回 403 Forbidden                            │
└──────────────────┬───────────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────────┐
│  4. 触发器执行 (beforeInsert)                                 │
│     Event: 'contacts.beforeInsert'                           │
│     • 自动填充 created_by = currentUser.id                   │
│     • 自动填充 created_at = new Date()                       │
│     • 业务验证: company不能为空                               │
└──────────────────┬───────────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────────┐
│  5. ObjectQL层处理                                            │
│     • 加载 contacts 对象元数据                                │
│     • 验证必填字段                                             │
│     • 验证字段类型                                             │
│     • 编译查询 → INSERT语句                                    │
└──────────────────┬───────────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────────┐
│  6. 数据库驱动执行                                             │
│     Driver: PostgresDriver                                   │
│     SQL: INSERT INTO contacts (first_name, company, ...)     │
│          VALUES ('张三', 'ABC公司', ...)                      │
│          RETURNING *;                                        │
└──────────────────┬───────────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────────┐
│  7. 触发器执行 (afterInsert)                                  │
│     Event: 'contacts.afterInsert'                            │
│     • 记录审计日志 (plugin-audit-log)                         │
│     • 发送通知给销售团队 (plugin-notification)                 │
│     • 启动工作流 "新联系人审核" (plugin-workflow)              │
└──────────────────┬───────────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────────┐
│  8. 返回响应                                                   │
│     Status: 201 Created                                      │
│     Body: {                                                  │
│       id: "c1",                                              │
│       first_name: "张三",                                     │
│       company: "ABC公司",                                     │
│       created_at: "2026-02-03T08:42:00Z"                     │
│     }                                                        │
└──────────────────────────────────────────────────────────────┘
```

#### 4.2 事件驱动架构

```typescript
// 事件总线设计
class EventBus {
  private listeners = new Map<string, Set<EventHandler>>();
  
  // 注册监听器
  on(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }
  
  // 触发事件
  async emit(event: string, payload: any): Promise<void> {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    
    // 并行执行所有监听器
    await Promise.all(
      Array.from(handlers).map(handler => handler(payload))
    );
  }
}

// 使用示例
eventBus.on('contacts.afterInsert', async (payload) => {
  // 插件A: 审计日志
  await auditLogPlugin.log({
    action: 'CREATE',
    object: 'contacts',
    recordId: payload.id
  });
});

eventBus.on('contacts.afterInsert', async (payload) => {
  // 插件B: 通知
  await notificationPlugin.send({
    to: 'sales-team@company.com',
    subject: `新联系人: ${payload.first_name}`
  });
});
```

---

### 五、安全架构

#### 5.1 认证架构

```
┌─────────────────────────────────────────────────────────────┐
│              认证流程 Authentication Flow                     │
└─────────────────────────────────────────────────────────────┘

  User                  ObjectOS                  Database
   │                       │                          │
   │  POST /auth/login     │                          │
   ├──────────────────────>│                          │
   │  { email, password }  │                          │
   │                       │  查询用户                 │
   │                       ├─────────────────────────>│
   │                       │                          │
   │                       │<─────────────────────────┤
   │                       │  返回用户信息             │
   │                       │                          │
   │                       │  验证密码 (bcrypt)        │
   │                       │  ✅ 匹配                 │
   │                       │                          │
   │                       │  生成JWT Token           │
   │                       │  {                       │
   │                       │    sub: userId,          │
   │                       │    roles: ['sales'],     │
   │                       │    exp: ...              │
   │                       │  }                       │
   │                       │                          │
   │  200 OK               │                          │
   │<──────────────────────┤                          │
   │  {                    │                          │
   │    token: "eyJ...",   │                          │
   │    refreshToken: "..." │                         │
   │  }                    │                          │
   │                       │                          │
   │  后续请求带Token       │                          │
   │  GET /api/data/leads  │                          │
   │  Authorization: Bearer eyJ...                    │
   ├──────────────────────>│                          │
   │                       │  验证JWT                 │
   │                       │  ✅ 有效                 │
   │                       │                          │
   │                       │  提取用户信息             │
   │                       │  userId, roles           │
   │                       │                          │
   │                       │  处理请求...              │
```

#### 5.2 授权架构

**三层权限模型**:

1. **对象级权限** (Object-Level)
   ```yaml
   # objects/contacts.yml
   permission_set:
     allowRead: true              # 所有人可读
     allowCreate: ['sales', 'admin']  # 销售和管理员可创建
     allowEdit: ['sales', 'admin']
     allowDelete: ['admin']       # 仅管理员可删除
   ```

2. **字段级权限** (Field-Level)
   ```yaml
   fields:
     salary:
       type: currency
       visible_to: ['hr', 'admin']    # 仅HR和管理员可见
       editable_by: ['hr']            # 仅HR可编辑
   ```

3. **记录级安全** (Record-Level Security, RLS)
   ```typescript
   // 动态过滤: 用户只能看到自己创建的记录
   eventBus.on('contacts.beforeFind', async (ctx) => {
     if (!ctx.user.isAdmin) {
       ctx.filters.push({
         owner: ctx.user.id
       });
     }
   });
   ```

#### 5.3 审计日志

```typescript
// 审计日志结构
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;           // 操作人
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  objectName: string;       // 对象名称
  recordId: string;         // 记录ID
  changes?: {               // 字段变更 (仅UPDATE)
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  ip: string;               // IP地址
  userAgent: string;        // 浏览器信息
}
```

---

### 六、性能优化策略

#### 6.1 缓存策略

**多层缓存架构**:

```
┌─────────────────────────────────────────────────────────┐
│               L1: 内存缓存 (LRU)                         │
│  • 元数据缓存 (对象定义、字段定义)                        │
│  • 权限缓存 (用户权限集)                                  │
│  • 查询结果缓存 (5分钟TTL)                                │
│  • 容量: 1000条                                           │
└────────────────────┬────────────────────────────────────┘
                     │ 未命中
                     ▼
┌─────────────────────────────────────────────────────────┐
│               L2: Redis缓存                              │
│  • 分布式缓存 (多节点共享)                                │
│  • 用户会话缓存                                           │
│  • 查询结果缓存 (1小时TTL)                                │
│  • 容量: 10GB                                             │
└────────────────────┬────────────────────────────────────┘
                     │ 未命中
                     ▼
┌─────────────────────────────────────────────────────────┐
│               数据库查询                                  │
│  • 回写L1和L2缓存                                         │
└─────────────────────────────────────────────────────────┘
```

#### 6.2 查询优化

```typescript
// 查询优化策略
class QueryOptimizer {
  // 1. 字段选择优化
  optimizeFields(query: Query): Query {
    // 只查询需要的字段，避免 SELECT *
    if (!query.fields || query.fields.includes('*')) {
      query.fields = this.getRequiredFields(query.objectName);
    }
    return query;
  }
  
  // 2. 关系查询优化
  optimizeRelationships(query: Query): Query {
    // 使用JOIN而不是N+1查询
    if (query.includeRelated) {
      query.joins = this.buildJoins(query.relationships);
    }
    return query;
  }
  
  // 3. 分页优化
  optimizePagination(query: Query): Query {
    // 限制最大返回数量
    query.limit = Math.min(query.limit || 100, 1000);
    return query;
  }
}
```

#### 6.3 连接池管理

```typescript
// PostgreSQL连接池配置
const poolConfig = {
  // 最小连接数
  min: 10,
  
  // 最大连接数
  max: process.env.NODE_ENV === 'production' ? 100 : 20,
  
  // 连接超时 (毫秒)
  acquireTimeoutMillis: 30000,
  
  // 空闲连接超时 (毫秒)
  idleTimeoutMillis: 30000,
  
  // 连接生命周期 (毫秒)
  maxLifetime: 3600000
};
```

---

## English Version

### I. System Architecture Overview

#### 1.1 Overall Architecture Diagram

*(Same diagram as Chinese version)*

#### 1.2 Layer Responsibilities

| Layer | Responsibilities | Key Technologies |
|-------|-----------------|------------------|
| **User Layer** | UI presentation | React (ObjectUI), HTML5, Mobile Apps |
| **API Gateway Layer** | Request routing, authentication, rate limiting | NestJS, Express, JWT |
| **Business Logic Layer** | Permission control, workflows, business rules | TypeScript, Event-Driven |
| **Data Layer** | Data persistence, query optimization | ObjectQL, SQL/NoSQL Drivers |

---

### II. Microkernel Design

#### 2.1 Microkernel Architecture Principles

**Design Philosophy**: "Minimize the kernel, maximize extensibility"

*(Implementation details same as Chinese version)*

#### 2.2 Plugin Lifecycle

*(Lifecycle diagram and table same as Chinese version)*

---

### III. Plugin System Architecture

#### 3.1 Plugin Manifest Structure

*(Code examples same as Chinese version with English comments)*

#### 3.2 Plugin Context

*(Interface definitions same as Chinese version with English comments)*

---

### IV. Data Flow Design

#### 4.1 Request Processing Flow

*(Flow diagram same as Chinese version with English labels)*

#### 4.2 Event-Driven Architecture

*(Event bus implementation same as Chinese version)*

---

### V. Security Architecture

#### 5.1 Authentication Architecture

*(Authentication flow diagram same as Chinese version)*

#### 5.2 Authorization Architecture

**Three-Layer Permission Model**:

1. **Object-Level Permissions**
2. **Field-Level Permissions**
3. **Record-Level Security (RLS)**

*(Implementation details same as Chinese version)*

---

### VI. Performance Optimization

#### 6.1 Caching Strategy

**Multi-Layer Cache Architecture**:

- **L1: Memory Cache (LRU)**
- **L2: Redis Cache**
- **Database Query** (with write-back)

*(Implementation details same as Chinese version)*

---

## 附录 | Appendix

### 技术栈总览 | Technology Stack

| 类别 Category | 技术 Technology | 用途 Purpose |
|--------------|----------------|-------------|
| **运行时 Runtime** | Node.js 18+ | JavaScript运行环境 |
| **语言 Language** | TypeScript 5.0+ | 类型安全 Type Safety |
| **框架 Framework** | NestJS | HTTP服务器框架 |
| **数据库 Database** | PostgreSQL, MongoDB, SQLite | 数据持久化 |
| **缓存 Cache** | Redis | 分布式缓存 |
| **队列 Queue** | Bull/BullMQ | 后台任务 |
| **测试 Testing** | Jest, Playwright | 单元测试、E2E测试 |
| **监控 Monitoring** | Prometheus, OpenTelemetry | 指标收集、分布式追踪 |

---

<div align="center">
<sub>ObjectOS - Building the Future of Enterprise Software</sub>
</div>
