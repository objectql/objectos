# Better-Auth 深度集成计划 - ObjectOS 项目

> **文档版本**: 1.0.0  
> **日期**: 2026年2月3日  
> **状态**: 评估完成 - 准备实施
> **作者**: ObjectOS 首席架构师

---

## 📋 执行摘要

本文档提供了将 better-auth 作为统一身份验证和授权服务深度集成到整个 ObjectOS 项目的完整计划。该计划评估了当前实现状况,识别了与 @objectstack/spec 规范要求之间的差距,并概述了用于生产部署的完整开发路线图。

### 核心发现

1. **✅ 基础已就位**: `@objectos/plugin-better-auth` 插件已实现核心生命周期
2. **⚠️ 部分集成**: better-auth 仅部分集成; @objectos/plugin-server 仍有重复的认证代码
3. **❌ 规范差距**: 多个 @objectstack/spec 身份验证和安全要求尚未完全实现
4. **🎯  明确路径**: 清晰的迁移路径,最小化破坏性变更

### 成功指标

- [ ] 100% 的身份验证流程使用 better-auth
- [ ] 所有 @objectstack/spec 认证/安全要求已实现
- [ ] 跨软件包零重复认证代码
- [ ] 认证流程测试覆盖率 90%+
- [ ] 完整的 API 文档
- [ ] 生产部署指南

---

## 🔍 当前状态分析

### 软件包清单

| 软件包 | 认证实现 | 状态 | 备注 |
|---------|---------|------|------|
| **@objectos/plugin-better-auth** | better-auth 插件 | ✅ 完成 | v0.1.0, 功能完整 |
| **@objectos/plugin-server** | 重复的认证代码 | ⚠️ 需要迁移 | 有自己的 auth.controller.ts, auth.middleware.ts |
| **@objectos/plugin-permissions** | 仅权限类型 | ⚠️ 不完整 | 只导出类型,无运行时强制执行 |
| **@objectos/plugin-audit-log** | 无认证集成 | ⚠️ 需要集成 | 应记录认证事件 |
| **@objectstack/runtime** | 无认证支持 | ⚠️ 需要增强 | PluginContext 中缺少认证上下文 |
| **@objectos/kernel** (已弃用) | 完整认证系统 | ⛔ 已弃用 | 不应增强 |
| **@objectos/server** (已弃用) | 完整认证系统 | ⛔ 已弃用 | 不应增强 |

### Better-Auth 插件功能

**已实现:**
- ✅ 邮箱/密码认证
- ✅ 组织管理(多租户)
- ✅ 团队管理
- ✅ 基于角色的访问控制(所有者、管理员、用户)
- ✅ 多数据库支持(PostgreSQL、MongoDB、SQLite)
- ✅ 首个用户自动提升为 super_admin
- ✅ 插件生命周期(init、start、destroy)
- ✅ 路由注册在 `/api/auth/*`

**缺失:**
- ❌ OAuth2/OIDC 提供商(Google、GitHub等)
- ❌ 双因素认证(2FA)
- ❌ 会话管理 UI
- ❌ 密码重置流程
- ❌ 邮箱验证
- ❌ API 密钥认证
- ❌ 速率限制
- ❌ 暴力破解保护

### @objectstack/spec 合规性矩阵

#### 认证要求

| 要求 | 规范引用 | 当前状态 | 差距 |
|------|---------|---------|------|
| **用户认证** | System.User | ✅ 已实现 | better-auth 处理 |
| **会话管理** | System.Session | ✅ 已实现 | better-auth 处理 |
| **基于令牌的认证** | API.Authentication | ✅ 已实现 | 通过 better-auth 的 JWT |
| **OAuth2/OIDC** | API.Authentication | ❌ 缺失 | 需要 better-auth 插件 |
| **API 密钥认证** | API.Authentication | ❌ 缺失 | 需要自定义实现 |
| **多因素认证** | System.Security | ❌ 缺失 | 需要 better-auth 插件 |

#### 授权要求

