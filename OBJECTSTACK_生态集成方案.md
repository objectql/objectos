# ObjectStack 生态集成方案
## ObjectOS 作为生态 OS 子项目的优化计划

**文档版本:** 1.0  
**日期:** 2026-01-30  
**状态:** 规划阶段

---

## 执行摘要

本文档概述了将 ObjectOS 优化并集成到 @objectstack 生态系统作为 **OS（操作系统）子项目**的全面计划。ObjectOS 作为"业务操作系统"，负责**状态管理、身份认证、同步和编排**，而 ObjectQL 管理数据，ObjectUI 管理视图。

### 当前状态评估

**优势:**
- ✅ 微内核架构与插件系统
- ✅ 完全符合 @objectstack/spec v0.6.1 规范
- ✅ 双层插件架构（kernel + runtime）
- ✅ 丰富的插件上下文 API（10+ 服务类别）
- ✅ 事件驱动的插件间通信
- ✅ 两个生产环境插件（audit-log, better-auth）

**发现的差距:**
- ⚠️ 缺少插件市场和发现机制
- ⚠️ 缺少生态系统范围的类型注册表
- ⚠️ 跨项目集成模式有限
- ⚠️ 插件依赖解析不完整
- ⚠️ 生产环境无热重载功能
- ⚠️ 清单验证未强制执行

### 愿景

将 ObjectOS 转变为 ObjectStack 生态系统的**中央编排层**，实现：
1. **插件市场** - 发现和安装生态系统插件
2. **跨项目集成** - ObjectQL、ObjectOS 和 ObjectUI 之间的无缝通信
3. **统一类型系统** - 整个技术栈共享类型
4. **事件协议** - 生态系统范围的事件总线，实现实时同步
5. **开发者平台** - 构建和发布插件的工具

---

## 第一部分：架构分析

### 1.1 当前插件架构

#### 第一层：内核级插件 (@objectos/kernel)

**用途:** 具有完整生命周期管理的企业级插件

**主要组件:**
```typescript
// 清单（配置）
ObjectStackManifest {
  id: "com.company.plugin-name"
  version: "1.0.0"
  type: "plugin"
  permissions: ["data.read", "data.write"]
  objects: ["./objects/*.object.yml"]
  contributes: {
    actions: Action[]
    events: EventDefinition[]
    fieldTypes: FieldType[]
  }
}

// 定义（代码）
PluginDefinition {
  async onInstall(context: PluginContext)   // 首次安装
  async onEnable(context: PluginContext)    // 激活
  async onLoad(context: PluginContext)      // 元数据注册
  async onDisable(context: PluginContext)   // 停用
  async onUninstall(context: PluginContext) // 清理
}
```

**插件上下文 API（10 个服务类别）:**
1. **数据访问** - `context.ql.object()`, `context.ql.query()`
2. **系统 API** - `context.os.getCurrentUser()`, `context.os.getConfig()`
3. **日志** - `context.logger.{debug,info,warn,error}`
4. **存储** - `context.storage.{get,set,delete}`（每个插件独立作用域）
5. **国际化** - `context.i18n.t()`, `context.i18n.getLocale()`
6. **事件** - `context.events.{on,emit}`
7. **HTTP 路由** - `context.app.router.{get,post,put,patch,delete}`
8. **调度器** - `context.app.scheduler.schedule()`
9. **元数据** - `context.metadata.{getObject,listObjects}`
10. **驱动程序** - `context.drivers.{get,register}`（仅框架）

#### 第二层：运行时级微插件 (@objectstack/runtime)

**用途:** 用于核心基础设施服务的轻量级插件

**接口:**
```typescript
interface Plugin {
  name: string
  version?: string
  dependencies?: string[]
  
  async init(ctx: PluginContext): Promise<void>    // 注册服务
  async start(ctx: PluginContext): Promise<void>   // 初始化
  async destroy(): Promise<void>                   // 清理
}
```

### 1.2 生态系统集成点

#### @objectstack/spec 合规性

**当前版本:** 0.6.1

**使用的类型定义:**
```typescript
import {
  ObjectStackManifest,
  PluginDefinition,
  PluginContextData,
  AuditEventType,
  KernelContext,
  ServiceObject,
  Field,
  QueryAST,
  Hook
} from '@objectstack/spec';
```

**协议命名空间:**
1. **数据协议** - 对象模式、字段、查询、钩子
2. **内核协议** - 插件生命周期、清单、上下文
3. **系统协议** - 审计日志、事件、作业
4. **UI 协议** - 应用配置、视图、仪表板
5. **API 协议** - 端点契约、连接性

