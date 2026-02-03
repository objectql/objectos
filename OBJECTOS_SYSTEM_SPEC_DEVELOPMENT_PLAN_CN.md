# ObjectOS 系统规范开发计划

> **文档版本**: 1.0.0  
> **日期**: 2026年2月3日  
> **状态**: 待实施  
> **基于规范**: @objectstack/spec v0.9.0

---

## 📋 执行摘要

本文档提供 ObjectOS 开源项目基于 **@objectstack/spec Zod 协议**（System 相关要求）的完整现状分析与开发规划。ObjectOS 作为 ObjectStack 生态系统的"业务操作系统"，与 ObjectQL（数据层）和 ObjectUI（视图层）协同工作，负责**状态管理、身份认证、同步协调和业务流程编排**。

---

## 🎯 项目目标

### 核心目标

1. **100% 规范合规性**
   - 实现 @objectstack/spec System Protocol 的所有要求
   - 与 Data、Kernel、UI 和 API 协议对齐
   - 确保与 ObjectQL 和 ObjectUI 的互操作性

2. **微内核架构迁移**
   - 从单体内核完全迁移到 @objectstack/runtime
   - 将特性转换为基于插件的架构
   - 在过渡期间保持向后兼容性

3. **生产就绪**
   - 90%+ 测试覆盖率
   - 完整的文档
   - 性能基准测试
   - 安全加固

---

## 📦 当前包结构与状态分析

### 1. 核心运行时包

| 包名 | 版本 | 用途 | 依赖关系 | 状态 |
|------|------|------|----------|------|
| **@objectstack/runtime** | 0.1.0 | 微内核插件系统（生命周期、服务注册、事件总线） | @objectql/core, @objectstack/spec | ✅ 活跃开发 |
| **@objectos/kernel** | 0.2.0 | 旧版内核（元数据加载、对象注册、查询调度） | 大量依赖 | ⚠️ 已废弃 |
| **@objectos/server** | 0.2.0 | 旧版 NestJS 独立服务器 | NestJS | ⚠️ 已废弃 |

**Runtime 实现状态**（基于 @objectstack/spec 0.9.0）:

#### ✅ 已实现的 System Protocol 特性
- **ObjectKernel** - 插件生命周期管理器（状态跟踪）
- **PluginContext** - 服务注册表（DI 容器）+ 事件总线
- **Plugin Interface** - 标准生命周期钩子（init、start、destroy）
- **Service Registry** - 中心化 DI，命名服务
- **Event System** - 基于钩子的插件间通信
- **Dependency Resolver** - 拓扑排序 + 循环依赖检测

#### ⚠️ 缺失的 System Protocol 特性
| 特性 | 规范要求 | 当前状态 | 优先级 |
|------|----------|----------|--------|
| **Plugin Versioning** | plugin.zod: version compatibility | ❌ 未实现 | 🔴 高 |
| **Plugin Manifest Validation** | manifest.zod | ❌ 未实现 | 🔴 高 |
| **Plugin Loading Strategies** | plugin-loading.zod (lazy/eager/parallel) | ❌ 未实现 | 🟡 中 |
| **Service Scope Types** | service-registry.zod (singleton/transient/scoped) | ⚠️ 仅 singleton | 🟡 中 |
| **Plugin Context Complete API** | plugin.zod (storage/i18n/metadata/app) | ⚠️ 部分实现 | 🔴 高 |
| **Plugin Sandboxing** | plugin-validator.zod | ❌ 未实现 | 🟢 低 |
| **Hot Reload** | plugin-lifecycle-events.zod | ❌ 未实现 | 🟢 低 |
| **Metrics Collection** | metrics.zod | ❌ 未实现 | 🟡 中 |

---

### 2. 插件包（特性实现）

