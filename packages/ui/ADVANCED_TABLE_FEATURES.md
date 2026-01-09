# 表格组件高级功能 (Advanced Table Features)

本文档描述 ObjectQL UI 库中表格组件的高级功能实现。

This document describes the advanced features implementation in ObjectQL UI table components.

## 功能概览 (Features Overview)

### ✅ 已实现的功能 (Implemented Features)

1. **Grouping (分组)** - 按列分组数据显示
2. **Inline Editing (内联编辑)** - Grid 中直接编辑单元格
3. **Bulk Operations (批量操作)** - 批量删除、批量更新
4. **Copy/Paste (复制粘贴)** - 复制选中行到剪贴板
5. **Drag & Drop (拖拽排序)** - 字段拖拽排序

---

## 1. Grouping (分组)

### 功能描述 (Feature Description)

数据分组功能允许用户按照指定列对表格数据进行分组展示，每个分组可以展开或折叠。

The grouping feature allows users to group table data by a specified column, with each group being expandable or collapsible.

### 使用方法 (Usage)

#### GridView 组件

```tsx
import { GridView } from '@objectql/ui'

<GridView
  columns={columns}
  data={data}
  enableGrouping={true}
  groupByColumn="department"  // 按部门分组
/>
```

#### DataTable 组件

```tsx
import { DataTable } from '@objectql/ui'

<DataTable
  columns={columns}
  data={data}
  enableGrouping={true}
  groupByColumn="status"  // 按状态分组
/>
```

### 特性 (Features)

- ✅ 按任意列分组
- ✅ 展开/折叠分组
- ✅ 显示每组的记录数量
- ✅ 与行选择功能兼容
- ✅ 与其他功能组合使用

---

## 2. Inline Editing (内联编辑)

### 功能描述 (Feature Description)

内联编辑允许用户直接在表格单元格中编辑数据，无需打开单独的编辑表单。

Inline editing allows users to edit data directly in table cells without opening a separate edit form.

### 使用方法 (Usage)

```tsx
const columns = [
  { 
    id: 'name', 
    label: '名称', 
    type: 'text', 
    editable: true  // 启用编辑
  },
  { 
    id: 'budget', 
    label: '预算', 
    type: 'number', 
    editable: true 
  },
  { 
    id: 'startDate', 
    label: '开始日期', 
    type: 'date', 
    editable: true 
  },
]

<GridView
  columns={columns}
  data={data}
  onCellEdit={(rowIndex, columnId, value) => {
    console.log('Cell edited:', { rowIndex, columnId, value })
    // 更新数据
  }}
/>
```

### 支持的字段类型 (Supported Field Types)

- ✅ **text** - 文本输入
- ✅ **number** - 数字输入
- ✅ **date** - 日期选择

### 键盘快捷键 (Keyboard Shortcuts)

- **Enter** - 保存编辑
- **Escape** - 取消编辑

### 注意事项 (Notes)

- Badge、Select 和 Boolean 类型字段不支持内联编辑，需要通过行点击在表单中编辑
- Badge, Select, and Boolean type fields don't support inline editing; they should be edited in a form via row click

---

## 3. Bulk Operations (批量操作)

### 功能描述 (Feature Description)

批量操作允许用户选择多行并对它们执行批量删除等操作。

Bulk operations allow users to select multiple rows and perform actions like bulk delete on them.

### 使用方法 (Usage)

#### GridView 组件

```tsx
<GridView
  columns={columns}
  data={data}
  enableRowSelection={true}
  onBulkDelete={(rows) => {
    console.log('Deleting rows:', rows)
    // 执行批量删除逻辑
  }}
/>
```

#### DataTable 组件

```tsx
<DataTable
  columns={columns}
  data={data}
  enableRowSelection={true}
  onBulkDelete={(rows) => {
    console.log('Deleting rows:', rows)
    // 执行批量删除逻辑
  }}
  onBulkUpdate={(rows, updates) => {
    console.log('Updating rows:', rows, updates)
    // 执行批量更新逻辑
  }}
/>
```

### 特性 (Features)

- ✅ 全选/取消全选
- ✅ 单独选择行
- ✅ 批量删除操作
- ✅ 批量更新操作（DataTable）
- ✅ 显示选中行数量
- ✅ 批量操作工具栏

### 批量操作工具栏 (Bulk Actions Toolbar)

当有行被选中时，会显示批量操作工具栏，包含：
- 选中行数量显示
- 复制按钮（如果启用）
- 删除按钮
- 清除选择按钮

When rows are selected, a bulk actions toolbar appears with:
- Selected row count
- Copy button (if enabled)
- Delete button
- Clear selection button

---

## 4. Copy/Paste (复制粘贴)

### 功能描述 (Feature Description)

复制粘贴功能允许用户将选中的行数据复制到剪贴板，格式为 TSV（制表符分隔值），可以粘贴到 Excel 等应用程序。

The copy/paste feature allows users to copy selected row data to clipboard in TSV (Tab-Separated Values) format, which can be pasted into applications like Excel.

