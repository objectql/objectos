# AG Grid 迁移指南 (中文版)

## 概述

我们已成功将前端表格组件从 TanStack Table 迁移到 AG Grid (v35.0.0)。AG Grid 提供企业级功能，具有更好的性能和开箱即用的全面功能。

## 变更内容

### 之前 (TanStack Table)
- 需要手动实现分页、排序、过滤
- 使用 @dnd-kit 库进行自定义拖放
- 内置功能有限
- 需要更多样板代码

### 之后 (AG Grid)
- 内置分页、排序、过滤
- 原生行拖动和列调整大小
- 高级功能如行分组、聚合（企业版可用）
- 更少的代码，更多的功能

## 已实现的功能

### ✅ 核心功能

1. **行选择**
   - 基于复选框的多行选择
   - 标题复选框用于全选/取消全选
   - 使用我们的 UI 组件的自定义复选框渲染器

2. **排序**
   - 点击列标题进行排序
   - 支持多列排序
   - 自定义排序指示器

3. **过滤**
   - 内置列过滤器
   - 快速过滤（跨所有列搜索）
   - 自定义过滤器 UI 集成

4. **分页**
   - 自定义分页控件（隐藏 AG Grid 默认值）
   - 可配置页面大小（10、20、30、40、50）
   - 首页/上一页/下一页/末页导航

5. **拖放**
   - 通过拖动手柄重新排序行
   - 拖动期间的视觉反馈
   - 由 AG Grid 内部管理

6. **列管理**
   - 列可见性切换
   - 列大小调整
   - 需要时固定列宽

7. **自定义单元格渲染器**
   - 带图标的状态徽章
   - 可编辑输入单元格
   - 下拉选择器
   - 操作菜单
   - 可点击链接

8. **主题集成**
   - 与 ObjectOS 设计系统匹配的自定义 CSS 主题
   - 通过 `ag-theme-alpine-dark` 支持深色模式
   - Tailwind CSS 变量集成

## 使用方法

### 基本 DataTable 组件

```tsx
import { DataTable, schema } from '@objectos/ui';
import { z } from 'zod';

const sampleData: z.infer<typeof schema>[] = [
  {
    id: 1,
    header: "示例",
    type: "类型",
    status: "完成",
    target: "10",
    limit: "15",
    reviewer: "张三",
  },
  // ... 更多行
];

function MyComponent() {
  return <DataTable data={sampleData} />;
}
```

### 自定义 AG Grid 表格

```tsx
import { AgGridTable } from '@objectos/ui';
// 使用相同的 schema 和数据
```

## 文件结构

```
packages/ui/src/
├── components/
│   ├── data-table.tsx          # 主 DataTable 组件 (AG Grid)
│   ├── ag-grid-table.tsx       # 备用导出名称
│   └── data-table-old.tsx      # TanStack 实现的备份
├── styles/
│   └── ag-grid-theme.css       # 自定义 AG Grid 主题
└── styles.css                   # 导入 AG Grid 主题
```

## 主题定制

AG Grid 主题在 `packages/ui/src/styles/ag-grid-theme.css` 中定制，以匹配 ObjectOS 设计系统：

```css
.ag-theme-alpine-dark {
  --ag-background-color: hsl(var(--background));
  --ag-foreground-color: hsl(var(--foreground));
  --ag-header-background-color: hsl(var(--muted));
  /* ... 更多变量 */
}
```

## 高级功能（可用）

AG Grid v35 提供许多可以启用的高级功能：

### 1. 服务器端行模型
用于处理大型数据集，支持服务器端分页、排序和过滤。

### 2. 列分组
将相关列组合在一起，带有可展开的标题。

### 3. 行分组和聚合
按列值对行进行分组并显示聚合数据。

### 4. 上下文菜单
为行和单元格提供自定义右键菜单。

### 5. 单元格编辑
为不同数据类型提供内置编辑器。

### 6. 导出
导出到 CSV/Excel（企业功能）。

## 开发者迁移清单

如果您要更新组件以使用 AG Grid：

- [ ] 将 TanStack Table 导入替换为 AG Grid 导入
- [ ] 将列定义转换为 `ColDef[]` 格式
- [ ] 将单元格渲染器更新为 AG Grid 的 `ICellRendererParams` 接口
- [ ] 将 `useReactTable` 钩子替换为 AG Grid 的 `AgGridReact` 组件
- [ ] 更新事件处理程序（例如，`onRowClicked` → `onCellClicked`）
- [ ] 如果仅用于表格拖放，则移除 @dnd-kit 依赖项
- [ ] 测试分页、排序和过滤
- [ ] 验证主题是否匹配设计系统

## 性能优势

1. **虚拟滚动**：仅渲染可见行
2. **高效更新**：智能变更检测
3. **优化过滤**：内置过滤缓存
4. **更好的内存管理**：回收 DOM 节点

## 已知限制

1. **打包大小**：AG Grid 增加约 500KB 到打包文件（但移除了 @dnd-kit 和 TanStack Table）
2. **学习曲线**：与 TanStack Table 不同的 API
3. **企业功能**：某些功能需要 AG Grid Enterprise 许可证

## 资源

- [AG Grid 文档](https://www.ag-grid.com/react-data-grid/)
- [AG Grid v35 发布说明](https://www.ag-grid.com/changelog/)
- [列属性](https://www.ag-grid.com/react-data-grid/column-properties/)
- [单元格渲染器](https://www.ag-grid.com/react-data-grid/component-cell-renderer/)

## 支持

如有问题或疑问：
1. 查看 AG Grid 文档
2. 查看 `packages/ui/src/components/data-table.tsx` 中的实现
3. 在 ObjectOS 仓库中创建问题
