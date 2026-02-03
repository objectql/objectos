# ObjectOS 微内核和插件系统开发方案

> **文档版本**: 1.0.0  
> **日期**: 2026年2月3日  
> **状态**: 实施中

---

## 📋 执行摘要

ObjectOS 是 ObjectStack 生态系统的"业务操作系统"。本文档提供了基于 @objectstack/spec 0.9.1 协议标准，打造全球最新最顶流最受欢迎的企业管理软件平台运行环境的详细开发方案。

### 核心定位

```
┌─────────────────────────────────────────────────────────┐
│                    ObjectStack 生态系统                    │
├─────────────────────────────────────────────────────────┤
│  ObjectQL (数据层)  │  ObjectOS (系统层)  │  ObjectUI (视图层)  │
│  - 数据模型定义      │  - 身份认证管理      │  - 组件库          │
│  - 查询编译器        │  - 权限控制          │  - 表单生成器       │
│  - 驱动适配器        │  - 工作流引擎        │  - 报表设计器       │
│                    │  - 数据同步          │                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 项目目标

### 1. 技术目标

- **100% 协议合规**: 完全实现 @objectstack/spec 所有协议
- **微内核架构**: 最小化核心，所有功能通过插件加载
- **生产就绪**: 90%+ 测试覆盖率，企业级安全和性能
- **开发者友好**: 完善的文档、示例和开发工具

### 2. 业务目标

- **快速应用开发**: 通过 YAML 配置即可生成完整应用
- **企业级功能**: 内置 RBAC、审计日志、工作流等
- **可扩展性**: 支持自定义插件和第三方集成
- **多租户支持**: 数据隔离和租户管理

---

## 🏗️ 架构设计

### 微内核架构模式

```typescript
┌─────────────────────────────────────────────────────────┐
│            @objectstack/runtime (微内核)                  │
│  • 插件生命周期管理 (init/load/start/stop/destroy)       │
│  • 服务注册表 (依赖注入容器)                              │
│  • 事件总线 (插件间通信)                                  │
│  • 依赖解析器 (拓扑排序)                                  │
│  • 安全沙箱 (插件隔离)                                    │
└──────────────┬──────────────────────────────────────────┘
               │
       ┌───────┴────────┬────────────┬──────────┐
       │                │            │          │
  ┌────▼─────┐   ┌─────▼─────┐  ┌──▼───┐  ┌───▼────┐
  │ 系统插件  │   │ 业务插件   │  │扩展插件│  │自定义插件│
  └──────────┘   └───────────┘  └──────┘  └────────┘
```

### 核心概念

#### 1. 插件清单 (Plugin Manifest)

每个插件都有一个清单文件，定义其元数据、依赖和能力：

```typescript
// plugin.manifest.ts
import { PluginDefinition } from '@objectstack/spec';

export const manifest: PluginDefinition = {
  id: 'objectos-crm',
  name: 'CRM Plugin',
  version: '1.0.0',
  
  // 依赖声明
  dependencies: {
    '@objectos/plugin-auth': '^1.0.0',
    '@objectos/plugin-audit-log': '^1.0.0'
  },
  
  // 能力注册
  provides: {
    objects: ['./objects/*.yml'],      // 业务对象
    workflows: ['./workflows/*.yml'],  // 工作流
    triggers: ['./triggers/*.yml'],    // 触发器
    apis: ['./apis/*.yml']             // API端点
  },
  
  // 生命周期钩子
  hooks: {
    onInstall: './hooks/install.ts',
    onLoad: './hooks/load.ts',
    onEnable: './hooks/enable.ts'
  }
};
```

#### 2. 插件生命周期

```
安装 (Install)
  ↓
加载 (Load) ← 读取清单，注册能力
  ↓
启用 (Enable) ← 执行启动逻辑
  ↓
运行中 (Running) ← 响应事件和请求
  ↓
禁用 (Disable) ← 停止服务
  ↓
卸载 (Uninstall) ← 清理资源
```

#### 3. 服务注册表

插件通过服务注册表共享能力：

```typescript
// 在插件中注册服务
export class CrmPlugin {
  async onLoad(ctx: PluginContext) {
    ctx.services.register('crm.lead', {
      create: async (data) => { /* 创建线索 */ },
      convert: async (id) => { /* 转换为客户 */ }
    });
  }
}