| 插件 | 版本 | 功能 | Spec 依赖 | 合规状态 |
|------|------|------|----------|----------|
| **@objectos/plugin-server** | 0.1.0 | NestJS HTTP 服务器（REST/GraphQL/WebSocket） | ✅ 0.9.0 | ⚠️ 部分合规 |
| **@objectos/plugin-better-auth** | 0.1.0 | 认证（OIDC/SAML/LDAP） | ❌ 缺失 | ✅ 功能完整 |
| **@objectos/plugin-audit-log** | 0.1.0 | 审计日志（事件追踪、变更历史） | ✅ 0.9.0 | ✅ 合规 |
| **@objectos/plugin-permissions** | 0.1.0 | RBAC + 字段/记录级安全 | ✅ 0.9.0 | ❌ 仅定义 |
| **@objectos/plugin-workflow** | 0.1.0 | FSM 引擎 + 流程执行 | ❌ 缺失 | ✅ 功能完整 |
| **@objectos/plugin-automation** | 0.1.0 | 触发器、动作、公式字段 | ❌ 缺失 | ✅ 功能完整 |
| **@objectos/plugin-jobs** | 0.1.0 | 任务队列 + 调度 | ❌ 缺失 | ✅ 功能完整 |
| **@objectos/plugin-ai-agent** | 0.1.0 | AI 代理编排 | ❌ 缺失 | ✅ 功能完整 |
| **@objectos/plugin-ai-models** | 0.1.0 | AI 模型注册表（LLM 抽象） | ❌ 缺失 | ✅ 功能完整 |
| **@objectos/plugin-ai-rag** | 0.1.0 | RAG（文档索引、语义搜索） | ❌ 缺失 | ✅ 功能完整 |

**插件合规性问题汇总**:

1. **缺少 Spec 依赖** ❌
   - 7/10 插件未导入 `@objectstack/spec` 包
   - 风险：类型安全违规、数据契约不一致

2. **Permissions 插件未实现** ❌
   - 仅导出类型定义，无实际插件实现
   - 缺失：init()、start()、destroy() 生命周期方法
   - 需要：实现 YAML 配置加载 + 权限引擎

3. **钩子命名不一致** ⚠️
   - Better-Auth 使用 `context.hook('http.route.register')` - 非标准钩子名称
   - 规范违规：钩子应遵循 `data.*`、`job.*`、`plugin.*` 模式

4. **缺少运行时守卫** ⚠️
   - 插件未在 init 时验证 spec 版本
   - 依赖插件间无版本兼容性检查（AI-Agent/RAG 依赖 AI-Models）

---

### 3. 预设包

| 包名 | 版本 | 用途 | 状态 |
|------|------|------|------|
| **@objectos/preset-base** | 0.1.0 | 基础预设（角色、权限、默认配置 YAML） | ✅ 活跃 |

---

### 4. 应用程序

| 应用 | 版本 | 用途 | 状态 |
|------|------|------|------|
| **@objectos/web** | 0.1.0 | Next.js Web 应用（演示/管理 UI） | ✅ 活跃 |
| **@objectos/site** | 0.1.0 | 文档站点（Fumadocs + Next.js） | ✅ 活跃 |

---

## 🏗️ Spec Protocol 合规性矩阵

### System Protocol 详细对照

基于 @objectstack/spec v0.9.0 的 `/dist/system/` 目录分析：