---

## 第二部分：差距分析

### 2.1 内核级差距

#### 差距 1: 插件依赖解析（不完整）

**当前状态:**
- 在 `plugin-manager.ts` 中勾画了框架
- 运行时实现了拓扑排序算法
- 内核级插件中没有强制执行

**影响:** 高 - 当插件依赖缺失的服务时会导致运行时失败

**建议:**
```typescript
// 添加到 PluginManager
async validateDependencies(manifest: ObjectStackManifest): Promise<void> {
  for (const dep of manifest.dependencies || []) {
    const { name, version } = parseDependency(dep);
    const plugin = this.getPlugin(name);
    
    if (!plugin) {
      throw new Error(`缺少依赖: ${name}`);
    }
    
    if (!semverSatisfies(plugin.version, version)) {
      throw new Error(`版本冲突: ${name} 需要 ${version}，实际 ${plugin.version}`);
    }
  }
}
```

#### 差距 2: 清单验证（未强制执行）

**当前状态:**
- `ObjectStackManifest` 类型在 @objectstack/spec 中定义
- 加载插件时没有运行时验证
- 格式错误的清单可能导致系统崩溃

**影响:** 中 - 安全风险和糟糕的开发者体验

**建议:**
```typescript
import { ObjectStackManifestSchema } from '@objectstack/spec';

async loadPlugin(manifest: unknown): Promise<void> {
  // 验证清单结构
  const validManifest = ObjectStackManifestSchema.parse(manifest);
  
  // 验证插件 ID 格式
  if (!/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/.test(validManifest.id)) {
    throw new Error(`无效的插件 ID: ${validManifest.id}`);
  }
  
  // ... 其余加载逻辑
}
```

#### 差距 3: 热重载（仅开发环境）

**当前状态:**
- 没有插件热重载机制
- 任何插件更改都需要重启服务器
- 减慢开发迭代速度

**影响:** 中 - 降低开发速度

#### 差距 4: 驱动程序注册表（仅框架）

**当前状态:**
- 定义了 `context.drivers.get()`、`context.drivers.register()`
- `plugin-context.ts` 中没有实现
- 驱动程序是手动传递给 ObjectQL 的

**影响:** 中 - 限制可扩展性

#### 差距 5: 错误处理和诊断

**当前状态:**
- 通过 `context.logger` 进行基本错误记录
- 没有结构化的错误报告
- 没有插件健康监控

**影响:** 高 - 降低生产环境的可观察性

### 2.2 生态系统集成差距

#### 差距 6: 插件发现和市场

**当前状态:**
- 插件手动安装在 `node_modules/@objectos/plugin-*`
- 没有插件注册表或市场
- 除了 npm 之外没有版本控制策略

**影响:** 高 - 限制生态系统增长

**建议:**
```typescript
interface PluginMetadata {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  downloads: number;
  rating: number;
  tags: string[];
  repository: string;
  license: string;
}

class PluginMarketplace {
  async search(query: string, filters?: {
    tags?: string[];
    minRating?: number;
  }): Promise<PluginMetadata[]>
  
  async install(pluginId: string, version?: string): Promise<void>
  async publish(manifest: ObjectStackManifest, tarball: Buffer): Promise<void>
}
```

#### 差距 7: 跨项目类型共享

**当前状态:**
- 类型在 @objectstack/spec 中定义
- 每个项目（ObjectQL、ObjectOS、ObjectUI）都有单独的类型
- 没有统一的类型注册表

**影响:** 中 - 增加维护负担

**建议:** 创建 `@objectstack/types` 包

#### 差距 8: 生态系统事件协议

**当前状态:**
- 事件总线仅在 ObjectOS 内部
- 没有跨项目事件传播
- 事件无法到达 ObjectUI 进行实时更新

**影响:** 高 - 阻止实时功能

**建议:** 创建 `@objectstack/events` 包，使用 Redis/NATS 进行跨进程通信

#### 差距 9: ObjectUI 集成

**当前状态:**
- ObjectUI 是一个独立项目
- 没有正式的集成协议
- UI 通过 REST API 获取元数据

**影响:** 中 - 增加 UI 功能的开发时间

### 2.3 开发者体验差距

#### 差距 10: CLI 工具

**当前状态:**
- 没有用于插件开发的 CLI
- 手动搭建插件结构
- 没有代码生成

**影响:** 高 - 降低插件开发者的准入门槛

