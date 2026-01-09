# Airtable Base Layer Implementation Evaluation

## 执行摘要 (Executive Summary)

本文档评估是否需要在 ObjectQL 中实现类似 Airtable 的 Base 层，以及如何实现。

**核心结论**：建议实现一个**轻量级 Base 层**作为 Organization 和 App/Object 之间的逻辑容器，以提供更好的数据隔离、权限管理和用户体验。

### 关键发现

1. **当前架构缺口**：ObjectQL 缺少 Organization 和 App/Object 之间的中间层
2. **用户需求**：多项目场景下需要逻辑隔离和独立管理
3. **实现成本**：相对较低，主要是元数据层面的组织结构调整
4. **建议方案**：实现轻量级 Base 作为可选功能，保持向后兼容

---

## 一、背景与问题

### 1.1 Airtable 的 Base 概念

在 Airtable 中，数据组织层次为：

```
Workspace (工作区)
  └── Base (数据库/项目)
      ├── Tables (表)
      ├── Views (视图)
      ├── Forms (表单)
      └── Interfaces (界面)
```

**Base 的核心特征**：
- **逻辑隔离单元**：每个 Base 是一个独立的数据空间
- **访问控制边界**：可以对单个 Base 设置协作者和权限
- **模板单位**：Base 可以作为整体被复制、分享或导出为模板
- **项目容器**：一个 Base 通常代表一个完整的项目或业务场景
- **独立设置**：每个 Base 可以有自己的配置、自动化规则等

### 1.2 ObjectQL 当前架构

ObjectQL 当前的组织层次：

```
Organization (组织)
  ├── App (应用界面)
  │   └── Menu Items → Objects
  └── Objects (数据对象)
      └── Fields (字段)
```

**已实现的功能**：
- ✅ **Organization**：通过 better-auth 实现的多租户组织
  - 成员管理 (owner/admin/member)
  - 团队管理
  - 邀请系统
  - 基于角色的访问控制
- ✅ **App**：应用界面层，提供导航菜单和页面组织
  - 自定义菜单结构
  - 链接到 Objects 或自定义页面
  - 主题和图标定制
- ✅ **Object**：数据对象定义
  - 20+ 字段类型
  - 关联关系
  - 权限控制

### 1.3 架构缺口分析

| 场景 | Airtable | ObjectQL (当前) | 问题 |
|------|----------|----------------|------|
| 多项目管理 | 每个 Base 一个项目 | 所有 Objects 在同一命名空间 | 数据混在一起，难以隔离 |
| 权限控制 | Base 级别权限 | Organization 级别权限 | 粒度太粗，无法细分项目访问 |
| 模板复用 | Base 模板 | 无整体模板概念 | 难以复制完整的业务场景 |
| 数据导出 | 按 Base 导出 | 按 Object 导出 | 无法导出完整项目 |
| UI 组织 | Base → Tables | App → Objects | App 和数据逻辑未绑定 |

---

## 二、需求分析

### 2.1 用户场景

#### 场景 1：咨询公司多客户管理
**需求**：一个咨询公司为多个客户服务，每个客户项目需要独立的数据空间。

- **Airtable 方案**：每个客户一个 Base
- **ObjectQL 当前**：所有客户数据共享 Objects，需要通过 filters 隔离
- **痛点**：
  - 数据混在一起，容易误操作
  - 无法为单个客户项目设置独立权限
  - 难以将客户项目作为整体导出或归档

#### 场景 2：软件公司多产品线
**需求**：一个公司有多条产品线，每条产品线有独立的需求、任务、缺陷等数据。

- **Airtable 方案**：每条产品线一个 Base
- **ObjectQL 当前**：通过字段区分产品线
- **痛点**：
  - 产品线之间的数据结构可能不同，但被迫共享 Object 定义
  - 新产品线启动时，无法快速复制模板

#### 场景 3：个人多项目跟踪
**需求**：个人用户管理多个独立项目（家庭装修、旅行计划、投资组合等）。

- **Airtable 方案**：每个项目一个 Base
- **ObjectQL 当前**：所有项目数据在同一空间
- **痛点**：
  - 项目列表界面混乱
  - 无法快速切换项目上下文

### 2.2 功能需求优先级

#### P0 (必须 - 核心价值)
1. **Base 作为数据命名空间**：Objects 属于某个 Base
2. **Base 级别权限控制**：可以为 Base 单独设置协作者
3. **Base 列表与切换**：用户可以查看和切换 Bases

#### P1 (重要 - 完整体验)
1. **Base 模板系统**：从模板创建 Base
2. **Base 设置与元数据**：名称、图标、描述、封面
3. **Base 复制功能**：复制整个 Base（包括结构和数据）
4. **Base 归档与删除**：生命周期管理