| 模块 | 规范要求 | 当前实现 | 缺口 | 优先级 |
|------|----------|----------|------|--------|
| **plugin.zod** | PluginContext 完整 API（ql/os/logger/storage/i18n/metadata/events/app/drivers） | ⚠️ logger/ql 已实现，storage/i18n/metadata/app 未实现 | 需实现 storage/i18n API | 🔴 |
| **plugin-loading.zod** | 加载策略（lazy/eager/parallel/deferred/on-demand） | ❌ 仅支持 eager（启动时全部加载） | 需实现动态加载、代码分割 | 🟡 |
| **plugin-lifecycle-events.zod** | 生命周期钩子（onInstall/onEnable/onLoad/onDisable/onUninstall） | ⚠️ 仅 init/start/destroy | 需增加 onInstall/onEnable/onDisable | 🔴 |
| **service-registry.zod** | 服务作用域（singleton/transient/scoped） | ⚠️ 仅 singleton | 需实现 transient/scoped | 🟡 |
| **startup-orchestrator.zod** | 启动序列编排 | ✅ 依赖拓扑排序已实现 | - | ✅ |
| **manifest.zod** | 包清单验证（id/type/version/dependencies/permissions） | ❌ 未实现 | 需 Zod 验证器 | 🔴 |
| **plugin-capability.zod** | 插件能力标识与特性标志 | ❌ 未实现 | 需能力注册表 | 🟢 |
| **plugin-validator.zod** | 插件验证规则 | ❌ 未实现 | 需验证器框架 | 🟢 |
| **events.zod** | 事件总线协议 | ✅ 基于钩子的系统已实现 | 需标准化事件名称 | 🟡 |
| **job.zod** | 后台任务调度 | ✅ @objectos/plugin-jobs 已实现 | 需与 spec 对齐 | 🟡 |
| **worker.zod** | 工作进程池管理 | ❌ 未实现 | 需实现工作进程 | 🟢 |
| **logging.zod** | 结构化日志接口 | ⚠️ 简单 ConsoleLogger | 需文件/远程后端 | 🟡 |
| **metrics.zod** | 指标收集与监控 | ❌ 未实现 | 需实现插件 | 🟡 |
| **tracing.zod** | 分布式追踪 | ❌ 未实现 | 未来特性 | 🟢 |
| **audit.zod** | 审计日志与合规 | ✅ @objectos/plugin-audit-log 已实现 | 需与 spec 对齐 | 🟡 |
| **datasource.zod** | 数据源连接配置 | ✅ 通过 ObjectQL 实现 | - | ✅ |
| **object-storage.zod** | 对象/Blob 存储抽象 | ❌ 未实现 | 需实现插件 | 🟡 |
| **cache.zod** | 缓存协议 | ❌ 未实现 | 需实现插件 | 🟡 |
| **message-queue.zod** | 消息队列抽象 | ❌ 未实现 | 未来特性 | 🟢 |
| **metadata-loader.zod** | YAML 元数据解析 | ✅ 通过 ObjectQL 实现 | - | ✅ |
| **search-engine.zod** | 搜索引擎抽象 | ❌ 未实现 | 未来特性 | 🟢 |
| **encryption.zod** | 加密协议 | ❌ 未实现 | 需实现插件 | 🟡 |
| **compliance.zod** | 合规框架（GDPR/SOC2/HIPAA） | ❌ 未实现 | 未来特性 | 🟢 |
| **masking.zod** | 敏感数据脱敏 | ❌ 未实现 | 未来特性 | 🟢 |
| **notification.zod** | 通知系统（邮件/短信/推送） | ❌ 未实现 | 需实现插件 | 🟡 |
| **change-management.zod** | 变更跟踪与版本控制 | ⚠️ 部分通过 audit-log | 需完整实现 | 🟡 |
| **migration.zod** | 数据库迁移定义 | ✅ 通过 ObjectQL 实现 | - | ✅ |
| **http-server.zod** | HTTP 服务器接口 | ✅ @objectos/plugin-server 已实现 | 需与 spec 对齐 | 🟡 |
| **translation.zod** | i18n/本地化协议 | ❌ 未实现 | 需实现插件 | 🟡 |
| **feature.zod** | 特性标志系统 | ❌ 未实现 | 需实现插件 | 🟢 |
| **collaboration.zod** | 协作工具（评论/提及/通知） | ❌ 未实现 | 未来特性 | 🟢 |
| **context.zod** | 插件上下文定义 | ✅ PluginContext 已实现 | 需完善 API | 🔴 |

**合规性总结**:
- ✅ **完全合规**: 6/30 (20%)
- ⚠️ **部分合规**: 8/30 (27%)
- ❌ **未实现**: 16/30 (53%)

---

## 🚀 完整开发计划

### 第 1 阶段：Runtime 增强 - 核心协议合规（第 1-2 周）

**目标**: 使 @objectstack/runtime 完全符合 System Protocol 核心要求

#### 1.1 Plugin Context API 完善 🔴

**任务**:
- [ ] 实现 `context.storage` API（plugin.zod 要求）
  - `get(key: string): Promise<any>`
  - `set(key: string, value: any): Promise<void>`
  - `delete(key: string): Promise<void>`
  - 实现：插件隔离的 KV 存储（内存 + 可选持久化）

- [ ] 实现 `context.i18n` API
  - `t(key: string, params?: object): string`
  - `getLocale(): string`
  - 实现：基于 i18next 或简单的 JSON 翻译

- [ ] 实现 `context.metadata` API
  - 从 YAML 加载的元数据访问
  - 与 ObjectQL 的 metadata-loader 集成

- [ ] 实现 `context.app.router` API
  - Express Router 集成
  - 与 @objectos/plugin-server 协调

**成果物**:
- ✅ 完整的 PluginContext 实现
- ✅ 15+ 单元测试
- ✅ API 文档

#### 1.2 Plugin Manifest 系统 🔴

**任务**:
- [ ] 创建 `ManifestValidator` 类
  - 基于 `manifest.zod` 的 Zod 验证
  - 验证：id、type、version、dependencies、permissions

- [ ] 扩展 Plugin Interface
  ```typescript
  interface Plugin {
    name: string;
    version: string;
    manifest?: PluginManifest; // NEW
    dependencies?: string[];
    init?(context: PluginContext): Promise<void>;
    start?(): Promise<void>;
    destroy?(): Promise<void>;
  }
  ```

- [ ] 在 `ObjectKernel.use()` 中添加验证
  - 调用 ManifestValidator
  - 拒绝无效插件

