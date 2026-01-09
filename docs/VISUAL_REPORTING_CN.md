# ObjectQL 可视化多表联查报表系统

## 概述

参考 Salesforce 和其他低代码平台，ObjectQL 现已实现可视化多表联查报表功能，帮助用户通过图形界面定义复杂的数据报表，无需编写代码。

## 核心特性

### 1. 可视化报表构建器

类似于 Salesforce Reports，用户可以通过拖拽方式构建报表：

- **对象选择**：选择主查询对象（如任务、项目、客户）
- **字段选择器**：选择要显示的字段，支持关联对象字段（如 `project.name`, `project.owner`）
- **关系路径可视化**：自动显示表之间的关联路径
- **过滤器构建器**：可视化配置查询条件
- **分组配置**：支持多级分组和小计
- **实时预览**：边编辑边预览报表结果

### 2. 三种报表类型

#### 列表报表 (Tabular)
简单的列表视图，适合显示详细记录。

**使用场景**：
- 任务列表（含项目和负责人信息）
- 客户联系人列表
- 订单明细

#### 汇总报表 (Summary)
支持分组和聚合计算的报表。

**使用场景**：
- 按项目和状态统计任务数量
- 按地区统计销售额
- 按部门统计预算使用情况

#### 矩阵报表 (Matrix)
交叉表格式，两个维度的数据透视。

**使用场景**：
- 按月份和地区的销售数据
- 按负责人和状态的任务分布
- 按部门和季度的预算分配

### 3. 多表关联查询能力

ObjectQL 报表可以跨多个关联对象查询数据：

```yaml
# 示例：任务报表，包含项目和项目负责人信息
columns:
  - field: name              # 任务名称（主对象）
    label: 任务名称
  - field: project.name      # 项目名称（关联对象）
    label: 项目
  - field: project.owner     # 项目负责人（嵌套关联）
    label: 项目负责人
```

**支持的关联路径**：
```
任务 → 项目 → 负责人（用户）
任务 → 分配人（用户） → 经理（用户）
订单 → 客户 → 客户经理 → 部门
```

## 实现方案

### 后端架构

#### 1. 报表元数据定义

报表使用 YAML 格式定义（`.report.yml`），包含：

```yaml
name: tasks_by_project        # 报表唯一标识
label: 项目任务统计            # 显示名称
type: summary                  # 报表类型
object: tasks                  # 主查询对象

columns:                       # 列定义
  - field: project.name
    label: 项目名称
  - field: priority
    label: 优先级

groupings:                     # 分组配置
  - field: project.name
    sort: asc

aggregations:                  # 聚合计算
  - field: id
    function: count
    label: 任务数量
```

#### 2. 报表查询编译器

将报表定义编译为 ObjectQL 统一查询格式：

```typescript
// 报表编译器
class ReportCompiler {
  compile(report: ReportDefinition): UnifiedQuery {
    // 提取字段和关联关系
    // 构建 expand 结构实现多表 JOIN
    // 处理分组和聚合
    return query;
  }
}
```

**编译示例**：
```typescript
// 报表定义
{
  object: 'tasks',
  columns: [
    { field: 'name' },
    { field: 'project.name' },
    { field: 'project.owner' }
  ]
}

// 编译为 ObjectQL 查询
{
  object: 'tasks',
  fields: ['name'],
  expand: {
    project: {
      fields: ['name', 'owner']
    }
  }
}
```

### 前端组件

#### 1. 报表构建器 (ReportBuilder)

可视化编辑界面，包含：

- **头部区域**：报表名称、描述、类型选择
- **左侧面板**：对象和字段选择器
- **中间画布**：配置区（列、过滤器、分组、图表）
- **右侧预览**：实时预览报表结果

```tsx
<ReportBuilder
  initialReport={report}
  availableObjects={['tasks', 'projects', 'users']}
  onSave={handleSave}
  onPreview={handlePreview}
/>
```

#### 2. 报表查看器 (ReportViewer)

显示报表执行结果：

```tsx
<ReportViewer
  report={reportDefinition}
  data={reportData}
  onRefresh={handleRefresh}
  onExport={handleExport}  // 支持导出 CSV/Excel/PDF
/>
```

#### 3. 关系路径选择器

可视化显示和选择关联路径：

```
任务 (tasks)
  └─ 项目 (project) [lookup]
      ├─ 名称 (name)
      └─ 负责人 (owner) [lookup]
          └─ 姓名 (name)
```

## 使用示例

### 示例 1：活动任务列表

```yaml
# reports/active_tasks.report.yml
name: active_tasks
label: 活动任务
type: tabular
object: tasks

columns:
  - field: name
    label: 任务名称
  - field: project.name
    label: 项目
  - field: project.owner
    label: 项目负责人
  - field: assigned_to
    label: 分配给
  - field: priority
    label: 优先级
  - field: due_date
    label: 截止日期

filters:
  - - completed
    - "="
    - false

sort:
  - - due_date
    - asc
```