#### P2 (增强 - 高级功能)
1. **Base 级别自动化**：Automation 属于 Base
2. **Base 级别 API Keys**：独立的 API 访问控制
3. **Base 导入导出**：整体导入导出 Base
4. **Base 分享链接**：只读或协作分享

#### P3 (可选 - 锦上添花)
1. **Base 使用统计**：记录数、存储大小、API 调用量
2. **Base 版本控制**：快照和回滚
3. **跨 Base 关联**：Links across Bases (慎用)

---

## 三、技术方案设计

### 3.1 方案 A：轻量级 Base（推荐 ⭐）

**核心思想**：Base 是一个**元数据容器**，不改变底层数据存储结构，仅在逻辑层面组织 Objects。

#### 架构调整

```
Organization
  └── Base
      ├── Objects (belongsTo: baseId)
      ├── Apps (belongsTo: baseId)
      └── Members (Base-level permissions)
```

#### 数据模型

**Base Object 定义** (`base.object.yml`)：

```yaml
name: base
label: Base
description: A data workspace container
fields:
  name:
    type: text
    label: Base Name
    required: true
  slug:
    type: text
    label: URL Slug
    unique: true
  description:
    type: textarea
    label: Description
  icon:
    type: text
    label: Icon
    default: ri-database-2-line
  color:
    type: select
    label: Color Theme
    options:
      - blue
      - green
      - purple
      - red
      - gray
  cover:
    type: image
    label: Cover Image
  organizationId:
    type: lookup
    label: Organization
    reference_to: organization
    required: true
  isTemplate:
    type: boolean
    label: Is Template
    default: false
  isArchived:
    type: boolean
    label: Is Archived
    default: false
  settings:
    type: object
    label: Settings
    description: JSON settings (timezone, locale, etc.)
  createdBy:
    type: lookup
    reference_to: user
  createdAt:
    type: datetime
    default: now()
  updatedAt:
    type: datetime
    default: now()
```

**Object 定义调整**：

现有 `ObjectConfig` 类型增加 `baseId` 字段：

```typescript
export interface ObjectConfig {
  name: string;
  label?: string;
  baseId?: string;  // ← 新增：所属 Base
  // ... existing fields
}
```

**App 定义调整**：

```typescript
export interface AppConfig {
  id?: string;
  name: string;
  baseId?: string;  // ← 新增：所属 Base
  // ... existing fields
}
```

#### 实现要点

1. **向后兼容**：
   - `baseId` 是可选字段
   - 如果未指定 `baseId`，对象属于 "默认 Base" 或直接属于 Organization
   - 现有系统无需迁移即可继续运行

2. **数据隔离**：
   - Repository 层自动注入 `baseId` 过滤条件
   - Context 增加 `baseId` 字段：
     ```typescript
     export interface ObjectQLContext {
       userId?: string;
       spaceId?: string;  // Organization ID
       baseId?: string;   // ← 新增：Base ID
       roles: string[];
       // ...
     }
     ```

3. **权限继承**：
   - Base 权限继承 Organization 权限
   - Base 可以有额外的 Members（通过 base_member 关联表）
   - 权限检查顺序：Object → Base → Organization

4. **API 端点**：
   ```
   POST   /api/base/create                    # 创建 Base
   GET    /api/base/list                      # 列出 Bases
   GET    /api/base/:id                       # 获取 Base 详情
   PATCH  /api/base/:id                       # 更新 Base
   DELETE /api/base/:id                       # 删除 Base
   POST   /api/base/:id/duplicate             # 复制 Base
   POST   /api/base/:id/archive               # 归档 Base
   
   # Base Members
   POST   /api/base/:id/members/add           # 添加成员
   DELETE /api/base/:id/members/remove        # 移除成员
   GET    /api/base/:id/members               # 列出成员
   ```

#### 优点
- ✅ **最小改动**：仅增加元数据层，不改变核心查询逻辑
- ✅ **向后兼容**：现有项目无需迁移
- ✅ **快速实现**：约 2-3 周开发周期
- ✅ **灵活可选**：用户可以选择是否使用 Base

#### 缺点
- ⚠️ 需要在多处代码注入 `baseId` 过滤
- ⚠️ 跨 Base 查询需要特殊处理

---

### 3.2 方案 B：完整 Base 隔离

**核心思想**：Base 是一个**物理隔离单元**，每个 Base 有独立的数据库连接或 Schema。

#### 架构调整

```
Organization
  └── Base (Each has isolated datasource/schema)
      ├── Objects (in dedicated namespace)
      └── Apps
```

