# ObjectOS 集成指南 | ObjectOS Integration Guide

> **版本 Version**: 1.0.0  
> **日期 Date**: 2026年2月3日 | February 3, 2026

---

## 目录 | Table of Contents

### 中文部分
1. [ObjectQL集成](#一objectql集成)
2. [ObjectUI集成](#二objectui集成)
3. [完整技术栈集成](#三完整技术栈集成)
4. [常见集成场景](#四常见集成场景)

### English Section
1. [ObjectQL Integration](#i-objectql-integration)
2. [ObjectUI Integration](#ii-objectui-integration)
3. [Full Stack Integration](#iii-full-stack-integration)
4. [Common Integration Scenarios](#iv-common-integration-scenarios)

---

## 中文版 | Chinese Version

### 一、ObjectQL集成

#### 1.1 ObjectQL概述

**ObjectQL** 是 ObjectStack 的数据层，负责：
- 📋 元数据定义 (YAML格式)
- 🗄️ 数据库驱动 (PostgreSQL, MongoDB, SQLite)
- 🔍 查询引擎 (SQL/NoSQL抽象)
- 🔗 关系管理 (Lookup, Master-Detail)

**ObjectOS的角色**: 在ObjectQL之上提供业务逻辑和安全控制

```
┌──────────────────────────────────────────────────────┐
│                   ObjectOS (业务层)                   │
│  • 权限控制                                           │
│  • 工作流                                             │
│  • 触发器                                             │
│  • 审计日志                                           │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│                ObjectQL (数据层)                      │
│  • 元数据解析                                         │
│  • 查询编译                                           │
│  • CRUD操作                                           │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│              Database (PostgreSQL/MongoDB)           │
└──────────────────────────────────────────────────────┘
```

#### 1.2 安装ObjectQL

```bash
# 安装核心包
pnpm add @objectql/core

# 安装数据库驱动
pnpm add @objectql/driver-sql      # PostgreSQL, MySQL, SQLite
# 或
pnpm add @objectql/driver-mongo    # MongoDB

# 安装平台适配器
pnpm add @objectql/platform-node   # Node.js平台
```

#### 1.3 基础集成

```typescript
// src/main.ts
import { createObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { NodePlatform } from '@objectql/platform-node';

// 1. 创建ObjectQL实例
const objectql = createObjectQL({
  // 数据库驱动
  driver: new SqlDriver({
    url: process.env.DATABASE_URL,
    // PostgreSQL: postgresql://user:pass@localhost:5432/db
    // MySQL: mysql://user:pass@localhost:3306/db
    // SQLite: sqlite:./data.db
  }),
  
  // 平台适配器
  platform: new NodePlatform(),
  
  // 配置选项
  options: {
    // 启用日志
    logging: process.env.NODE_ENV === 'development',
    
    // 自动同步数据库结构 (开发模式)
    sync: process.env.NODE_ENV === 'development',
    
    // 连接池配置
    pool: {
      min: 10,
      max: 100
    }
  }
});

// 2. 加载元数据
await objectql.loadMetadata('./objects/**/*.yml');

// 3. 启动ObjectQL
await objectql.start();

// 4. 使用ObjectQL
const contacts = await objectql.find('contacts', {
  filters: { company: 'Acme Inc' },
  fields: ['id', 'first_name', 'email'],
  sort: [{ field: 'created_at', order: 'DESC' }],
  limit: 10
});
```

#### 1.4 元数据定义示例

```yaml
# objects/contacts.yml
name: contacts
label: 联系人
label_plural: 联系人
icon: user
enable_api: true
enable_audit: true

fields:
  # 基础字段
  first_name:
    type: text
    label: 名
    required: true
    
  last_name:
    type: text
    label: 姓
    required: true
    
  email:
    type: email
    label: 邮箱
    unique: true
    
  phone:
    type: phone
    label: 电话
    
  # 关系字段
  account:
    type: lookup
    label: 所属公司
    reference_to: accounts
    on_delete: SET_NULL
    
  owner:
    type: lookup
    label: 负责人
    reference_to: users
    default: current_user
    
  # 系统字段
  created_at:
    type: datetime
    label: 创建时间
    readonly: true
    default: now
    
  created_by:
    type: lookup
    label: 创建人
    reference_to: users
    readonly: true
    default: current_user

# 权限配置
permission_set:
  allowRead: true
  allowCreate: ['sales', 'admin']
  allowEdit: ['sales', 'admin']
  allowDelete: ['admin']
  
# 字段级权限
field_permissions:
  phone:
    visible_to: ['sales', 'admin']
  owner:
    editable_by: ['admin']

# 列表视图
list_views:
  all:
    label: 所有联系人
    filters: []
    columns: ['first_name', 'last_name', 'email', 'account', 'owner']
    
  my_contacts:
    label: 我的联系人
    filters:
      - field: owner
        operator: equals
        value: current_user
    columns: ['first_name', 'last_name', 'email', 'phone']
```

#### 1.5 ObjectOS中使用ObjectQL

```typescript
// packages/plugins/objectql/src/index.ts
import type { PluginManifest } from '@objectstack/spec';
import { createObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';

export const ObjectQLPlugin: PluginManifest = {
  id: 'objectos-objectql',
  name: 'ObjectQL Plugin',
  version: '1.0.0',
  
  hooks: {
    onEnable: async (ctx) => {
      // 创建ObjectQL实例
      const objectql = createObjectQL({
        driver: new SqlDriver({
          url: process.env.DATABASE_URL
        })
      });
      
      // 注册为全局服务
      ctx.services.register('objectql', objectql);
      
      ctx.logger.info('ObjectQL initialized');
    },
    
    onLoad: async (ctx) => {
      const objectql = ctx.services.get('objectql');
      
      // 加载所有对象定义
      await objectql.loadMetadata('./objects/**/*.yml');
      
      // 提供简化的数据访问接口
      ctx.objectql = {
        find: (object, options) => objectql.find(object, options),
        findOne: (object, id) => objectql.findOne(object, id),
        insert: (object, data) => objectql.insert(object, data),
        update: (object, id, data) => objectql.update(object, id, data),
        delete: (object, id) => objectql.delete(object, id)
      };
      
      ctx.logger.info('ObjectQL metadata loaded');
    }
  }
};
```

#### 1.6 ObjectOS增强ObjectQL

ObjectOS在ObjectQL基础上添加：

```typescript
// 1. 权限检查 (plugin-permissions)
ctx.events.on('beforeFind', async (payload) => {
  const hasPermission = await checkPermission(
    payload.userId,
    payload.objectName,
    'read'
  );
  
  if (!hasPermission) {
    throw new ForbiddenError('No permission to read');
  }
});

// 2. 审计日志 (plugin-audit-log)
ctx.events.on('afterInsert', async (payload) => {
  await ctx.objectql.insert('_audit_log', {
    user_id: payload.userId,
    action: 'CREATE',
    object_name: payload.objectName,
    record_id: payload.recordId,
    timestamp: new Date()
  });
});

// 3. 工作流触发 (plugin-workflow)
ctx.events.on('afterUpdate', async (payload) => {
  if (payload.objectName === 'leads' && 
      payload.changes.status === 'qualified') {
    // 启动工作流: 线索转换为商机
    await ctx.services.get('workflow').trigger('lead_to_opportunity', {
      leadId: payload.recordId
    });
  }
});

// 4. 自动化规则 (plugin-automation)
ctx.events.on('beforeInsert', async (payload) => {
  if (payload.objectName === 'contacts') {
    // 自动填充字段
    payload.data.created_by = payload.userId;
    payload.data.created_at = new Date();
    
    // 自动分配负责人
    if (!payload.data.owner) {
      payload.data.owner = await getDefaultOwner(payload.data);
    }
  }
});
```

---

### 二、ObjectUI集成

#### 2.1 ObjectUI概述

**ObjectUI** 是 ObjectStack 的视图层，提供：
- 🎨 React组件库 (Grid, Form, Dashboard)
- 📱 响应式布局
- 🎯 元数据驱动UI
- ⚡ 低代码编辑器

**ObjectOS的角色**: 为ObjectUI提供元数据API和数据API

```
┌──────────────────────────────────────────────────────┐
│              ObjectUI (React前端)                     │
│  • 从ObjectOS获取元数据                               │
│  • 调用ObjectOS数据API                                │
│  • 动态渲染表单/表格                                   │
└──────────────────┬───────────────────────────────────┘
                   │ HTTP/WebSocket
                   ▼
┌──────────────────────────────────────────────────────┐
│              ObjectOS (后端API)                       │
│  • Metadata API: /api/metadata/:object                │
│  • Data API: /api/data/:object                        │
│  • Auth API: /api/auth                                │
└──────────────────────────────────────────────────────┘
```

#### 2.2 元数据API

ObjectOS提供元数据API供ObjectUI消费：

```typescript
// packages/plugins/server/src/controllers/metadata.controller.ts
import { Controller, Get, Param } from '@nestjs/common';

@Controller('api/metadata')
export class MetadataController {
  constructor(private objectql: ObjectQLService) {}
  
  // 获取对象定义
  @Get('objects/:objectName')
  async getObjectMetadata(@Param('objectName') objectName: string) {
    const metadata = await this.objectql.getObjectMetadata(objectName);
    
    return {
      name: metadata.name,
      label: metadata.label,
      icon: metadata.icon,
      
      // 字段定义
      fields: metadata.fields.map(field => ({
        name: field.name,
        type: field.type,
        label: field.label,
        required: field.required,
        readonly: field.readonly,
        options: field.options  // For picklist
      })),
      
      // 列表视图
      listViews: metadata.listViews,
      
      // 权限
      permissions: {
        allowCreate: metadata.permissions.allowCreate,
        allowEdit: metadata.permissions.allowEdit,
        allowDelete: metadata.permissions.allowDelete
      }
    };
  }
  
  // 获取所有对象列表
  @Get('objects')
  async listObjects() {
    const objects = await this.objectql.listObjects();
    
    return objects.map(obj => ({
      name: obj.name,
      label: obj.label,
      icon: obj.icon
    }));
  }
}
```

#### 2.3 ObjectUI使用示例

```typescript
// ObjectUI前端代码
import { ObjectGrid, ObjectForm } from '@objectui/react';

function ContactsPage() {
  return (
    <div>
      {/* 表格组件 - 自动从元数据API获取配置 */}
      <ObjectGrid 
        objectName="contacts"
        apiUrl="http://localhost:3000/api"
        onRowClick={(record) => navigate(`/contacts/${record.id}`)}
      />
    </div>
  );
}

function ContactFormPage({ id }) {
  return (
    <div>
      {/* 表单组件 - 自动从元数据API获取配置 */}
      <ObjectForm 
        objectName="contacts"
        recordId={id}
        apiUrl="http://localhost:3000/api"
        onSave={() => navigate('/contacts')}
      />
    </div>
  );
}
```

#### 2.4 实时同步 (WebSocket)

ObjectOS提供WebSocket支持实时数据同步：

```typescript
// ObjectOS服务器端
@WebSocketGateway()
export class DataGateway {
  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { object: string }) {
    client.join(`object:${payload.object}`);
  }
  
  // 当数据变更时广播
  async notifyChange(objectName: string, recordId: string, action: string) {
    this.server.to(`object:${objectName}`).emit('dataChanged', {
      objectName,
      recordId,
      action
    });
  }
}

// ObjectUI客户端
import { useWebSocket } from '@objectui/react';

function ContactsList() {
  const { subscribe } = useWebSocket('http://localhost:3000');
  
  useEffect(() => {
    // 订阅contacts对象的变更
    subscribe('contacts', (event) => {
      console.log('Data changed:', event);
      // 刷新列表
      refetch();
    });
  }, []);
  
  // ...
}
```

---

### 三、完整技术栈集成

#### 3.1 开发环境搭建

```bash
# 项目结构
my-app/
├── backend/              # ObjectOS后端
│   ├── objects/          # 元数据定义
│   ├── plugins/          # 自定义插件
│   └── src/
│       └── main.ts       # 入口文件
│
├── frontend/             # ObjectUI前端
│   └── src/
│       ├── App.tsx
│       └── pages/
│
└── package.json
```

**安装依赖**:

```json
{
  "name": "my-app",
  "scripts": {
    "dev": "concurrently \"pnpm dev:backend\" \"pnpm dev:frontend\"",
    "dev:backend": "cd backend && pnpm dev",
    "dev:frontend": "cd frontend && pnpm dev"
  },
  "dependencies": {
    // 后端
    "@objectos/plugin-server": "^1.0.0",
    "@objectos/plugin-better-auth": "^1.0.0",
    "@objectql/core": "^4.0.0",
    "@objectql/driver-sql": "^4.0.0",
    
    // 前端
    "@objectui/react": "^1.0.0",
    "react": "^18.0.0"
  }
}
```

#### 3.2 后端配置

```typescript
// backend/src/main.ts
import { createRuntime } from '@objectstack/runtime';
import { ServerPlugin } from '@objectos/plugin-server';
import { BetterAuthPlugin } from '@objectos/plugin-better-auth';
import { AuditLogPlugin } from '@objectos/plugin-audit-log';
import { ObjectQLPlugin } from '@objectos/plugin-objectql';

async function bootstrap() {
  // 1. 创建运行时
  const runtime = createRuntime();
  
  // 2. 注册插件
  await runtime.registerPlugin(ObjectQLPlugin);
  await runtime.registerPlugin(BetterAuthPlugin);
  await runtime.registerPlugin(AuditLogPlugin);
  await runtime.registerPlugin(ServerPlugin);
  
  // 3. 启动所有插件
  await runtime.start();
  
  console.log('🚀 ObjectOS is running on http://localhost:3000');
}

bootstrap();
```

#### 3.3 前端配置

```typescript
// frontend/src/App.tsx
import { ObjectStackProvider } from '@objectui/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <ObjectStackProvider
      apiUrl="http://localhost:3000/api"
      authUrl="http://localhost:3000/auth"
    >
      <BrowserRouter>
        <Routes>
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </BrowserRouter>
    </ObjectStackProvider>
  );
}
```

---

### 四、常见集成场景

#### 4.1 场景1: CRM系统

```yaml
# objects/leads.yml
name: leads
label: 线索
enable_workflow: true

fields:
  name:
    type: text
    label: 姓名
  
  status:
    type: picklist
    label: 状态
    options:
      - { value: 'new', label: '新线索' }
      - { value: 'contacted', label: '已联系' }
      - { value: 'qualified', label: '已确认' }
      - { value: 'lost', label: '已丢失' }
```

```yaml
# workflows/lead_conversion.yml
name: lead_conversion
label: 线索转换
object: leads

states:
  new:
    initial: true
    transitions:
      contact: contacted
  
  contacted:
    transitions:
      qualify: qualified
      lose: lost
  
  qualified:
    final: true
    on_enter:
      - action: convert_to_opportunity
        params:
          source: lead
```

#### 4.2 场景2: 审批流程

```yaml
# objects/leave_requests.yml
name: leave_requests
label: 请假申请

fields:
  employee:
    type: lookup
    reference_to: users
  
  start_date:
    type: date
    label: 开始日期
  
  end_date:
    type: date
    label: 结束日期
  
  reason:
    type: textarea
    label: 请假原因
  
  status:
    type: picklist
    options:
      - pending
      - approved
      - rejected
```

```yaml
# workflows/leave_approval.yml
name: leave_approval
object: leave_requests

states:
  pending:
    initial: true
    on_enter:
      - action: notify_manager
    transitions:
      approve: approved
      reject: rejected
  
  approved:
    final: true
    on_enter:
      - action: update_leave_balance
      - action: notify_employee
  
  rejected:
    final: true
    on_enter:
      - action: notify_employee
```

#### 4.3 场景3: 多租户SaaS

```typescript
// 租户隔离策略
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];
    
    // 注入租户上下文
    request.tenantContext = { tenantId };
    
    return next.handle();
  }
}

// 在ObjectQL查询中自动添加租户过滤
ctx.events.on('beforeFind', async (payload) => {
  const tenantId = payload.context.tenantId;
  
  // 自动添加租户过滤条件
  payload.filters.push({
    tenant_id: tenantId
  });
});
```

---

## English Version

### I. ObjectQL Integration

#### 1.1 ObjectQL Overview

**ObjectQL** is the data layer of ObjectStack, responsible for:
- 📋 Metadata definition (YAML format)
- 🗄️ Database drivers (PostgreSQL, MongoDB, SQLite)
- 🔍 Query engine (SQL/NoSQL abstraction)
- 🔗 Relationship management (Lookup, Master-Detail)

*(Implementation details same as Chinese version with English comments)*

---

### II. ObjectUI Integration

#### 2.1 ObjectUI Overview

**ObjectUI** is the view layer of ObjectStack, providing:
- 🎨 React component library (Grid, Form, Dashboard)
- 📱 Responsive layouts
- 🎯 Metadata-driven UI
- ⚡ Low-code editor

*(Implementation details same as Chinese version with English comments)*

---

### III. Full Stack Integration

#### 3.1 Development Environment Setup

*(Setup steps same as Chinese version)*

---

### IV. Common Integration Scenarios

#### 4.1 Scenario 1: CRM System

*(YAML configurations and examples same as Chinese version with English labels)*

#### 4.2 Scenario 2: Approval Workflows

*(Implementation same as Chinese version)*

#### 4.3 Scenario 3: Multi-tenant SaaS

*(Code examples same as Chinese version with English comments)*

---

## 附录 | Appendix

### API端点总览 | API Endpoints Overview

| 端点 Endpoint | 方法 Method | 说明 Description |
|--------------|------------|-----------------|
| `/api/metadata/objects` | GET | 获取所有对象列表 |
| `/api/metadata/objects/:name` | GET | 获取对象元数据 |
| `/api/data/:object/query` | POST | 查询记录 |
| `/api/data/:object` | POST | 创建记录 |
| `/api/data/:object/:id` | GET | 获取单条记录 |
| `/api/data/:object/:id` | PATCH | 更新记录 |
| `/api/data/:object/:id` | DELETE | 删除记录 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/logout` | POST | 用户登出 |
| `/api/auth/me` | GET | 获取当前用户 |

### 环境变量配置 | Environment Variables

```bash
# 数据库
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb

# 服务器
PORT=3000
NODE_ENV=development

# 认证
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# 缓存
REDIS_URL=redis://localhost:6379

# 邮件
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

---

<div align="center">
<sub>ObjectStack - Data • Runtime • Views</sub>
</div>