| 要求 | 规范引用 | 当前状态 | 差距 |
|------|---------|---------|------|
| **基于角色的访问控制(RBAC)** | System.Permission | ⚠️ 部分 | better-auth 有组织角色,需要系统级 RBAC |
| **对象权限** | Data.PermissionSet | ⚠️ 部分 | Kernel 有,需要插件 |
| **字段级安全** | Data.Field.permissions | ⚠️ 部分 | Kernel 有,需要插件 |
| **记录级安全(RLS)** | Data.Hook.recordLevelSecurity | ❌ 缺失 | 需要实现 |
| **权限集** | System.PermissionSet | ❌ 缺失 | 需要实现 |
| **共享规则** | System.SharingRule | ❌ 缺失 | 需要实现 |

#### 安全要求

| 要求 | 规范引用 | 当前状态 | 差距 |
|------|---------|---------|------|
| **审计日志** | System.AuditEvent | ✅ 已实现 | @objectos/plugin-audit-log |
| **CORS 配置** | API.Security | ⚠️ 部分 | 在 better-auth 配置中,需要系统级 |
| **速率限制** | API.Security | ❌ 缺失 | 需要实现 |
| **XSS 保护** | API.Security | ❌ 缺失 | 需要头部中间件 |
| **CSRF 保护** | API.Security | ❌ 缺失 | 需要令牌 |
| **SQL 注入防护** | Data.Security | ✅ 已实现 | 驱动级参数化 |

### 重复代码分析

**具有重复认证逻辑的文件:**