#### 实现方式

**选项 1：多数据库**
- 每个 Base 使用独立的 MongoDB Database 或 PostgreSQL Schema
- 完全物理隔离

**选项 2：命名空间前缀**
- 表名加上 Base ID 前缀：`base_abc123_projects`
- 在同一数据库内逻辑隔离

#### 优点
- ✅ **完全隔离**：性能和安全性最高
- ✅ **独立备份**：可以单独备份/恢复 Base
- ✅ **无跨 Base 污染**：数据完全独立

#### 缺点
- ❌ **实现复杂**：需要动态创建数据库/Schema
- ❌ **运维负担**：数据库连接数激增
- ❌ **迁移困难**：现有数据迁移复杂
- ❌ **成本高**：开发周期 6-8 周

---

### 3.3 方案对比

| 维度 | 方案 A (轻量级) | 方案 B (完整隔离) |
|------|----------------|------------------|
| **实现复杂度** | 低 | 高 |
| **开发周期** | 2-3 周 | 6-8 周 |
| **数据隔离度** | 逻辑隔离 (Filter) | 物理隔离 (Schema) |
| **向后兼容** | ✅ 完全兼容 | ⚠️ 需要迁移 |
| **性能影响** | 轻微 (额外过滤) | 无 (完全独立) |
| **运维成本** | 低 | 高 (多连接) |
| **适用场景** | 中小型项目 | 大型企业 |
| **推荐度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 四、实施建议

### 4.1 推荐方案：**方案 A（轻量级 Base）**

#### 理由
1. **满足 80% 的用户需求**：大多数用户需要的是逻辑隔离，而非物理隔离
2. **快速上线**：2-3 周即可完成，快速验证市场需求
3. **低风险**：向后兼容，现有用户无感知
4. **可迭代**：未来如果需要，可以逐步演进到方案 B

### 4.2 实施路线图

#### 阶段 1：核心数据模型 (Week 1)
- [ ] 创建 `base.object.yml`
- [ ] 创建 `base_member.object.yml`（Base 级别成员表）
- [ ] 扩展 `ObjectConfig` 和 `AppConfig` 类型
- [ ] 扩展 `ObjectQLContext` 增加 `baseId`

#### 阶段 2：Repository 层集成 (Week 2)
- [ ] Repository 自动注入 `baseId` 过滤
- [ ] 权限检查逻辑增加 Base 层
- [ ] Context 传递 `baseId`

#### 阶段 3：API 端点 (Week 2-3)
- [ ] Base CRUD 端点
- [ ] Base Members 管理端点
- [ ] Base 复制功能

#### 阶段 4：UI 集成 (Week 3)
- [ ] Base 切换器组件
- [ ] Base 设置页面
- [ ] Base 创建向导

#### 阶段 5：文档与测试 (Week 3)
- [ ] API 文档
- [ ] 用户指南
- [ ] 单元测试和集成测试

### 4.3 迁移路径

对于现有用户，提供两种迁移方式：

**选项 1：不迁移（推荐）**
- 现有 Objects 和 Apps 保持 `baseId = null`
- 视为属于 "默认 Base"
- 用户体验不变

**选项 2：自动迁移**
- 为每个 Organization 创建一个 "Default Base"
- 将现有 Objects 和 Apps 关联到该 Base
- 用户可以后续手动重新组织

### 4.4 配置示例

**创建 Base：**

```typescript
const base = await ctx.object('base').insert({
  name: 'Product Roadmap 2024',
  slug: 'product-roadmap-2024',
  organizationId: currentOrgId,
  icon: 'ri-roadmap-line',
  color: 'blue'
});
```

**在 Base 中创建 Object：**

```yaml
# tasks.object.yml
name: tasks
label: Tasks
baseId: ${BASE_ID}  # 或在运行时指定
fields:
  title:
    type: text
    required: true
```

**查询时自动过滤：**

```typescript
// 用户上下文设置了 baseId
const ctx = objectql.getContext({ userId, baseId });

// 自动只查询该 Base 的数据
const tasks = await ctx.object('tasks').find({
  filters: [['status', '=', 'open']]
});
```

---

## 五、风险与挑战

### 5.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| **性能下降** | 中 | 在 `baseId` 字段上建索引；缓存 Base 元数据 |
| **复杂查询** | 中 | 提供跨 Base 查询的 API（需 sudo 权限） |
| **权限冲突** | 低 | 明确权限继承规则；完善测试 |

### 5.2 用户体验风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| **概念混淆** | 中 | 清晰的文档；UI 引导；Base vs App 的区别说明 |
| **迁移困难** | 低 | 提供自动迁移工具；支持不迁移 |