### 示例 2：项目任务汇总

```yaml
# reports/tasks_summary.report.yml
name: tasks_by_project_priority
label: 项目任务统计（按优先级）
type: summary
object: tasks

columns:
  - field: project.name
    label: 项目
  - field: priority
    label: 优先级

groupings:
  - field: project.name
    sort: asc
  - field: priority
    sort: desc

aggregations:
  - field: id
    function: count
    label: 任务数量
  - field: estimated_hours
    function: sum
    label: 预估工时合计

chart:
  type: bar
  groupBy: priority
  measure: id
  aggregation: count
  title: 各优先级任务分布
```

### 示例 3：任务分布矩阵

```yaml
# reports/task_matrix.report.yml
name: task_matrix
label: 任务分布矩阵
type: matrix
object: tasks

matrix:
  rowGrouping:
    field: project.name
    label: 项目
  columnGrouping:
    field: priority
    label: 优先级
  measure:
    field: id
    function: count
    label: 任务数量
```

## 与 Salesforce Reports 的对比

| 功能 | Salesforce Reports | ObjectQL Reports |
|------|-------------------|------------------|
| 可视化构建器 | ✅ | ✅ |
| 多表关联 | ✅ (最多 4 层) | ✅ (最多 3-4 层) |
| 报表类型 | 列表、汇总、矩阵、连接 | 列表、汇总、矩阵 |
| 分组聚合 | ✅ | ✅ |
| 过滤器 | ✅ | ✅ |
| 图表 | ✅ | ✅ |
| 导出 | CSV, Excel, PDF | CSV, Excel, PDF (规划中) |
| 权限控制 | ✅ | ✅ (规划中) |
| 定时报表 | ✅ | 规划中 |

## 技术优势

### 1. JSON-DSL 架构
- 报表定义即代码，易于版本控制
- 支持通过 API 动态生成报表
- AI 友好的结构化数据

### 2. 数据库无关
- 同一报表定义可在 MongoDB 和 PostgreSQL 上运行
- 驱动层自动优化为原生查询（MongoDB Aggregation 或 SQL JOIN）

### 3. 关系路径自动解析
- 自动识别 `lookup` 字段类型
- 智能构建 `expand` 结构
- 支持嵌套关联（如 `project.owner.manager.name`）

### 4. 性能优化
- 字段级别的选择性查询
- 索引提示
- 分页支持
- 查询缓存（规划中）

## 实现文件清单

### 后端
- `packages/metadata/src/report-types.ts` - 报表类型定义
- `packages/core/src/report-compiler.ts` - 报表查询编译器

### 前端组件
- `packages/ui/src/components/report/ReportBuilder.tsx` - 报表构建器
- `packages/ui/src/components/report/ReportViewer.tsx` - 报表查看器

### 示例
- `examples/project-management/src/reports/active_tasks.report.yml`
- `examples/project-management/src/reports/tasks_by_project_priority.report.yml`
- `examples/project-management/src/reports/task_matrix.report.yml`
- `packages/ui/examples/report-example.tsx` - 完整示例应用

### 文档
- `docs/guide/visual-reporting.md` - 详细使用指南（英文）
- `docs/VISUAL_REPORTING_CN.md` - 本文档（中文）

## 后续计划

### 短期（1-2 个月）
- [ ] 完善过滤器构建 UI
- [ ] 实现分组配置界面
- [ ] 添加图表配置
- [ ] 实现报表保存和加载
- [ ] API 端点集成

### 中期（3-6 个月）
- [ ] 高级关系路径选择器
- [ ] 计算字段支持
- [ ] 报表权限控制
- [ ] 导出功能（CSV, Excel, PDF）
- [ ] 报表调度（定时生成）

### 长期（6-12 个月）
- [ ] 报表仪表板
- [ ] 报表模板市场
- [ ] 协作功能（分享、评论）
- [ ] 报表版本控制
- [ ] AI 辅助报表生成

## 总结

ObjectQL 的可视化多表联查报表系统参考了 Salesforce 等成熟低代码平台的设计理念，提供了：

1. **直观的可视化构建器**：用户无需编写代码即可创建复杂报表
2. **强大的多表关联能力**：支持跨对象查询，自动处理 JOIN 逻辑
3. **灵活的报表类型**：列表、汇总、矩阵三种类型满足不同需求
4. **声明式配置**：YAML 格式的报表定义，易于管理和版本控制
5. **数据库无关性**：同一报表可在不同数据库上运行

该系统为 ObjectQL 平台提供了企业级的报表分析能力，使其更适合作为低代码应用的数据层基础设施。