### 使用方法 (Usage)

```tsx
<GridView
  columns={columns}
  data={data}
  enableRowSelection={true}
  enableCopyPaste={true}
/>
```

### 复制方式 (Copy Methods)

1. **按钮复制** - 点击批量操作工具栏中的"Copy"按钮
2. **键盘快捷键** - 选中行后按 `Ctrl+C` (Windows/Linux) 或 `Cmd+C` (Mac)

### 数据格式 (Data Format)

复制的数据包含：
- 第一行：列标题（制表符分隔）
- 后续行：数据行（制表符分隔）

Copied data includes:
- First row: Column headers (tab-separated)
- Following rows: Data rows (tab-separated)

### 示例 (Example)

```
Name	Department	Status	Priority
Website Redesign	Engineering	active	high
Mobile App Development	Engineering	active	high
```

---

## 5. Drag & Drop (拖拽排序)

### 功能描述 (Feature Description)

拖拽排序功能允许用户通过拖拽列标题来重新排列列的顺序。

The drag & drop feature allows users to reorder columns by dragging column headers.

### 使用方法 (Usage)

```tsx
const [columns, setColumns] = React.useState(initialColumns)

<GridView
  columns={columns}
  data={data}
  enableColumnDragDrop={true}
  onColumnReorder={(newColumns) => {
    console.log('Columns reordered:', newColumns.map(c => c.id))
    setColumns(newColumns)
  }}
/>
```

### 特性 (Features)

- ✅ 拖拽列标题重新排序
- ✅ 拖拽时的视觉反馈（高亮目标位置）
- ✅ 拖拽图标指示
- ✅ 保持列顺序状态

### 视觉指示 (Visual Indicators)

- 列标题显示拖拽图标（⋮⋮）
- 拖拽时目标位置高亮显示
- 鼠标指针变为移动样式

---

## 组合使用 (Combined Usage)

所有功能都可以组合使用，创建功能强大的表格界面：

All features can be combined to create powerful table interfaces:

```tsx
<GridView
  columns={columns}
  data={data}
  // 启用所有功能
  enableRowSelection={true}
  enableGrouping={true}
  groupByColumn="department"
  enableCopyPaste={true}
  enableColumnDragDrop={true}
  // 处理函数
  onCellEdit={handleCellEdit}
  onBulkDelete={handleBulkDelete}
  onColumnReorder={handleColumnReorder}
/>
```

---

## API 参考 (API Reference)

### GridView Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableRowSelection` | `boolean` | `false` | 启用行选择 / Enable row selection |
| `enableGrouping` | `boolean` | `false` | 启用分组 / Enable grouping |
| `groupByColumn` | `string` | - | 分组列 ID / Group by column ID |
| `enableCopyPaste` | `boolean` | `false` | 启用复制粘贴 / Enable copy/paste |
| `enableColumnDragDrop` | `boolean` | `false` | 启用列拖拽 / Enable column drag & drop |
| `onBulkDelete` | `(rows: any[]) => void` | - | 批量删除回调 / Bulk delete callback |
| `onColumnReorder` | `(columns: Column[]) => void` | - | 列重排回调 / Column reorder callback |

### DataTable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableRowSelection` | `boolean` | `false` | 启用行选择 / Enable row selection |
| `enableGrouping` | `boolean` | `false` | 启用分组 / Enable grouping |
| `groupByColumn` | `string` | - | 分组列 ID / Group by column ID |
| `enableCopyPaste` | `boolean` | `false` | 启用复制粘贴 / Enable copy/paste |
| `onBulkDelete` | `(rows: TData[]) => void` | - | 批量删除回调 / Bulk delete callback |
| `onBulkUpdate` | `(rows: TData[], updates: Partial<TData>) => void` | - | 批量更新回调 / Bulk update callback |

---

## 示例 (Examples)

完整示例请参考：
- `examples/advanced-table-features.tsx` - 所有功能的完整演示

For complete examples, see:
- `examples/advanced-table-features.tsx` - Full demonstration of all features

---

## 浏览器支持 (Browser Support)

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 技术栈 (Tech Stack)

- React 18
- TanStack Table v8
- TypeScript 5
- Tailwind CSS
- Lucide React Icons

---

## 性能考虑 (Performance Considerations)

1. **分组** - 使用 `useMemo` 优化分组计算
2. **行选择** - 使用 `Set` 数据结构提高性能
3. **拖拽** - 仅在必要时更新状态

1. **Grouping** - Uses `useMemo` to optimize grouping calculations
2. **Row Selection** - Uses `Set` data structure for better performance
3. **Drag & Drop** - Updates state only when necessary

---

## 未来改进 (Future Enhancements)

- [ ] 多列分组
- [ ] 自定义分组聚合函数
- [ ] 持久化列顺序到 localStorage
- [ ] 批量编辑功能
- [ ] 拖拽行重新排序

- [ ] Multi-column grouping
- [ ] Custom group aggregation functions
- [ ] Persist column order to localStorage
- [ ] Batch edit functionality
- [ ] Drag & drop row reordering