**建议:**
```bash
# 新的 @objectos/cli 包
objectos plugin create <name>     # 搭建新插件
objectos plugin validate          # 验证清单
objectos plugin test              # 运行插件测试
objectos plugin publish           # 发布到市场
objectos dev                      # 带热重载的开发服务器
```

---

## 第三部分：开发计划

### 第一阶段：内核优化（第 1-3 周）

#### 第 1 周：依赖解析和验证

**任务:**
1. ✅ 在 `PluginManager` 中实现 `validateDependencies()`
2. ✅ 添加清单验证
3. ✅ 编写测试

**交付成果:**
- `packages/kernel/src/dependency-resolver.ts`
- `packages/kernel/src/manifest-validator.ts`
- 30+ 个单元测试

#### 第 2 周：热重载和插件生命周期

**任务:**
1. ✅ 实现热重载机制
2. ✅ 添加插件版本控制
3. ✅ 增强错误处理

**交付成果:**
- `packages/kernel/src/hot-reload.ts`
- `packages/kernel/src/version-manager.ts`
- `packages/kernel/src/error-handler.ts`

#### 第 3 周：性能和可观察性

**任务:**
1. ✅ 优化服务注册表
2. ✅ 优化事件总线
3. ✅ 添加插件指标

**交付成果:**
- `packages/kernel/src/metrics.ts`
- `packages/kernel/src/optimized-registry.ts`
- 性能基准测试

### 第二阶段：生态系统集成（第 4-6 周）

#### 第 4 周：插件市场基础

**任务:**
1. ✅ 设计市场协议
2. ✅ 创建插件发现 API
3. ✅ 实现插件安装

**交付成果:**
- `packages/kernel/src/marketplace/client.ts`
- `packages/kernel/src/marketplace/installer.ts`
- 市场 API 规范（OpenAPI）

#### 第 5 周：跨项目类型注册表

**任务:**
1. ✅ 创建 `@objectstack/types` 包
2. ✅ 与 ObjectQL 集成
3. ✅ 与 ObjectUI 集成

**交付成果:**
- `@objectstack/types` 包
- ObjectQL 和 ObjectOS 中的集成
- 类型注册 API

#### 第 6 周：生态系统事件协议

**任务:**
1. ✅ 创建 `@objectstack/events` 包
2. ✅ 与 ObjectOS 集成事件总线
3. ✅ 为 ObjectUI 添加 WebSocket 桥接

**交付成果:**
- `@objectstack/events` 包
- ObjectOS 中的 WebSocket 服务器
- 事件订阅 API

### 第三阶段：开发者工具（第 7-8 周）

#### 第 7 周：CLI 开发

**任务:**
1. ✅ 创建 `@objectos/cli` 包
2. ✅ 添加代码生成器
3. ✅ 添加开发服务器

**交付成果:**
- `@objectos/cli` 包
- CLI 文档
- 教程："构建你的第一个插件"

#### 第 8 周：测试框架和文档

**任务:**
1. ✅ 创建 `@objectos/testing` 包
2. ✅ 编写全面的文档
3. ✅ 创建示例插件

**交付成果:**
- `@objectos/testing` 包
- 50+ 页文档
- 3 个示例插件

### 第四阶段：生产强化（第 9-10 周）

#### 第 9 周：安全性和稳定性

**任务:**
1. ✅ 实现插件沙箱
2. ✅ 添加权限强制执行
3. ✅ 安全审计

**交付成果:**
- `packages/kernel/src/sandbox.ts`
- `packages/kernel/src/permission-enforcer.ts`
- 安全审计报告

#### 第 10 周：负载测试和优化

**任务:**
1. ✅ 性能基准测试
2. ✅ 负载测试
3. ✅ 生产部署指南

**交付成果:**
- 性能基准测试报告
- 负载测试结果
- 生产部署指南

---

## 第四部分：测试策略

### 4.1 单元测试

**覆盖率目标:** 内核 90%+，插件 80%+

**关键测试套件:**

1. **插件生命周期测试**
2. **服务注册表测试**
3. **事件总线测试**

### 4.2 集成测试

**测试场景:**

1. **插件安装流程**
2. **跨插件通信**
3. **ObjectQL 集成**

### 4.3 性能测试

**基准测试:**

1. **插件加载** - 目标：每个插件 <100ms
2. **服务查找** - 目标：每次查找 <1μs
3. **事件调度** - 目标：每个事件 <10ms

### 4.4 安全测试

**攻击场景:**

1. **恶意插件**
2. **未授权访问**

---

## 第五部分：迁移路径

### 5.1 对于现有插件

