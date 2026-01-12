# ObjectGridTable - 元数据驱动的 AG Grid 组件

## 概述

`ObjectGridTable` 是一个强大的、元数据驱动的 AG Grid 表格组件，它可以根据 ObjectQL 对象元数据 (`ObjectConfig`) 自动生成列定义和单元格渲染器。这个组件消除了为每个字段类型手动配置列和单元格渲染器的需要。

## 问题描述

原问题：**ag-grid 组件应该调用标准的对象元数据接口，应该识别所有的字段类型，会调用用对应的字段控件来显示**

## 解决方案

创建了 `ObjectGridTable` 组件，它：

1. **接受 ObjectConfig 元数据**：使用标准的 ObjectQL 对象配置
2. **自动识别字段类型**：支持所有 ObjectQL 字段类型
3. **智能渲染**：根据字段类型自动选择合适的单元格渲染器

## 支持的字段类型

| 字段类型 | 渲染方式 | 说明 |
|---------|---------|------|
| `text`, `textarea` | 纯文本 | 基本文本显示 |
| `boolean` | ✓/✗ 图标 | 绿色对勾表示 true，灰色叉表示 false |
| `date` | 📅 格式化日期 | 例如："2026年1月15日" |
| `datetime` | 📅 格式化日期时间 | 例如："2026年1月15日 下午2:30" |
| `number` | 数字格式化 | 右对齐，千位分隔符 |
| `currency` | 货币格式 | $1,234.56 |
| `percent` | 百分比格式 | 75.50% |
| `select` | 徽章显示 | 显示选项标签，带背景色 |
| `lookup` | 关联对象名称 | 显示关联对象的名称或 ID |
| `email` | 可点击邮件链接 | 点击打开邮件客户端 |
| `url` | 可点击外部链接 | 点击在新标签页打开 |

## 使用方法

### 基本用法

```tsx
import { ObjectGridTable } from '@objectos/ui';
import type { ObjectConfig } from '@objectql/types';

// 定义对象元数据
const userConfig: ObjectConfig = {
  name: 'user',
  label: '用户',
  fields: {
    name: {
      name: 'name',
      label: '姓名',
      type: 'text',
      required: true,
    },
    email: {
      name: 'email',
      label: '邮箱',
      type: 'email',
      required: true,
    },
    is_active: {
      name: 'is_active',
      label: '激活状态',
      type: 'boolean',
    },
    created_at: {
      name: 'created_at',
      label: '创建时间',
      type: 'datetime',
    },
  },
};

// 使用组件
function UserList() {
  const [data, setData] = useState([]);

  return (
    <ObjectGridTable
      objectConfig={userConfig}
      data={data}
      height={600}
      pagination={true}
      pageSize={20}
    />
  );
}
```

### 与 ObjectOS API 集成

```tsx
import { EnhancedObjectListView } from '@/components/dashboard/EnhancedObjectListView';

// 在路由/页面组件中使用
<EnhancedObjectListView 
  objectName="task" 
  user={currentUser} 
/>
```

该组件会：
1. 自动从 `/api/metadata/object/{objectName}` 获取元数据
2. 自动从 `/api/data/{objectName}` 获取数据
3. 根据元数据自动配置表格列
4. 根据字段类型自动选择渲染器

## 主要特性

### 1. 自动列生成
- 从 `ObjectConfig.fields` 自动生成列
- 自动设置列宽、对齐方式
- 支持隐藏字段（`hidden: true`）

### 2. 类型感知渲染
- 每种字段类型都有专门的单元格渲染器
- 保持与 ObjectOS Field 组件一致的显示风格
- 支持自定义渲染器覆盖

### 3. 完整的 AG Grid 功能
- 排序、过滤、分页
- 行选择（单选/多选）
- 列可见性控制
- 虚拟滚动（性能优化）

### 4. TypeScript 支持
- 完整的类型定义
- 与 ObjectQL 类型系统集成

## 文件结构