**成果物**:
- ✅ ManifestValidator 类
- ✅ 8+ 单元测试
- ✅ 错误消息清晰

#### 1.3 Enhanced Lifecycle Hooks 🔴

**任务**:
- [ ] 添加 `plugin-lifecycle-events.zod` 钩子
  ```typescript
  interface Plugin {
    onInstall?(context: PluginContext): Promise<void>;
    onEnable?(context: PluginContext): Promise<void>;
    onLoad?(context: PluginContext): Promise<void>; // 原 init
    onDisable?(context: PluginContext): Promise<void>;
    onUninstall?(context: PluginContext): Promise<void>;
  }
  ```

- [ ] 更新 ObjectKernel 生命周期
  - `install()` → 调用 onInstall（数据库迁移、资源创建）
  - `enable()` → 调用 onEnable（激活插件）
  - `bootstrap()` → 调用 onLoad（原 init）
  - `disable()` → 调用 onDisable（暂停插件）
  - `uninstall()` → 调用 onUninstall（清理数据）

**成果物**:
- ✅ 完整生命周期支持
- ✅ 12+ 单元测试
- ✅ 生命周期文档

#### 1.4 Service Registry 增强 🟡

**任务**:
- [ ] 实现 `service-registry.zod` 的作用域类型
  - `singleton` - 单例（已实现）
  - `transient` - 每次创建新实例
  - `scoped` - 作用域内单例（如请求作用域）

- [ ] 添加 ServiceMetadata
  ```typescript
  interface ServiceMetadata {
    name: string;
    scope: 'singleton' | 'transient' | 'scoped';
    type?: string;
    registeredAt?: number;
    metadata?: Record<string, any>;
  }
  ```

- [ ] 实现 `context.registerService()` 增强版
  ```typescript
  registerService(
    name: string, 
    service: any, 
    options?: { scope?: ServiceScopeType }
  )
  ```

**成果物**:
- ✅ 多作用域服务注册
- ✅ 10+ 单元测试
- ✅ 服务注册表文档

---

### 第 2 阶段：插件规范对齐（第 3-4 周）

**目标**: 确保所有现有插件符合 @objectstack/spec

#### 2.1 为所有插件添加 Spec 依赖 🔴

**任务**:
- [ ] 在以下包中添加 `@objectstack/spec: 0.9.0`
  - @objectos/plugin-better-auth
  - @objectos/plugin-workflow
  - @objectos/plugin-automation
  - @objectos/plugin-jobs
  - @objectos/plugin-ai-agent
  - @objectos/plugin-ai-models
  - @objectos/plugin-ai-rag

**成果物**:
- ✅ 所有插件 package.json 更新
- ✅ 依赖安装验证

#### 2.2 标准化钩子命名 🟡

**任务**:
- [ ] 定义标准钩子命名约定（基于 events.zod）
  ```typescript
  // 数据钩子
  data.beforeInsert
  data.afterInsert
  data.beforeUpdate
  data.afterUpdate
  data.beforeDelete
  data.afterDelete
  
  // 插件钩子
  plugin.beforeInstall
  plugin.afterEnable
  plugin.beforeDisable
  
  // HTTP 钩子
  http.beforeRequest
  http.afterResponse
  http.error
  
  // 任务钩子
  job.beforeExecute
  job.afterExecute
  job.failed
  ```

- [ ] 更新 Better-Auth 钩子名称
  - `http.route.register` → `http.beforeStart`

- [ ] 创建钩子注册表文档

**成果物**:
- ✅ 钩子命名规范文档
- ✅ 所有插件钩子更新
- ✅ 5+ 集成测试

#### 2.3 实现 Permissions 插件 ❌

**任务**:
- [ ] 创建完整的插件类
  ```typescript
  export class PermissionsPlugin implements Plugin {
    name = '@objectos/plugin-permissions';
    version = '0.1.0';
    dependencies = ['@objectos/plugin-audit-log'];
    
    async init(context: PluginContext) {
      // 加载 permission sets YAML
      // 注册 permission engine 服务
      // 订阅 data.* 钩子
    }
    
    async start() {
      // 启动权限引擎
    }
    
    async destroy() {
      // 清理
    }
  }
  ```

- [ ] 实现核心功能
  - YAML 权限配置加载
  - 对象级权限检查（CRUD）
  - 字段级权限过滤
  - 记录级安全（RLS）

**成果物**:
- ✅ 完整的 Permissions 插件
- ✅ 20+ 单元测试
- ✅ 集成测试
- ✅ 使用文档