// 其他插件调用服务
const leadService = ctx.services.get('crm.lead');
await leadService.create({ name: '某公司' });
```

---

## 📦 包结构设计

### 核心包

#### @objectstack/runtime (微内核)

**职责**: 插件系统的核心引擎

**主要模块**:
- `PluginLoader`: 加载和验证插件
- `ServiceRegistry`: 依赖注入容器
- `EventBus`: 事件发布订阅
- `LifecycleManager`: 生命周期管理
- `DependencyResolver`: 依赖关系解析

**关键接口**:
```typescript
interface Runtime {
  // 加载插件
  loadPlugin(manifest: PluginDefinition): Promise<Plugin>;
  
  // 启动运行时
  start(): Promise<void>;
  
  // 优雅关闭
  shutdown(): Promise<void>;
  
  // 获取插件
  getPlugin(id: string): Plugin | undefined;
  
  // 事件订阅
  on(event: string, handler: Function): void;
}
```

---

### 系统插件 (System Plugins)

这些是核心功能插件，必须安装：

#### 1. @objectos/plugin-server (HTTP 服务器)

**功能**:
- NestJS HTTP 服务器
- GraphQL API
- REST API
- WebSocket 支持

**端点示例**:
```
POST   /api/data/{object}/query    - 查询数据
POST   /api/data/{object}          - 创建记录
PATCH  /api/data/{object}/{id}     - 更新记录
DELETE /api/data/{object}/{id}     - 删除记录
GET    /api/metadata/{object}      - 获取元数据
```

#### 2. @objectos/plugin-better-auth (身份认证)

**功能**:
- 本地认证 (用户名/密码)
- OAuth2 (Google, GitHub, 微信, 企业微信)
- SAML SSO
- LDAP/AD 集成
- JWT Token 管理
- 会话管理

**配置示例**:
```yaml
# auth.config.yml
providers:
  local:
    enabled: true
    passwordPolicy:
      minLength: 8
      requireUppercase: true
      requireNumbers: true
  
  oauth2:
    google:
      clientId: ${GOOGLE_CLIENT_ID}
      clientSecret: ${GOOGLE_CLIENT_SECRET}
    
    wechat:
      appId: ${WECHAT_APP_ID}
      appSecret: ${WECHAT_APP_SECRET}
  
  saml:
    entityId: https://example.com
    ssoUrl: https://idp.example.com/sso
```

#### 3. @objectos/plugin-audit-log (审计日志)

**功能**:
- 自动记录所有数据变更
- 字段级别历史跟踪
- 用户行为审计
- 查询审计追踪
- 审计报表生成

**数据模型**:
```yaml
# audit_log.object.yml
name: _audit_log
label: 审计日志
system: true

fields:
  action:
    type: select
    label: 操作类型
    options: [create, read, update, delete]
  
  object_name:
    type: text
    label: 对象名称
  
  record_id:
    type: text
    label: 记录ID
  
  user:
    type: lookup
    reference_to: _users
    label: 操作用户
  
  before_value:
    type: json
    label: 修改前
  
  after_value:
    type: json
    label: 修改后
  
  ip_address:
    type: text
    label: IP地址
  
  user_agent:
    type: text
    label: 用户代理
```

#### 4. @objectos/plugin-permissions (权限管理)

**功能**:
- 对象级权限 (CRUD)
- 字段级权限 (可见/可编辑)
- 记录级权限 (RLS)
- 权限集 (Permission Set)
- 角色继承

**权限配置示例**:
```yaml
# objects/contact.object.yml
name: contacts
label: 联系人

permission_sets:
  sales:
    allowRead: true
    allowCreate: true
    allowEdit: 
      - field: owner
        equals: $currentUser.id
    allowDelete: false
    
  admin:
    allowRead: true
    allowCreate: true
    allowEdit: true
    allowDelete: true

fields:
  salary:
    type: currency
    label: 薪资
    # 字段级权限
    permissions:
      visible_to: ['hr', 'admin']
      editable_by: ['admin']
```

#### 5. @objectos/plugin-workflow (工作流引擎)

**功能**:
- 有限状态机 (FSM)
- 审批流程
- 顺序流程
- 并行流程
- 条件分支

**工作流定义**:
```yaml
# workflows/leave_request.workflow.yml
name: leave_request_flow
label: 请假申请流程
object: leave_requests