---

## 六、成本估算

### 6.1 开发成本

- **核心开发**：1 名全栈工程师 × 3 周 = 3 人周
- **测试与文档**：0.5 人周
- **总计**：约 3.5 人周

### 6.2 运维成本

- **数据库开销**：新增 2 张表 (`base`, `base_member`)，几乎可忽略
- **代码维护**：低，逻辑清晰

---

## 七、竞品对比

| 产品 | Base/Workspace 概念 | 实现方式 |
|------|-------------------|---------|
| **Airtable** | Base (核心概念) | 物理隔离 |
| **Notion** | Workspace → Database | 逻辑隔离 |
| **NocoDB** | Project | 物理隔离 (Schema) |
| **Baserow** | Database | 逻辑隔离 |
| **ObjectQL (建议)** | Base (可选) | 逻辑隔离 (Filter) |

---

## 八、总结与决策建议

### 8.1 核心建议

✅ **建议实现轻量级 Base 层**

**理由**：
1. 填补了当前架构的关键缺口
2. 提升多项目场景的用户体验
3. 实现成本低，风险可控
4. 向 Airtable 对标迈出重要一步

### 8.2 实施时机

**建议时机**：当前季度或下一个可用冲刺

**前置条件**：
- ✅ 已完成：Organization 和 better-auth 集成
- ✅ 已完成：App 层实现
- ⏳ 建议先完成：基础 UI 优化（Grid View, Form View）

**后续增强**：
- Base 模板市场
- Base 导入导出
- Base 级别自动化

### 8.3 关键成功指标

- **功能完整性**：实现 P0 + P1 功能（80%+ 的 Base 基础功能）
- **性能无退化**：查询性能下降 < 5%
- **用户采用率**：30% 的活跃用户创建多个 Bases（6 个月内）
- **零迁移问题**：现有用户无感知，零投诉

---

## 九、常见问题 (FAQ)

### Q1: Base 和 App 有什么区别？

**A**: 
- **Base**: 数据层的逻辑容器，Objects 属于 Base
  - 功能：数据隔离、权限控制、模板复制
  - 类比：数据库或项目空间
  
- **App**: 界面层的组织结构，提供导航和页面
  - 功能：UI 布局、菜单配置、页面组织
  - 类比：应用界面或视图集合

- **关系**: 一个 Base 可以有多个 Apps（不同的界面视图）
  - 例如：一个 "CRM" Base 可以有 "销售仪表盘" App 和 "客户管理" App

### Q2: 为什么不直接用 Organization 和 App？

**A**: 
- **Organization**: 组织级别，对应公司/团队，太粗粒度
- **Base**: 项目级别，对应具体业务场景，是数据隔离的最佳单位
- **App**: 界面级别，对应不同的视图和工作流，关注 UI 组织

三层结构提供了更好的灵活性：`Organization → Base (项目) → App (界面)`

### Q3: 实现 Base 后，现有的 App 还能用吗？

**A**: 完全可以！
- `baseId` 是可选字段
- 现有 App 如果不设置 `baseId`，行为完全不变
- 可以逐步迁移，也可以永远不迁移

### Q4: 一个 Base 可以有多少个 Tables (Objects)？

**A**: 没有硬性限制，建议：
- 小型项目：5-10 个 Objects
- 中型项目：10-30 个 Objects
- 大型项目：30-50 个 Objects
- 超过 50 个建议拆分成多个 Bases

---

## 九、下一步行动

### 立即行动 (本周)
- [ ] 评审本文档，确定是否实施
- [ ] 如果批准，创建 GitHub Epic Issue
- [ ] 分配开发资源

### 如果批准实施 (Week 1)
- [ ] 创建 `base.object.yml` 定义
- [ ] 设计详细的 API 规范
- [ ] 编写技术设计文档 (TDD)
- [ ] 启动开发

---

## 附录

### A. 相关文档
- [Airtable Evaluation](./AIRTABLE_EVALUATION.md)
- [Organization Implementation](./ORGANIZATION_IMPLEMENTATION_CN.md)
- [Metadata Format Specification](./spec/metadata-format.md)

### B. 参考资料
- [Airtable Bases Documentation](https://support.airtable.com/docs/getting-started-with-airtable-bases)
- [Notion Workspaces vs Databases](https://www.notion.so/help/intro-to-databases)
- [NocoDB Project Structure](https://docs.nocodb.com/)

---

**文档版本**: 1.0  
**创建日期**: 2026-01-09  
**作者**: ObjectQL Core Team  
**状态**: 待审批