#### 2.4 添加插件版本验证 🔴

**任务**:
- [ ] 在 `ObjectKernel.use()` 中添加版本检查
  - 验证依赖插件存在
  - 验证版本兼容性（semver）
  - 抛出清晰的错误

- [ ] 示例
  ```typescript
  // AI-Agent 声明依赖
  dependencies: ['@objectos/plugin-ai-models@^0.1.0']
  
  // Kernel 验证
  if (!hasService('ai-models') || !semver.satisfies('0.1.0', '^0.1.0')) {
    throw new Error('...');
  }
  ```

**成果物**:
- ✅ 版本验证逻辑
- ✅ 8+ 单元测试
- ✅ 错误消息文档

---

### 第 3 阶段：缺失系统插件实现（第 5-7 周）

**目标**: 实现 System Protocol 中缺失的核心系统插件

#### 3.1 @objectos/plugin-storage 🟡

**功能**: 插件隔离的 KV 存储

**任务**:
- [ ] 实现 `object-storage.zod` 协议
- [ ] 支持后端
  - 内存存储（开发）
  - 文件存储（SQLite）
  - Redis（生产）
- [ ] 插件隔离（命名空间）
- [ ] API
  ```typescript
  storage.get(key: string): Promise<any>
  storage.set(key: string, value: any, ttl?: number): Promise<void>
  storage.delete(key: string): Promise<void>
  storage.keys(pattern: string): Promise<string[]>
  ```

**成果物**:
- ✅ Storage 插件
- ✅ 15+ 单元测试
- ✅ 文档

#### 3.2 @objectos/plugin-metrics 🟡

**功能**: 系统监控与指标收集

**任务**:
- [ ] 实现 `metrics.zod` 协议
- [ ] 指标类型
  - Counter（计数器）
  - Gauge（仪表）
  - Histogram（直方图）
- [ ] Prometheus 兼容导出
- [ ] 内置指标
  - 插件加载时间
  - 服务调用次数
  - 钩子执行时间

**成果物**:
- ✅ Metrics 插件
- ✅ Prometheus 集成
- ✅ 10+ 单元测试

#### 3.3 @objectos/plugin-i18n 🟡

**功能**: 国际化与本地化

**任务**:
- [ ] 实现 `translation.zod` 协议
- [ ] 基于 i18next 或自定义实现
- [ ] 支持格式
  - JSON 翻译文件
  - YAML 翻译文件
- [ ] API
  ```typescript
  i18n.t(key: string, params?: object): string
  i18n.getLocale(): string
  i18n.setLocale(locale: string): void
  i18n.loadTranslations(locale: string, data: object): void
  ```

**成果物**:
- ✅ i18n 插件
- ✅ 多语言测试
- ✅ 8+ 单元测试

#### 3.4 @objectos/plugin-cache 🟡

**功能**: 缓存抽象层

**任务**:
- [ ] 实现 `cache.zod` 协议
- [ ] 支持后端
  - 内存缓存（LRU）
  - Redis
- [ ] API
  ```typescript
  cache.get(key: string): Promise<any>
  cache.set(key: string, value: any, ttl?: number): Promise<void>
  cache.delete(key: string): Promise<void>
  cache.clear(): Promise<void>
  ```

**成果物**:
- ✅ Cache 插件
- ✅ 12+ 单元测试

#### 3.5 @objectos/plugin-notification 🟡

**功能**: 通知系统

**任务**:
- [ ] 实现 `notification.zod` 协议
- [ ] 通知渠道
  - Email（SMTP）
  - SMS（Twilio/阿里云）
  - 推送通知（Firebase）
  - Webhook
- [ ] 模板系统（Handlebars）
- [ ] 队列支持（异步发送）

**成果物**:
- ✅ Notification 插件
- ✅ 多渠道支持
- ✅ 15+ 单元测试

---

### 第 4 阶段：高级特性（第 8-10 周）

**目标**: 实现 System Protocol 的高级特性

#### 4.1 Plugin Loading Strategies 🟢

**任务**:
- [ ] 实现 `plugin-loading.zod` 协议
- [ ] 支持加载策略
  - `eager` - 启动时加载（当前实现）
  - `lazy` - 首次使用时加载
  - `parallel` - 并行加载
  - `deferred` - 延迟加载
  - `on-demand` - 按需加载

- [ ] 动态导入支持
  ```typescript
  kernel.loadPlugin('@objectos/plugin-workflow', { strategy: 'lazy' });
  ```

**成果物**:
- ✅ 动态加载系统
- ✅ 10+ 单元测试
- ✅ 性能基准测试