states:
  draft:
    label: 草稿
    initial: true
    transitions:
      submit: pending_approval
  
  pending_approval:
    label: 待审批
    transitions:
      approve: approved
      reject: rejected
    
    # 进入状态时的动作
    on_enter:
      - action: notify
        to: ${record.manager}
        template: approval_request
  
  approved:
    label: 已批准
    final: true
    on_enter:
      - action: update_field
        field: approved_at
        value: ${now}
  
  rejected:
    label: 已拒绝
    final: true

guards:
  can_approve:
    condition: ${currentUser.id == record.manager.id}
```

#### 6. @objectos/plugin-automation (自动化)

**功能**:
- 数据触发器 (Record Triggers)
- 定时任务 (Scheduled Jobs)
- Webhook 触发
- 邮件触发

**触发器示例**:
```yaml
# triggers/lead_auto_assign.trigger.yml
name: lead_auto_assign
label: 线索自动分配
object: leads
event: afterInsert

conditions:
  - field: source
    operator: equals
    value: 'Website'

actions:
  - type: update_field
    field: owner
    value: 
      type: round_robin
      pool: ['user1', 'user2', 'user3']
  
  - type: send_email
    to: ${record.owner.email}
    template: new_lead_assigned
```

#### 7. @objectos/plugin-storage (存储管理)

**功能**:
- 插件隔离的 KV 存储
- 内存存储 (开发环境)
- SQLite 存储 (单机部署)
- Redis 存储 (分布式部署)

#### 8. @objectos/plugin-cache (缓存)

**功能**:
- LRU 缓存
- Redis 分布式缓存
- 缓存失效策略
- 性能监控

#### 9. @objectos/plugin-metrics (监控)

**功能**:
- 系统健康监控
- 插件性能追踪
- Prometheus 兼容指标
- 性能报表

#### 10. @objectos/plugin-i18n (国际化)

**功能**:
- 多语言支持 (中文/英文/日文等)
- 动态语言切换
- 翻译管理
- 区域设置

#### 11. @objectos/plugin-notification (通知)

**功能**:
- 邮件通知 (SMTP)
- 短信通知 (阿里云/腾讯云)
- 推送通知 (Firebase/极光)
- Webhook
- 站内消息

---

### 业务插件 (Business Plugins)

这些是可选的业务功能插件：

#### @objectos/plugin-crm (客户关系管理)

**对象模型**:
- 线索 (Leads)
- 客户 (Accounts)
- 联系人 (Contacts)
- 商机 (Opportunities)
- 报价单 (Quotes)
- 订单 (Orders)

#### @objectos/plugin-hrm (人力资源管理)

**对象模型**:
- 员工 (Employees)
- 部门 (Departments)
- 职位 (Positions)
- 考勤 (Attendance)
- 请假 (Leaves)
- 薪资 (Payroll)

---

## 🚀 实施计划

### 第一阶段: 微内核基础 (第1-2周)

**目标**: 创建 @objectstack/runtime 包

**任务**:
1. 创建包结构
2. 实现插件加载器
3. 实现服务注册表
4. 实现事件总线
5. 实现生命周期管理
6. 实现依赖解析器
7. 编写单元测试 (20+)

**交付物**:
- ✅ @objectstack/runtime v0.1.0
- ✅ 完整的 TypeScript 类型定义
- ✅ 开发者文档

### 第二阶段: 核心系统插件 (第3-5周)

**目标**: 创建必需的系统插件

**任务**:
1. @objectos/plugin-storage
2. @objectos/plugin-cache
3. @objectos/plugin-metrics
4. @objectos/plugin-i18n
5. @objectos/plugin-notification

**交付物**:
- ✅ 5个核心系统插件
- ✅ 每个插件 10+ 单元测试
- ✅ 使用文档和示例

### 第三阶段: 增强现有插件 (第6-7周)

**目标**: 迁移现有插件到新的 runtime

**任务**:
1. 更新 @objectos/plugin-server
2. 更新 @objectos/plugin-audit-log
3. 更新 @objectos/plugin-better-auth
4. 更新 @objectos/plugin-permissions

**交付物**:
- ✅ 所有插件使用 @objectstack/runtime
- ✅ 向后兼容性保证
- ✅ 迁移指南

### 第四阶段: 高级插件 (第8-10周)

**目标**: 实现高级业务功能

**任务**:
1. @objectos/plugin-workflow
2. @objectos/plugin-automation
3. @objectos/plugin-jobs

**交付物**:
- ✅ 工作流引擎
- ✅ 自动化系统
- ✅ 后台任务系统

### 第五阶段: API 协议插件 (第11-12周)

**目标**: 实现 API 协议

**任务**:
1. @objectos/plugin-api-core
2. @objectos/plugin-api-discovery
3. @objectos/plugin-api-endpoints

**交付物**:
- ✅ 完整的 API 协议实现
- ✅ OpenAPI 文档生成
- ✅ API 测试工具

### 第六阶段: 集成协议 (第13-14周)

**目标**: 实现外部系统集成

**任务**:
1. @objectos/plugin-integration-core
2. 数据库连接器 (PostgreSQL, MySQL, MongoDB)
3. 文件存储连接器 (S3, OSS)
4. GitHub 连接器

**交付物**:
- ✅ 集成框架
- ✅ 4+ 连接器
- ✅ 集成示例

### 第七阶段: 文档和测试 (第15周)

**目标**: 完善文档和测试

**任务**:
1. 插件开发指南
2. API 参考文档
3. 最佳实践
4. 迁移指南
5. 性能测试
6. 安全审计

**交付物**:
- ✅ 完整文档网站
- ✅ 90%+ 测试覆盖率
- ✅ 性能基准报告

### 第八阶段: 示例和预设 (第16周)

**目标**: 提供示例和预设

**任务**:
1. 示例应用 (CRM, 项目管理)
2. 预设模板
3. 快速启动工具

**交付物**:
- ✅ 2+ 示例应用
- ✅ 3+ 预设模板
- ✅ CLI 工具

---

## 📊 技术栈

### 核心技术

- **运行时**: Node.js 18+ (LTS)
- **语言**: TypeScript 5.0+ (严格模式)
- **构建工具**: pnpm (工作空间)
- **测试框架**: Jest
- **文档**: VitePress

### 依赖项

- **数据层**: @objectql/core
- **协议**: @objectstack/spec
- **Web 框架**: NestJS
- **认证**: Better-Auth
- **数据库**: PostgreSQL, MongoDB, SQLite

---

## 🔒 安全考虑

### 1. 插件沙箱

每个插件运行在隔离的上下文中：
- 无法访问其他插件的内部状态
- 只能通过服务注册表通信
- 资源使用限制 (CPU, 内存)

### 2. 权限系统

- 对象级权限 (CRUD)
- 字段级权限 (可见/可编辑)
- 记录级权限 (RLS)
- API 权限控制

### 3. 审计日志

所有关键操作都记录审计日志：
- 用户登录/登出
- 数据创建/修改/删除
- 权限变更
- 系统配置修改

---

## 📈 性能目标

- **API 响应时间**: < 100ms (P95)
- **并发支持**: 10,000+ QPS
- **数据库查询**: < 50ms (P95)
- **内存占用**: < 512MB (空载)
- **启动时间**: < 5秒

---

## 🎓 开发者体验

### 插件开发流程

1. **创建插件项目**
```bash
npx create-objectos-plugin my-plugin
```

2. **定义清单**
```typescript
// plugin.manifest.ts
export const manifest = {
  id: 'my-plugin',
  version: '1.0.0'
};
```

3. **实现插件**
```typescript
// index.ts
export class MyPlugin {
  async onLoad(ctx: PluginContext) {
    ctx.logger.info('Plugin loaded');
  }
}
```

4. **测试插件**
```bash
pnpm test
```

5. **发布插件**
```bash
pnpm publish
```

---

## 🌐 生态系统

### 插件市场

未来将支持插件市场：
- 社区贡献的插件
- 企业级插件
- 插件版本管理
- 安全审核

### 培训和认证

- 开发者培训课程
- 插件开发认证
- 最佳实践指南

---

## 📞 支持与社区

- **文档**: https://objectos.dev
- **GitHub**: https://github.com/objectstack-ai/objectos
- **Discord**: ObjectOS 社区
- **邮件**: support@objectos.dev

---

## 📝 总结

ObjectOS 通过微内核和插件系统，打造了一个灵活、可扩展、高性能的企业管理软件平台运行环境。基于 @objectstack/spec 协议，ObjectOS 与 ObjectQL 和 ObjectUI 无缝集成，形成完整的低代码开发平台。

**核心优势**:
1. ✅ **快速开发**: YAML 配置即可生成应用
2. ✅ **企业级**: 内置安全、审计、工作流
3. ✅ **可扩展**: 丰富的插件生态
4. ✅ **高性能**: 优化的查询和缓存
5. ✅ **开源**: AGPL-3.0 许可证

---

*本文档将随着项目进展持续更新。*