1. **packages/plugins/server/src/auth/**
   - `auth.controller.ts` - 重复 better-auth 处理器
   - `auth.middleware.ts` - 自定义中间件(应使用 better-auth 会话)
   - `auth.client.ts` - 重复 better-auth 客户端初始化
   - `auth.module.ts` - 模块配置

2. **packages/kernel/src/permissions/** (已弃用但仍被引用)
   - `permission-set-loader.ts`
   - `permission-manager.ts`
   - `object-permissions.ts`
   - `field-permissions.ts`

**估计重复代码行数**: 约 1,500 行

---

## 🎯 集成架构

### 目标架构

```
┌─────────────────────────────────────────────────────────────┐
│                    @objectstack/runtime                      │
│  • 增强的 PluginContext 与认证助手                           │
│  • 安全钩子 (beforeAuth, afterAuth, onUnauthorized)         │
│  • 用户上下文传播                                            │
└──────────────┬──────────────────────────────────────────────┘
               │
       ┌───────┴────────┬────────────┬──────────┬─────────────┐
       │                │            │          │             │
┌──────▼─────────┐ ┌───▼────┐ ┌────▼────┐ ┌───▼─────┐ ┌─────▼──────┐
│ Better-Auth    │ │ 权限   │ │ 审计    │ │ 服务器  │ │ 其他       │
│ 插件           │ │ 插件   │ │ 日志    │ │ 插件    │ │ 插件       │
│                │ │        │ │ 插件    │ │         │ │            │
│ • 认证/会话    │ │ • RBAC │ │ • 跟踪  │ │ • API   │ │            │
│ • 组织/团队    │ │ • RLS  │ │ • 审计  │ │ • HTTP  │ │            │
└────────────────┘ └────────┘ └─────────┘ └─────────┘ └────────────┘
```

---

## 📐 实施阶段

### 第 1 阶段: Runtime 增强 (第 1-2 周)

**目标**: 增强 @objectstack/runtime 以支持认证上下文

**主要任务:**
- 在 PluginContext 中添加 AuthContext 接口
- 实现安全生命周期钩子
- 更新类型定义
- 编写单元测试(10+ 个测试)

**可交付成果:**
- ✅ 增强的 PluginContext 与 AuthContext
- ✅ 内核中的安全钩子
- ✅ 更新的类型定义
- ✅ 单元测试
- ✅ 更新的文档

---

### 第 2 阶段: Better-Auth 插件增强 (第 2-3 周)

**目标**: 使用缺失功能和运行时集成增强 better-auth 插件

**主要任务:**
- 添加 OAuth2/OIDC 支持(Google、GitHub)
- 实现双因素认证(2FA)
- 与运行时上下文集成
- 添加会话助手

**可交付成果:**
- ✅ OAuth2/OIDC 支持
- ✅ 双因素认证
- ✅ 运行时上下文集成
- ✅ 会话助手
- ✅ 单元测试(15+ 个测试)
- ✅ 集成测试(5+ 个测试)

---

### 第 3 阶段: 权限插件实现 (第 3-5 周)

**目标**: 为 RBAC、RLS 和字段级安全创建综合权限插件

**主要任务:**
- 实现权限插件核心
- 权限集加载器
- RBAC 强制执行
- 对象级权限
- 字段级安全
- 权限缓存

**可交付成果:**
- ✅ PermissionsPlugin 实现
- ✅ 权限集加载器
- ✅ RBAC 强制执行
- ✅ 对象级权限
- ✅ 字段级安全
- ✅ 权限缓存
- ✅ 单元测试(20+ 个测试)
- ✅ 集成测试(10+ 个测试)
- ✅ YAML 架构文档

---

### 第 4 阶段: 服务器插件迁移 (第 5-6 周)

**目标**: 迁移 @objectos/plugin-server 以专门使用 better-auth 插件

**主要任务:**
- 删除重复的认证代码
- 更新中间件以使用 better-auth
- 更新模块配置
- 更新测试

**可交付成果:**
- ✅ 删除重复的认证代码
- ✅ 更新中间件以使用 better-auth
- ✅ 更新模块配置
- ✅ 更新测试
- ✅ 开发者迁移指南

---

### 第 5 阶段: 审计日志集成 (第 6-7 周)

**目标**: 将审计日志插件与认证事件集成

**主要任务:**
- 实现认证事件日志记录
- 与审计日志插件集成
- 事件架构文档

**可交付成果:**
- ✅ 认证事件日志记录
- ✅ 与审计日志插件集成
- ✅ 事件架构文档
- ✅ 测试

---

### 第 6 阶段: API 增强 (第 7-8 周)

**目标**: 添加缺失的 API 端点和安全功能

**主要任务:**
- 权限检查 API 端点
- 速率限制中间件
- 安全头中间件
- CSRF 保护(可选)

**可交付成果:**
- ✅ 权限检查 API 端点
- ✅ 速率限制中间件
- ✅ 安全头中间件
- ✅ CSRF 保护(可选)
- ✅ API 文档
- ✅ 测试

---

### 第 7 阶段: 测试与文档 (第 8-9 周)

**目标**: 全面测试和文档

**测试覆盖目标:**

| 组件 | 目标覆盖率 | 测试类型 |
|------|-----------|---------|
| Better-Auth 插件 | 90%+ | 单元 + 集成 |
| 权限插件 | 90%+ | 单元 + 集成 |
| 服务器插件认证 | 85%+ | 单元 + E2E |
| Runtime 认证上下文 | 90%+ | 单元 |
| API 端点 | 85%+ | E2E |

**文档可交付成果:**
1. 认证指南
2. 授权指南
3. 安全指南
4. API 参考
5. 迁移指南

---

### 第 8 阶段: 生产部署 (第 9-10 周)

**目标**: 生产就绪部署

**部署清单:**
- [ ] 环境变量配置
- [ ] 数据库迁移脚本
- [ ] Docker 镜像
- [ ] Kubernetes 清单(可选)
- [ ] 健康检查端点
- [ ] 监控集成
- [ ] 备份策略
- [ ] 灾难恢复计划

**性能优化:**
- [ ] 权限缓存实现
- [ ] 会话缓存(Redis)
- [ ] 数据库查询优化
- [ ] 连接池
- [ ] 响应压缩

**安全加固:**
- [ ] 密钥管理(HashiCorp Vault / AWS Secrets Manager)
- [ ] SSL/TLS 配置
- [ ] 安全头
- [ ] 渗透测试
- [ ] 漏洞扫描
- [ ] 安全审计

---

## 📊 成功指标

### 功能指标

- [ ] 100% 的认证流程使用 better-auth
- [ ] 所有 @objectstack/spec 认证要求已实现
- [ ] 零重复认证代码
- [ ] 认证/授权代码测试覆盖率 90%+
- [ ] 所有已弃用的包从依赖项中删除

### 性能指标

- [ ] 认证响应时间 < 100ms (p95)
- [ ] 权限检查延迟 < 50ms (p95)
- [ ] 会话查找 < 10ms (使用缓存)
- [ ] API 吞吐量 > 1000 req/s

### 安全指标

- [ ] 零关键漏洞
- [ ] 所有 OWASP Top 10 缓解措施就位
- [ ] 渗透测试通过
- [ ] 安全审计通过

---

## 📅 时间线摘要

| 阶段 | 持续时间 | 开始 | 结束 | 可交付成果 |
|------|----------|------|------|------------|
| 第 1 阶段: Runtime 增强 | 2 周 | 第 1 周 | 第 2 周 | 增强的 PluginContext |
| 第 2 阶段: Better-Auth 增强 | 1 周 | 第 2 周 | 第 3 周 | OAuth、2FA |
| 第 3 阶段: 权限插件 | 2 周 | 第 3 周 | 第 5 周 | RBAC、RLS |
| 第 4 阶段: 服务器迁移 | 1 周 | 第 5 周 | 第 6 周 | 删除重复项 |
| 第 5 阶段: 审计集成 | 1 周 | 第 6 周 | 第 7 周 | 事件日志记录 |
| 第 6 阶段: API 增强 | 1 周 | 第 7 周 | 第 8 周 | 新端点 |
| 第 7 阶段: 测试与文档 | 1 周 | 第 8 周 | 第 9 周 | 完整文档 |
| 第 8 阶段: 生产 | 1 周 | 第 9 周 | 第 10 周 | 部署 |

**总持续时间**: 10 周

---

## ✅ 下一步行动

### 立即行动(本周)

1. **审查与批准计划**
   - 与团队进行技术审查
   - 利益相关者批准
   - 资源分配

2. **设置开发环境**
   - 克隆存储库
   - 安装依赖
   - 配置测试数据库

3. **开始第 1 阶段**
   - 创建功能分支
   - 增强 PluginContext 类型
   - 添加安全钩子
   - 编写初始测试

### 第 2 周行动

1. **完成第 1 阶段**
   - 完成运行时增强
   - 代码审查
   - 合并到主分支

2. **开始第 2 阶段**
   - 添加 OAuth 支持
   - 实现 2FA
   - 运行时集成

---

## 📝 附录

### 附录 A: 环境变量

```bash
# Better-Auth 配置
BETTER_AUTH_URL=http://localhost:3000/api/auth
BETTER_AUTH_SECRET=your-secret-key-here

# OAuth 提供商
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# 数据库
OBJECTQL_DATABASE_URL=postgres://user:pass@localhost:5432/objectos

# 会话
SESSION_SECRET=your-session-secret
SESSION_TIMEOUT=3600000

# 安全
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 附录 B: API 端点摘要

#### 认证端点(通过 better-auth)

- `POST /api/auth/sign-up` - 用户注册
- `POST /api/auth/sign-in/email` - 邮箱/密码登录
- `POST /api/auth/sign-in/google` - Google OAuth 登录
- `POST /api/auth/sign-in/github` - GitHub OAuth 登录
- `POST /api/auth/sign-out` - 登出
- `GET /api/auth/get-session` - 获取当前会话
- `POST /api/auth/verify-email` - 验证邮箱地址
- `POST /api/auth/forgot-password` - 请求密码重置
- `POST /api/auth/reset-password` - 重置密码
- `POST /api/auth/two-factor/verify` - 验证 2FA 代码
- `POST /api/auth/two-factor/enable` - 启用 2FA
- `POST /api/auth/two-factor/disable` - 禁用 2FA

#### 权限端点(新)

- `POST /api/permissions/check` - 检查单个权限
- `POST /api/permissions/check-batch` - 检查多个权限
- `GET /api/permissions/my-permissions` - 获取当前用户的权限
- `GET /api/permissions/roles` - 列出可用角色
- `GET /api/permissions/role/:roleName` - 获取角色权限

---

## 📚 参考资料

1. [Better-Auth 文档](https://www.better-auth.com/docs)
2. [@objectstack/spec 协议](https://github.com/objectstack-ai/spec)
3. [ObjectOS 架构](./ARCHITECTURE.md)
4. [规范系统开发计划](./SPEC_SYSTEM_DEVELOPMENT_PLAN.md)
5. [NestJS 文档](https://docs.nestjs.com/)

---

**文档状态**: ✅ 准备实施  
**最后更新**: 2026年2月3日  
**下次审查**: 第 1 阶段结束(第 2 周)