#### 4.2 Plugin Capability Registry 🟢

**任务**:
- [ ] 实现 `plugin-capability.zod` 协议
- [ ] 插件声明能力
  ```typescript
  manifest: {
    capabilities: ['data-sync', 'offline-support', 'realtime']
  }
  ```

- [ ] 能力查询 API
  ```typescript
  kernel.findPluginsByCapability('data-sync');
  ```

**成果物**:
- ✅ 能力注册表
- ✅ 8+ 单元测试

#### 4.3 Hot Reload (开发模式) 🟢

**任务**:
- [ ] 实现 `plugin-lifecycle-events.zod` 的热重载
- [ ] 文件监听（chokidar）
- [ ] 插件卸载 + 重新加载
- [ ] 保持状态（可选）

**成果物**:
- ✅ 热重载系统
- ✅ 开发体验文档

---

### 第 5 阶段：测试与文档（第 11-12 周）

**目标**: 确保生产质量

#### 5.1 集成测试

**任务**:
- [ ] 完整插件生命周期测试
- [ ] 多插件协作测试
- [ ] 权限执行测试
- [ ] 工作流执行测试
- [ ] 同步协议测试

**成果物**:
- ✅ 50+ 集成测试
- ✅ 90%+ 代码覆盖率

#### 5.2 性能测试

**任务**:
- [ ] API 吞吐量（目标：1000+ req/s）
- [ ] WebSocket 连接（目标：10k+ 并发）
- [ ] 查询性能基准
- [ ] 内存使用分析

**成果物**:
- ✅ 性能基准报告
- ✅ 优化建议

#### 5.3 文档

**任务**:
- [ ] API 参考文档（完整的 OpenAPI 规范）
- [ ] 插件 API 文档
- [ ] 钩子系统参考
- [ ] 快速入门指南
- [ ] 插件开发指南
- [ ] 从 kernel 迁移指南
- [ ] 生产部署指南
- [ ] 安全最佳实践

**成果物**:
- ✅ 完整文档站点
- ✅ 10+ 示例插件
- ✅ 3+ 示例应用

#### 5.4 质量保证

**任务**:
- [ ] 测试覆盖率
  - Runtime: 95%+
  - Plugins: 90%+
  - Integration: 85%+

- [ ] 安全审计
  - OWASP Top 10 合规
  - SQL 注入防护
  - XSS 保护
  - CSRF 令牌
  - 速率限制验证

- [ ] 代码质量
  - ESLint 合规
  - TypeScript 严格模式
  - 无 any 类型
  - 文档注释

**成果物**:
- ✅ 200+ 总测试
- ✅ 完整文档
- ✅ 安全审计报告
- ✅ 性能基准

---

## 📂 推荐的文件结构