**当前插件（v0.2）:**
```typescript
export const myPlugin = {
  id: 'com.example.my-plugin',
  async onEnable(context) {
    context.ql.object('contacts');
  }
};
```

**未来插件（v1.0）:**
```typescript
import { Plugin, PluginContext } from '@objectos/kernel';

export class MyPlugin implements Plugin {
  manifest = {
    id: 'com.example.my-plugin',
    version: '1.0.0',
    permissions: ['data.read', 'data.write']
  };
  
  async onEnable(context: PluginContext) {
    const ql = context.getService<ObjectQL>('objectql');
    await ql.object('contacts');
  }
}
```

**自动迁移:**
```bash
objectos migrate plugin ./src/plugins/*.ts
```

---

## 第六部分：成功指标

### 6.1 技术指标

| 指标 | 目标 | 测量方法 |
|------|------|----------|
| 插件加载时间 | <100ms | 基准测试 100 个插件 |
| 服务查找时间 | <1μs | 100 万次查找平均值 |
| 事件调度时间 | <10ms | 10k 事件 p99 |
| 测试覆盖率 | >85% | Jest 覆盖率报告 |
| 类型安全 | 100% | 公共 API 中没有 `any` 类型 |
| 安全问题 | 0 个严重问题 | 安全审计报告 |

### 6.2 生态系统指标

| 指标 | 目标（6 个月） | 测量方法 |
|------|----------------|----------|
| 发布的插件 | 20+ | 市场计数 |
| 插件下载量 | 10k+ | npm 统计 |
| 活跃贡献者 | 30+ | GitHub 贡献者 |
| GitHub Stars | 5k+ | GitHub 统计 |
| 文档页面 | 100+ | VitePress 站点 |

### 6.3 开发者体验指标

| 指标 | 目标 | 测量方法 |
|------|------|----------|
| 第一个插件开发时间 | <30 分钟 | 入职调查 |
| 插件搭建时间 | <1 分钟 | CLI 基准测试 |
| API 可发现性 | 100% | 所有方法都有文档 |
| 错误清晰度 | >90% | 开发者调查 |

---

## 第七部分：时间表总结

### 第一季度（第 1-10 周）：基础

- **第 1-3 周:** 内核优化
- **第 4-6 周:** 生态系统集成
- **第 7-8 周:** 开发者工具
- **第 9-10 周:** 生产强化

**交付成果:**
- 带热重载的优化内核
- 插件市场基础
- CLI 和测试工具
- 安全强化的运行时

### 第二季度（第 11-20 周）：生态系统增长

- **第 11-14 周:** 构建 5+ 个官方插件
- **第 15-16 周:** 启动市场
- **第 17-18 周:** 文档和教程
- **第 19-20 周:** 社区推广

### 第三季度（第 21-30 周）：扩展和改进

- **第 21-24 周:** 性能优化
- **第 25-27 周:** 高级功能（多租户等）
- **第 28-30 周:** 企业功能

### 第四季度（第 31-40 周）：成熟度

- **第 31-35 周:** 生态系统插件（目标 20+ 个）
- **第 36-38 周:** 认证计划
- **第 39-40 周:** v1.0 发布

---

## 结论

这个全面的计划将 ObjectOS 从独立运行时转变为 **ObjectStack 生态系统的一等公民**。通过实施概述的优化和集成，ObjectOS 将作为**中央编排层**——将 ObjectQL（数据）、ObjectOS（系统）和 ObjectUI（视图）绑定成一个有凝聚力、可扩展的平台的"操作系统"。

### 关键成果

1. **插件市场** - 繁荣的第三方插件生态系统
2. **统一类型系统** - 整个技术栈共享类型
3. **实时事件** - 跨项目事件传播
4. **开发者平台** - CLI、测试工具、全面的文档
5. **生产就绪** - 安全强化、性能优化、经过实战考验

### 成功标准

- **技术:** 90%+ 测试覆盖率、<100ms 插件加载、0 个严重安全问题
- **生态系统:** 20+ 个已发布插件、10k+ 下载量、30+ 贡献者
- **开发者体验:** <30 分钟到第一个插件、100+ 文档页面、清晰的迁移路径

**状态:** 准备实施。等待批准以进行第一阶段，第 1 周。

---

**文档控制:**
- **版本:** 1.0
- **最后更新:** 2026-01-30
- **下次审查:** 2026-02-06（第 1 周结束）
- **批准者:** 产品负责人、工程负责人、安全负责人

---

**详细英文版本:** 请参见 `OBJECTSTACK_ECOSYSTEM_INTEGRATION_PLAN.md`
