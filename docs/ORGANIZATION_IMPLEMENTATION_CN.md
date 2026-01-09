# 多租户组织管理实现说明

## 概述

本实现按照 Better-Auth 规范为 ObjectQL 添加了多租户组织管理功能。

## 实现内容

### 1. Better-Auth 组织插件集成

**文件:** `packages/server/src/auth/auth.client.ts`

已在 Better-Auth 配置中启用组织插件，包含以下功能：

- **动态访问控制**: 支持细粒度权限管理
- **团队功能**: 支持子组织分组
- **基于角色的访问控制**: 配置了三个默认角色：
  - `owner` (所有者): 对所有组织功能拥有完全访问权限
  - `admin` (管理员): 对成员、邀请和组织更新具有管理访问权限
  - `member` (成员): 对组织和成员具有只读访问权限

### 2. 对象模式定义

**位置:** `packages/better-auth/src/*.object.yml`

提供了7个对象模式，与 Better-Auth 的数据库模式保持一致：

1. **user.object.yml** - 具有认证字段的系统用户
2. **account.object.yml** - 外部认证提供商 (OAuth)
3. **session.object.yml** - 带令牌管理的用户会话
4. **verification.object.yml** - 邮箱/手机验证令牌
5. **organization.object.yml** - 多租户组织
6. **member.object.yml** - 具有角色的组织成员
7. **invitation.object.yml** - 具有过期时间的组织邀请

### 3. 包导出

**文件:** `packages/better-auth/src/index.ts`

该包现在导出：
- `BetterAuthPackage` - 包元数据
- `objectDefinitions` - 所有对象定义文件列表
- `getObjectDefinitionPath(filename)` - 获取特定对象定义的路径
- `getAllObjectDefinitionPaths()` - 获取所有对象定义的路径

### 4. API 端点

所有组织管理端点通过 Better-Auth 在 `/api/auth/` 自动公开：

#### 组织管理 (10个端点)
- `POST /api/auth/organization/create` - 创建组织
- `POST /api/auth/organization/update` - 更新组织
- `DELETE /api/auth/organization/delete` - 删除组织
- `POST /api/auth/organization/set-active` - 设置活动组织
- `GET /api/auth/organization/get-full` - 获取完整组织详情
- `GET /api/auth/organization/list` - 列出用户的组织
- `GET /api/auth/organization/check-slug` - 检查标识可用性

#### 成员管理 (8个端点)
- `POST /api/auth/organization/add-member` - 添加成员
- `DELETE /api/auth/organization/remove-member` - 移除成员
- `POST /api/auth/organization/update-member-role` - 更新成员角色
- `GET /api/auth/organization/list-members` - 列出成员
- `GET /api/auth/organization/get-active-member` - 获取当前成员
- `GET /api/auth/organization/get-active-member-role` - 获取成员角色
- `POST /api/auth/organization/leave` - 离开组织

#### 邀请管理 (7个端点)
- `POST /api/auth/organization/invitation/create` - 创建邀请
- `POST /api/auth/organization/invitation/cancel` - 取消邀请
- `POST /api/auth/organization/invitation/accept` - 接受邀请
- `POST /api/auth/organization/invitation/reject` - 拒绝邀请
- `GET /api/auth/organization/invitation/get` - 获取邀请详情
- `GET /api/auth/organization/invitation/list` - 列出组织邀请
- `GET /api/auth/organization/invitation/list-user` - 列出用户邀请

#### 团队管理 (10个端点)
- `POST /api/auth/organization/team/create` - 创建团队
- `POST /api/auth/organization/team/update` - 更新团队
- `DELETE /api/auth/organization/team/remove` - 删除团队
- `POST /api/auth/organization/team/set-active` - 设置活动团队
- `GET /api/auth/organization/team/list` - 列出组织团队
- `GET /api/auth/organization/team/list-user` - 列出用户团队
- `GET /api/auth/organization/team/list-members` - 列出团队成员
- `POST /api/auth/organization/team/add-member` - 添加团队成员
- `DELETE /api/auth/organization/team/remove-member` - 移除团队成员

#### 访问控制 (5个端点)
- `POST /api/auth/organization/role/create` - 创建自定义角色
- `POST /api/auth/organization/role/update` - 更新角色
- `DELETE /api/auth/organization/role/delete` - 删除角色
- `GET /api/auth/organization/role/list` - 列出角色
- `GET /api/auth/organization/role/get` - 获取角色详情
- `POST /api/auth/organization/has-permission` - 检查权限

**总计：36个组织管理端点**

## 基于角色的访问控制

### 权限模型

使用 Better-Auth 访问控制插件的 `role()` 函数定义角色：

```typescript
import { role } from "better-auth/plugins/access";

const ownerRole = role({
  organization: ['create', 'read', 'update', 'delete'],
  member: ['create', 'read', 'update', 'delete'],
  invitation: ['create', 'read', 'delete'],
  team: ['create', 'read', 'update', 'delete']
});
```

### 默认角色

1. **Owner (所有者)**
   - 对所有组织资源的完全访问权限
   - 可以管理组织设置、成员、邀请和团队
   - 操作：创建、读取、更新、删除

2. **Admin (管理员)**
   - 可以更新组织设置
   - 完全的成员和邀请管理权限
   - 可以管理团队
   - 不能删除组织

3. **Member (成员)**
   - 对组织和成员的只读访问权限
   - 可以查看团队
   - 不能修改任何内容

## 数据库模式

组织插件自动创建以下数据库表：

- `organization` - 组织详情
- `member` - 组织成员关系
- `invitation` - 待处理的邀请
- `team` - 组织团队 (如果启用)
- `teamMember` - 团队成员关系 (如果启用)
- `organizationRole` - 自定义角色 (如果启用动态访问控制)

这些表与 Better-Auth 的核心表（user、account、session、verification）集成。

## 测试与验证

在 `packages/server/scripts/` 中提供了两个验证脚本：

1. **verify-organization-plugin.js** - 快速验证插件是否已加载
2. **inspect-organization.js** - 详细检查所有端点和插件配置

构建后运行：
```bash
cd packages/server
npm run build
node scripts/verify-organization-plugin.js
node scripts/inspect-organization.js
```

## 文档

完整文档位于：
- `packages/better-auth/README.md` - 完整的 API 参考和使用指南
- `docs/ORGANIZATION_IMPLEMENTATION.md` - 详细的实现指南（英文）

## 安全考虑

✅ **安全扫描通过**: CodeQL 未检测到漏洞
✅ **代码审查**: 仅对测试脚本有小建议，生产代码干净
✅ **TypeScript**: 所有代码完全类型化且类型安全
✅ **Better-Auth**: 使用官方库，内置安全最佳实践

## 下一步

要使用此实现：

1. 设置 PostgreSQL 数据库
2. 配置 `DATABASE_URL` 环境变量
3. Better-Auth 将在首次使用时自动创建必要的表
4. 使用组织端点管理多租户操作

## 参考资料

- [Better-Auth 文档](https://better-auth.com)
- [Better-Auth 组织插件](https://better-auth.com/docs/plugins/organization)
- [ObjectQL 文档](https://github.com/objectql/objectql)