```
packages/ui/src/components/
├── object-grid-table.tsx          # 主组件
└── examples/
    └── ObjectGridTableExample.tsx # 示例代码

packages/ui/
└── OBJECT_GRID_TABLE.md           # 详细文档

docs/
└── OBJECT_GRID_INTEGRATION.md     # 集成指南

apps/web/src/components/dashboard/
└── EnhancedObjectListView.tsx     # 实际应用示例
```

## 组件属性

```typescript
interface ObjectGridTableProps {
  objectConfig: ObjectConfig        // 对象元数据配置（必需）
  data: any[]                       // 行数据（必需）
  height?: string | number          // 表格高度，默认 600
  pagination?: boolean              // 启用分页，默认 true
  pageSize?: number                 // 每页行数，默认 10
  rowSelection?: boolean | 'single' | 'multiple'  // 行选择模式
  onGridReady?: (params: GridReadyEvent) => void
  onCellClicked?: (event: CellClickedEvent) => void
  onSelectionChanged?: (selectedRows: any[]) => void
  additionalColumns?: ColDef[]      // 额外的列定义
}
```

## 实现细节

### 字段类型映射

组件包含 `getCellRendererForFieldType()` 函数，将 ObjectQL 字段类型映射到 AG Grid 单元格渲染器：

```typescript
function getCellRendererForFieldType(fieldType: FieldType) {
  switch (fieldType) {
    case 'boolean':
      return BooleanCellRenderer
    case 'date':
    case 'datetime':
      return DateCellRenderer
    case 'number':
    case 'currency':
    case 'percent':
      return NumberCellRenderer
    // ... 更多类型
  }
}
```

### 列定义生成

`generateColumnDefs()` 函数从 ObjectConfig 生成 AG Grid 列定义：

```typescript
function generateColumnDefs(objectConfig: ObjectConfig): ColDef[] {
  const columnDefs: ColDef[] = []
  
  Object.entries(objectConfig.fields).forEach(([fieldName, fieldConfig]) => {
    if (fieldConfig.hidden) return  // 跳过隐藏字段
    
    const colDef: ColDef = {
      field: fieldName,
      headerName: fieldConfig.label || fieldName,
      sortable: true,
      filter: true,
      cellRenderer: getCellRendererForFieldType(fieldConfig.type),
      // ... 更多配置
    }
    
    columnDefs.push(colDef)
  })
  
  return columnDefs
}
```

## 与现有代码的关系

### 继承自 DataTable/AgGridTable
- 使用相同的 AG Grid 基础设施
- 使用相同的主题和样式
- 保持 UI 一致性

### 集成 Field 组件的概念
- 与 `packages/ui/src/components/fields/Field.tsx` 类似的类型识别逻辑
- 保持显示风格一致性
- 但针对只读表格场景优化

### 符合 ObjectOS 架构
- 遵循"Kernel handles logic, Drivers handle data, Server handles HTTP"原则
- 组件只负责展示，不处理数据逻辑
- 通过 API 获取元数据和数据

## 性能考虑

- **虚拟滚动**：只渲染可见行
- **列定义缓存**：使用 React.useMemo 缓存列定义
- **高效更新**：利用 AG Grid 的变更检测
- **分页支持**：支持客户端和服务端分页

## 未来改进

可能的增强功能：
1. 内联编辑支持
2. 图片/文件字段的缩略图显示
3. 更多自定义渲染器选项
4. 服务端排序/过滤集成
5. 导出功能（CSV/Excel）

## 测试

当前实现包括：
- 构建测试：✅ 通过
- TypeScript 类型检查：✅ 通过
- 示例组件：✅ 已创建

建议后续添加：
- 单元测试（Jest + React Testing Library）
- 集成测试（使用实际 API）
- 端到端测试（Playwright/Cypress）

## 参考文档

- [AG Grid React 文档](https://www.ag-grid.com/react-data-grid/)
- [ObjectQL 类型定义](https://github.com/objectql/objectql)
- [ObjectOS 架构文档](../ARCHITECTURE.md)

## 作者

GitHub Copilot - 2026年1月12日

## 许可证

ObjectOS 项目许可证