```
packages/
├── runtime/                           # 核心微内核（增强）
│   ├── src/
│   │   ├── kernel.ts                  # ✅ 已实现，需增强
│   │   ├── plugin-context.ts          # ✅ 已实现，需完善 API
│   │   ├── manifest-validator.ts      # 🆕 需实现
│   │   ├── dependency-resolver.ts     # ✅ 已在 kernel.ts 中
│   │   ├── service-registry.ts        # 🆕 从 plugin-context 抽取
│   │   ├── event-bus.ts              # 🆕 从 plugin-context 抽取
│   │   └── types.ts                   # ✅ 已实现，需扩展
│   └── test/
│
├── plugins/
│   ├── server/                        # ✅ HTTP 服务器（已实现，需对齐 spec）
│   ├── better-auth/                   # ✅ 认证（已实现，需添加 spec 依赖）
│   ├── audit-log/                     # ✅ 审计（已实现，已符合 spec）
│   ├── permissions/                   # ❌ 仅定义，需完整实现
│   ├── workflow/                      # ✅ 流程引擎（已实现，需添加 spec 依赖）
│   ├── automation/                    # ✅ 自动化（已实现，需添加 spec 依赖）
│   ├── jobs/                         # ✅ 任务队列（已实现，需添加 spec 依赖）
│   ├── ai-agent/                     # ✅ AI 代理（已实现，需添加 spec 依赖）
│   ├── ai-models/                    # ✅ AI 模型（已实现，需添加 spec 依赖）
│   ├── ai-rag/                       # ✅ RAG（已实现，需添加 spec 依赖）
│   │
│   ├── storage/                      # 🆕 需实现 - 作用域存储插件
│   │   ├── src/
│   │   │   ├── plugin.ts
│   │   │   ├── storage-manager.ts
│   │   │   ├── backends/
│   │   │   │   ├── memory.ts
│   │   │   │   ├── sqlite.ts
│   │   │   │   └── redis.ts
│   │   │   └── types.ts
│   │   └── test/
│   │
│   ├── metrics/                      # 🆕 需实现 - 监控插件
│   │   ├── src/
│   │   │   ├── plugin.ts
│   │   │   ├── metrics-collector.ts
│   │   │   ├── prometheus.ts
│   │   │   └── types.ts
│   │   └── test/
│   │
│   ├── i18n/                         # 🆕 需实现 - 国际化插件
│   │   ├── src/
│   │   │   ├── plugin.ts
│   │   │   ├── translator.ts
│   │   │   ├── loader.ts
│   │   │   └── types.ts
│   │   └── test/
│   │
│   ├── cache/                        # 🆕 需实现 - 缓存插件
│   │   ├── src/
│   │   │   ├── plugin.ts
│   │   │   ├── cache-manager.ts
│   │   │   ├── backends/
│   │   │   │   ├── memory.ts
│   │   │   │   └── redis.ts
│   │   │   └── types.ts
│   │   └── test/
│   │
│   └── notification/                 # 🆕 需实现 - 通知插件
│       ├── src/
│       │   ├── plugin.ts
│       │   ├── notification-manager.ts
│       │   ├── channels/
│       │   │   ├── email.ts
│       │   │   ├── sms.ts
│       │   │   ├── push.ts
│       │   │   └── webhook.ts
│       │   ├── templates/
│       │   └── types.ts
│       └── test/
│
├── presets/
│   └── base/                          # ✅ 基础预设（已实现）
│
└── kernel/                            # ⚠️ 已废弃，冻结
    └── DEPRECATED.md                  # 迁移通知
```

---

## 📊 成功指标

### 技术指标
- [ ] **测试覆盖率**: 所有包 90%+
- [ ] **API 性能**: <100ms 响应时间（p95）
- [ ] **并发用户**: 支持 10k+ WebSocket 连接
- [ ] **插件生态**: 10+ 社区插件
- [ ] **文档**: 100+ 页

### 采用指标
- [ ] **GitHub Stars**: 2026 年 +2k
- [ ] **NPM 下载**: 每月 10k+
- [ ] **生产部署**: 100+ 项目
- [ ] **贡献者**: 20+ 活跃

### 质量指标
- [ ] **安全性**: 通过 OWASP Top 10 审计
- [ ] **可靠性**: 生产环境 99.9% 正常运行时间
- [ ] **性能**: 达到所有基准目标
- [ ] **文档**: 95%+ 覆盖率

---

## 📅 时间线总结

| 阶段 | 持续时间 | 交付物 | 优先级 |
|------|----------|--------|--------|
| **阶段 1**: Runtime 增强 | 2 周 | 完善的 runtime + 核心协议合规 | 🔴 关键 |
| **阶段 2**: 插件规范对齐 | 2 周 | 所有插件符合 spec | 🔴 关键 |
| **阶段 3**: 缺失系统插件 | 3 周 | 5 个新系统插件 | 🟡 重要 |
| **阶段 4**: 高级特性 | 3 周 | 动态加载 + 能力注册 | 🟢 增强 |
| **阶段 5**: 测试与文档 | 2 周 | 测试 + 文档 | 🔴 关键 |
| **总计** | **12 周** | **生产就绪的 ObjectOS v1.0** | - |

**目标完成时间**: 2026 年 4 月

---

## 👥 团队与资源

### 推荐团队
- **1x 首席架构师**: 整体设计与协调
- **2x 高级工程师**: 核心 runtime 和插件开发
- **1x QA 工程师**: 测试与质量保证
- **1x 技术文档工程师**: 文档

### 外部依赖
- **ObjectQL 团队**: 数据协议协调
- **ObjectUI 团队**: UI 协议和同步协调
- **社区**: 插件贡献和测试

---

## ⚠️ 风险与缓解

### 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 性能退化 | 高 | 中 | 广泛的基准测试、性能分析 |
| 破坏性变更 | 高 | 中 | 兼容层、迁移工具 |
| 插件冲突 | 中 | 中 | 严格的依赖解析、沙盒 |
| 同步复杂性 | 高 | 高 | 增量实施、彻底测试 |

### 时间线风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 范围蔓延 | 高 | 中 | 严格的范围定义、分阶段方法 |
| 资源限制 | 中 | 低 | 每个阶段的缓冲时间、优先级排序 |
| 依赖延迟 | 中 | 低 | 与 ObjectQL/ObjectUI 早期集成 |

---

## 📖 参考文献

### 内部文档
- [架构指南](./ARCHITECTURE.md)
- [API 协议计划](./API_PROTOCOL_IMPLEMENTATION_PLAN.md)
- [路线图](./ROADMAP.md)
- [贡献指南](./CONTRIBUTING.md)
- [规范系统开发计划](./SPEC_SYSTEM_DEVELOPMENT_PLAN.md)

### 外部资源
- [@objectstack/spec](https://github.com/objectstack-ai/spec) - 协议规范
- [ObjectQL](https://github.com/objectql/objectql) - 数据层实现
- [ObjectUI](https://github.com/objectql/objectui) - UI 层（计划中）

### 标准与协议
- OpenAPI 3.0 规范
- JSON Schema
- WebSocket 协议（RFC 6455）
- Server-Sent Events（SSE）

---

## ✅ 下一步即时行动

### 第 1 周（当前）
1. ✅ 创建完整的开发计划（本文档）
2. 🚧 设置新插件包结构
3. 🚧 使用 manifest 支持增强 runtime
4. 🚧 从 kernel 移植依赖解析器
5. 🚧 创建 @objectos/plugin-storage

### 第 2 周
1. 实现 plugin-metrics
2. 向 runtime 添加生命周期钩子
3. 编写从 kernel 的迁移指南
4. 开始第 2 阶段：插件规范对齐

---

## 📝 文档历史

| 版本 | 日期 | 作者 | 变更 |
|------|------|------|------|
| 1.0.0 | 2026-02-03 | GitHub Copilot | 初始完整计划（基于 spec 0.9.0 深度分析） |

---

**状态**: ✅ 准备实施  
**下次审查**: 2026-02-17（第 1 阶段完成后）

---

## 附录 A: Spec Protocol 参考

### @objectstack/spec v0.9.0 命名空间

1. **Data Protocol** (`Data.*`)
   - ServiceObject, Field, QueryAST, Hook
   - 处理业务对象定义

2. **Kernel Protocol** (`Kernel.*`)
   - PluginDefinition, ObjectStackManifest, PluginContextData
   - 管理插件生命周期和上下文

3. **System Protocol** (`System.*`)
   - AuditEvent, Job, Event, Plugin, Logging, Metrics
   - 系统级基础设施

4. **UI Protocol** (`UI.*`)
   - App, View, Dashboard
   - 展示层配置

5. **API Protocol** (`API.*`)
   - Endpoint, Contract, Router
   - 连接性和端点

---

## 附录 B: 插件开发模板

```typescript
// packages/plugins/example/src/plugin.ts
import type { Plugin, PluginContext } from '@objectstack/runtime';
import { z } from 'zod';

export interface ExamplePluginConfig {
  enabled?: boolean;
  option1?: string;
}

export class ExamplePlugin implements Plugin {
  name = '@objectos/plugin-example';
  version = '1.0.0';
  dependencies = ['@objectos/plugin-audit-log'];
  
  constructor(private config: ExamplePluginConfig = {}) {}
  
  async init(context: PluginContext): Promise<void> {
    context.logger.info('初始化示例插件');
    
    // 注册服务
    context.registerService('exampleService', {
      doSomething: () => console.log('执行某操作')
    });
    
    // 注册钩子
    context.hook('data.beforeInsert', async (data) => {
      context.logger.debug('插入前钩子', data);
    });
  }
  
  async start(): Promise<void> {
    this.logger.info('启动示例插件');
  }
  
  async destroy(): Promise<void> {
    this.logger.info('销毁示例插件');
  }
}

export default ExamplePlugin;
```

---

## 附录 C: 测试策略

### 测试类型

1. **单元测试**（Jest）
   - 单个函数和类
   - 模拟外部依赖
   - 目标：95%+ 覆盖率

2. **集成测试**（Jest + Supertest）
   - 插件交互
   - API 请求/响应
   - 目标：90%+ 覆盖率

3. **端到端测试**（Jest）
   - 完整应用流程
   - 用户场景
   - 目标：80%+ 关键路径覆盖率

4. **性能测试**（k6 / Artillery）
   - 负载测试
   - 压力测试
   - 基准测试

### 测试结构
```
packages/plugins/example/
├── src/
│   └── plugin.ts
└── test/
    ├── unit/
    │   ├── plugin.test.ts
    │   └── service.test.ts
    ├── integration/
    │   └── api.test.ts
    └── e2e/
        └── workflow.test.ts
```

---

**文档结束**
