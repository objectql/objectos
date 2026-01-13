# ObjectOS Frontend Plugin Framework 设计文档

## 一、概述

### 1.1 设计目标

将 ObjectOS 前端项目从单体应用改造成可扩展的插件化框架，实现以下目标：

1. **核心框架精简化**：将核心功能提取到基础框架，保持最小可运行集
2. **插件化架构**：通过插件方式实现各种复杂功能
3. **可替换性**：允许插件替换或增强标准组件（如对象表格视图）
4. **开发者友好**：提供清晰的插件开发规范和工具链
5. **向后兼容**：保持现有功能的正常运行

### 1.2 架构原则

- **最小核心原则**：核心框架只包含路由、布局、插件加载器等基础设施
- **插件隔离原则**：插件之间相互独立，通过标准接口通信
- **渐进增强原则**：框架提供默认实现，插件可选择性替换
- **类型安全原则**：全程使用 TypeScript，确保类型安全
- **性能优先原则**：插件按需加载，支持代码分割

---

## 二、框架核心架构

### 2.1 框架分层结构

```
┌─────────────────────────────────────────────────────────┐
│                     应用层 (Apps)                        │
│                  apps/web (主应用)                       │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│                   插件层 (Plugins)                       │
│  @objectos/plugin-auth     │  @objectos/plugin-grid      │
│  @objectos/plugin-form     │  @objectos/plugin-workflow  │
│  @objectos/plugin-chart    │  ... (用户自定义插件)       │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│                 核心框架层 (Core Framework)              │
│  @objectos/framework   │  @objectos/ui-core             │
│  - 插件管理器          │  - 基础组件                     │
│  - 路由系统            │  - 布局系统                     │
│  - 状态管理            │  - 主题系统                     │
│  - 扩展点机制          │  - 工具函数                     │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│                 运行时层 (Runtime)                       │
│  @objectos/kernel      │  @objectos/server              │
│  (后端逻辑引擎)        │  (API 服务)                     │
└─────────────────────────────────────────────────────────┘
```

### 2.2 核心框架内容

#### 2.2.1 @objectos/framework 包

**职责**：提供插件管理、扩展点、生命周期管理等核心能力

**主要模块**：

```typescript
@objectos/framework
├── plugin-manager/         # 插件管理器
│   ├── PluginRegistry.ts   # 插件注册表
│   ├── PluginLoader.ts     # 插件加载器
│   └── PluginLifecycle.ts  # 生命周期管理
├── extension-points/       # 扩展点系统
│   ├── ExtensionPoint.ts   # 扩展点定义
│   ├── SlotRegistry.ts     # 插槽注册表
│   └── ComponentRegistry.ts # 组件注册表
├── router/                 # 路由系统
│   ├── PluginRoute.ts      # 插件路由
│   └── RouteRegistry.ts    # 路由注册表
├── context/                # 全局上下文
│   ├── FrameworkContext.ts # 框架上下文
│   └── PluginContext.ts    # 插件上下文
└── types/                  # 类型定义
    ├── plugin.ts           # 插件类型
    └── extension.ts        # 扩展点类型
```

#### 2.2.2 @objectos/ui-core 包

**职责**：提供基础 UI 组件、布局系统、主题系统

**主要模块**：

```typescript
@objectos/ui-core
├── layouts/                # 布局组件
│   ├── MainLayout.tsx      # 主布局
│   ├── WorkspaceLayout.tsx # 工作区布局
│   └── SidebarLayout.tsx   # 侧边栏布局
├── components/             # 基础组件
│   ├── ErrorBoundary.tsx   # 错误边界
│   ├── LoadingFallback.tsx # 加载占位
│   └── ui/                 # Shadcn UI 组件
├── hooks/                  # 通用 Hooks
│   ├── useFramework.ts     # 框架钩子
│   ├── usePlugin.ts        # 插件钩子
│   └── useExtension.ts     # 扩展点钩子
├── theme/                  # 主题系统
│   ├── ThemeProvider.tsx   # 主题提供者
│   └── themes/             # 主题配置
└── utils/                  # 工具函数
    ├── cn.ts               # className 合并
    └── lazy.ts             # 懒加载工具
```

---

## 三、插件系统设计

### 3.1 插件规范

#### 3.1.1 插件接口定义

```typescript
// @objectos/framework/types/plugin.ts

/**
 * 插件元数据
 */
export interface PluginMetadata {
  /** 插件唯一标识符 */
  id: string;
  /** 插件名称 */
  name: string;
  /** 插件版本 */
  version: string;
  /** 插件描述 */
  description?: string;
  /** 作者信息 */
  author?: string;
  /** 插件依赖 */
  dependencies?: string[];
  /** 插件配置 schema */
  configSchema?: any;
}

/**
 * 插件生命周期钩子
 */
export interface PluginLifecycle {
  /** 插件初始化前 */
  beforeInit?(): void | Promise<void>;
  /** 插件初始化 */
  onInit?(): void | Promise<void>;
  /** 插件激活 */
  onActivate?(): void | Promise<void>;
  /** 插件停用 */
  onDeactivate?(): void | Promise<void>;
  /** 插件卸载 */
  onUnload?(): void | Promise<void>;
}

/**
 * 插件扩展贡献
 */
export interface PluginContributions {
  /** 注册的组件 */
  components?: Record<string, React.ComponentType<any>>;
  /** 注册的路由 */
  routes?: PluginRoute[];
  /** 注册的扩展点实现 */
  extensions?: ExtensionContribution[];
  /** 注册的菜单项 */
  menus?: MenuContribution[];
  /** 注册的命令 */
  commands?: CommandContribution[];
}

/**
 * 完整的插件接口
 */
export interface Plugin extends PluginLifecycle {
  /** 插件元数据 */
  metadata: PluginMetadata;
  /** 插件贡献 */
  contributions?: PluginContributions;
}
```

#### 3.1.2 插件开发模板

```typescript
// 插件开发示例：@objectos/plugin-advanced-grid

import { Plugin, ExtensionPoint } from '@objectos/framework';
import { AdvancedObjectGrid } from './components/AdvancedObjectGrid';

export const advancedGridPlugin: Plugin = {
  metadata: {
    id: 'advanced-grid',
    name: 'Advanced Object Grid',
    version: '1.0.0',
    description: '高级对象表格视图，支持虚拟滚动、行分组、聚合计算',
    author: 'ObjectOS Team',
    dependencies: ['@objectos/ui-core']
  },

  // 生命周期钩子
  async onInit() {
    console.log('Advanced Grid Plugin initialized');
  },

  async onActivate() {
    console.log('Advanced Grid Plugin activated');
  },

  // 插件贡献
  contributions: {
    // 注册组件到扩展点
    extensions: [
      {
        point: 'objectos.views.objectList',
        id: 'advanced-grid-view',
        component: AdvancedObjectGrid,
        priority: 100, // 高优先级，替换默认实现
        metadata: {
          label: 'Advanced Grid View',
          description: 'Enhanced grid with grouping and aggregation'
        }
      }
    ],

    // 注册菜单项
    menus: [
      {
        id: 'toggle-advanced-grid',
        parent: 'view-options',
        label: 'Use Advanced Grid',
        command: 'advanced-grid.toggle'
      }
    ],

    // 注册命令
    commands: [
      {
        id: 'advanced-grid.toggle',
        handler: (context) => {
          context.preferences.set('useAdvancedGrid', true);
        }
      }
    ]
  }
};

export default advancedGridPlugin;
```

### 3.2 扩展点机制

#### 3.2.1 核心扩展点定义

```typescript
// @objectos/framework/extension-points/core-extensions.ts

export const CORE_EXTENSION_POINTS = {
  // 视图扩展点
  OBJECT_LIST_VIEW: 'objectos.views.objectList',        // 对象列表视图
  OBJECT_DETAIL_VIEW: 'objectos.views.objectDetail',    // 对象详情视图
  OBJECT_FORM_VIEW: 'objectos.views.objectForm',        // 对象表单视图
  DASHBOARD_VIEW: 'objectos.views.dashboard',           // 仪表板视图

  // 组件扩展点
  FIELD_RENDERER: 'objectos.components.fieldRenderer',  // 字段渲染器
  FILTER_BUILDER: 'objectos.components.filterBuilder',  // 过滤器构建器
  CHART_RENDERER: 'objectos.components.chartRenderer',  // 图表渲染器

  // 功能扩展点
  AUTH_PROVIDER: 'objectos.features.authProvider',      // 认证提供者
  DATA_TRANSFORMER: 'objectos.features.dataTransformer',// 数据转换器
  EXPORT_HANDLER: 'objectos.features.exportHandler',    // 导出处理器

  // 布局扩展点
  SIDEBAR_ITEM: 'objectos.layout.sidebarItem',          // 侧边栏项
  TOOLBAR_ITEM: 'objectos.layout.toolbarItem',          // 工具栏项
  ACTION_BUTTON: 'objectos.layout.actionButton',        // 操作按钮
} as const;
```

#### 3.2.2 扩展点使用方式

```typescript
// 框架中定义扩展点
import { ExtensionSlot } from '@objectos/framework';

function ObjectListPage({ objectName }: { objectName: string }) {
  return (
    <div>
      <h1>Object List: {objectName}</h1>
      
      {/* 扩展点：对象列表视图 */}
      <ExtensionSlot
        point="objectos.views.objectList"
        props={{ objectName }}
        fallback={<DefaultObjectGrid objectName={objectName} />}
      />
    </div>
  );
}

// ExtensionSlot 实现
import { useExtensions } from '@objectos/framework';

export function ExtensionSlot<T = any>({
  point,
  props,
  fallback
}: {
  point: string;
  props?: T;
  fallback?: React.ReactNode;
}) {
  const extensions = useExtensions(point);
  
  // 按优先级排序，选择最高优先级的扩展
  const activeExtension = extensions.sort((a, b) => 
    (b.priority || 0) - (a.priority || 0)
  )[0];

  if (!activeExtension) {
    return <>{fallback}</>;
  }

  const Component = activeExtension.component;
  return <Component {...props} />;
}
```

### 3.3 插件加载机制

#### 3.3.1 静态插件加载

```typescript
// apps/web/src/plugins/index.ts
import { PluginRegistry } from '@objectos/framework';
import authPlugin from '@objectos/plugin-auth';
import gridPlugin from '@objectos/plugin-grid';
import formPlugin from '@objectos/plugin-form';
import advancedGridPlugin from '@objectos/plugin-advanced-grid';

export function registerPlugins(registry: PluginRegistry) {
  // 注册核心插件
  registry.register(authPlugin);
  registry.register(gridPlugin);
  registry.register(formPlugin);
  
  // 注册第三方插件
  registry.register(advancedGridPlugin);
}
```

#### 3.3.2 动态插件加载（未来支持）

```typescript
// 动态加载远程插件
async function loadRemotePlugin(url: string) {
  const module = await import(/* @vite-ignore */ url);
  const plugin = module.default;
  
  // 验证插件
  if (!isValidPlugin(plugin)) {
    throw new Error('Invalid plugin format');
  }
  
  // 注册插件
  pluginRegistry.register(plugin);
}
```

---

## 四、插件开发指南

### 4.1 创建新插件

#### 步骤 1：初始化插件项目

```bash
# 使用 CLI 创建插件（未来功能）
npx @objectos/cli create-plugin my-advanced-grid

# 或手动创建
mkdir packages/plugin-advanced-grid
cd packages/plugin-advanced-grid
pnpm init
```

#### 步骤 2：定义插件结构

```
packages/plugin-advanced-grid/
├── src/
│   ├── index.ts              # 插件入口
│   ├── plugin.ts             # 插件定义
│   ├── components/           # 组件
│   │   ├── AdvancedGrid.tsx
│   │   └── GridToolbar.tsx
│   ├── hooks/                # 自定义 Hooks
│   │   └── useGridState.ts
│   └── types/                # 类型定义
│       └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

#### 步骤 3：实现插件

```typescript
// src/plugin.ts
import { Plugin } from '@objectos/framework';
import { AdvancedGrid } from './components/AdvancedGrid';

export const plugin: Plugin = {
  metadata: {
    id: 'advanced-grid',
    name: 'Advanced Grid',
    version: '1.0.0'
  },

  contributions: {
    extensions: [
      {
        point: 'objectos.views.objectList',
        id: 'advanced-grid',
        component: AdvancedGrid,
        priority: 100
      }
    ]
  }
};

export default plugin;
```

#### 步骤 4：实现组件

```typescript
// src/components/AdvancedGrid.tsx
import React from 'react';
import { useObjectData } from '@objectos/ui-core';

interface AdvancedGridProps {
  objectName: string;
}

export function AdvancedGrid({ objectName }: AdvancedGridProps) {
  const { data, loading } = useObjectData(objectName);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="advanced-grid">
      <h2>Advanced Grid for {objectName}</h2>
      {/* 高级表格实现 */}
      <table>
        {/* ... */}
      </table>
    </div>
  );
}
```

### 4.2 插件配置

```typescript
// 插件可以定义配置 schema
export const plugin: Plugin = {
  metadata: {
    id: 'advanced-grid',
    configSchema: {
      type: 'object',
      properties: {
        enableVirtualScroll: {
          type: 'boolean',
          default: true,
          description: '启用虚拟滚动'
        },
        pageSize: {
          type: 'number',
          default: 50,
          description: '每页显示行数'
        },
        theme: {
          type: 'string',
          enum: ['light', 'dark', 'auto'],
          default: 'auto',
          description: '主题'
        }
      }
    }
  },

  async onInit() {
    // 读取配置
    const config = this.getConfig();
    console.log('Grid config:', config);
  }
};
```

### 4.3 插件间通信

#### 4.3.1 事件总线

```typescript
// 使用事件总线在插件间通信
import { useEventBus } from '@objectos/framework';

// 插件 A：发布事件
function PluginA() {
  const eventBus = useEventBus();
  
  const handleAction = () => {
    eventBus.emit('grid.rowSelected', { rowId: '123', data: {...} });
  };
  
  return <button onClick={handleAction}>Select Row</button>;
}

// 插件 B：订阅事件
function PluginB() {
  const eventBus = useEventBus();
  
  useEffect(() => {
    const unsubscribe = eventBus.on('grid.rowSelected', (payload) => {
      console.log('Row selected:', payload);
    });
    
    return unsubscribe;
  }, []);
  
  return <div>...</div>;
}
```

#### 4.3.2 共享状态

```typescript
// 使用框架提供的状态管理
import { useSharedState } from '@objectos/framework';

function PluginA() {
  const [selectedRows, setSelectedRows] = useSharedState('grid.selectedRows', []);
  
  return (
    <button onClick={() => setSelectedRows([1, 2, 3])}>
      Select Rows
    </button>
  );
}

function PluginB() {
  const [selectedRows] = useSharedState('grid.selectedRows', []);
  
  return <div>Selected: {selectedRows.length} rows</div>;
}
```

---

## 五、典型场景：替换标准对象表格

### 5.1 场景描述

开发者想要使用高级表格组件替换标准的对象列表视图，实现以下功能：
- 虚拟滚动支持海量数据
- 行分组和聚合计算
- 自定义列渲染器
- 导出到 Excel

### 5.2 实现步骤

#### 步骤 1：创建插件

```bash
mkdir packages/plugin-advanced-grid
cd packages/plugin-advanced-grid
```

#### 步骤 2：安装依赖

```json
// package.json
{
  "name": "@objectos/plugin-advanced-grid",
  "version": "1.0.0",
  "dependencies": {
    "@objectos/framework": "workspace:*",
    "@objectos/ui-core": "workspace:*",
    "@tanstack/react-table": "^8.21.3",
    "@tanstack/react-virtual": "^3.10.0",
    "react": "^18.3.1"
  }
}
```

#### 步骤 3：实现高级表格组件

```typescript
// src/components/AdvancedObjectGrid.tsx
import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getGroupedRowModel,
  getAggregatedRowModel,
  ColumnDef,
  flexRender
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useObjectData, useObjectSchema } from '@objectos/ui-core';

interface AdvancedObjectGridProps {
  objectName: string;
}

export function AdvancedObjectGrid({ objectName }: AdvancedObjectGridProps) {
  const { data, loading } = useObjectData(objectName);
  const { schema } = useObjectSchema(objectName);

  // 根据 schema 生成列定义
  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (!schema) return [];
    
    return Object.entries(schema.fields).map(([fieldName, fieldConfig]) => ({
      id: fieldName,
      accessorKey: fieldName,
      header: fieldConfig.label || fieldName,
      // 支持分组和聚合
      enableGrouping: true,
      aggregationFn: fieldConfig.type === 'number' ? 'sum' : 'count',
      // 自定义单元格渲染
      cell: (info) => {
        const value = info.getValue();
        // 根据字段类型渲染
        if (fieldConfig.type === 'currency') {
          return `$${value?.toFixed(2) || '0.00'}`;
        }
        return value;
      }
    }));
  }, [schema]);

  // 创建表格实例
  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getAggregatedRowModel: getAggregatedRowModel(),
  });

  // 虚拟滚动容器引用
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  // 虚拟化行
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 35,
    overscan: 10,
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="advanced-object-grid">
      {/* 工具栏 */}
      <div className="grid-toolbar">
        <button onClick={() => exportToExcel(data)}>
          Export to Excel
        </button>
        <button onClick={() => table.toggleAllRowsExpanded()}>
          Toggle Grouping
        </button>
      </div>

      {/* 虚拟滚动表格 */}
      <div 
        ref={tableContainerRef}
        className="grid-container"
        style={{ height: '600px', overflow: 'auto' }}
      >
        <table style={{ width: '100%' }}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            {rowVirtualizer.getVirtualItems().map(virtualRow => {
              const row = table.getRowModel().rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  style={{
                    position: 'absolute',
                    transform: `translateY(${virtualRow.start}px)`,
                    width: '100%'
                  }}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 导出到 Excel 的辅助函数
function exportToExcel(data: any[]) {
  // 实现导出逻辑
  console.log('Exporting to Excel:', data);
}
```

#### 步骤 4：定义插件

```typescript
// src/plugin.ts
import { Plugin } from '@objectos/framework';
import { AdvancedObjectGrid } from './components/AdvancedObjectGrid';

export const advancedGridPlugin: Plugin = {
  metadata: {
    id: 'advanced-grid',
    name: 'Advanced Object Grid',
    version: '1.0.0',
    description: '高级对象表格，支持虚拟滚动、分组、聚合和导出',
    author: 'Your Name'
  },

  async onInit() {
    console.log('Advanced Grid Plugin initialized');
  },

  contributions: {
    // 注册为对象列表视图的扩展
    extensions: [
      {
        point: 'objectos.views.objectList',
        id: 'advanced-grid-view',
        component: AdvancedObjectGrid,
        priority: 100, // 高优先级，替换默认实现
        metadata: {
          label: 'Advanced Grid',
          description: 'Enhanced grid with virtual scrolling and grouping',
          icon: 'table'
        }
      }
    ],

    // 添加菜单项，允许用户切换
    menus: [
      {
        id: 'view.toggle-advanced-grid',
        parent: 'view-options',
        label: 'Use Advanced Grid',
        command: 'advanced-grid.enable'
      }
    ],

    // 注册命令
    commands: [
      {
        id: 'advanced-grid.enable',
        handler: (context) => {
          context.preferences.set('objectList.view', 'advanced-grid-view');
        }
      },
      {
        id: 'advanced-grid.export',
        handler: (context) => {
          // 触发导出逻辑
        }
      }
    ]
  }
};

export default advancedGridPlugin;
```

#### 步骤 5：在应用中注册插件

```typescript
// apps/web/src/main.tsx
import { PluginRegistry } from '@objectos/framework';
import advancedGridPlugin from '@objectos/plugin-advanced-grid';

const pluginRegistry = new PluginRegistry();

// 注册插件
pluginRegistry.register(advancedGridPlugin);

// 初始化所有插件
await pluginRegistry.initializeAll();

// 渲染应用
ReactDOM.createRoot(document.getElementById('root')!).render(
  <FrameworkProvider registry={pluginRegistry}>
    <App />
  </FrameworkProvider>
);
```

#### 步骤 6：在页面中使用

```typescript
// apps/web/src/pages/objects/ObjectListRoute.tsx
import { ExtensionSlot } from '@objectos/framework';
import { DefaultObjectGrid } from '@objectos/ui-core';

export function ObjectListRoute({ objectName }: { objectName: string }) {
  return (
    <div className="object-list-page">
      <h1>{objectName}</h1>
      
      {/* 扩展点会自动使用高级表格（如果已注册且优先级高） */}
      <ExtensionSlot
        point="objectos.views.objectList"
        props={{ objectName }}
        fallback={<DefaultObjectGrid objectName={objectName} />}
      />
    </div>
  );
}
```

### 5.3 结果

现在，当用户访问任何对象列表页面时：
1. 框架会查找 `objectos.views.objectList` 扩展点的所有注册
2. 按优先级排序（`advanced-grid-view` 优先级为 100）
3. 自动使用 `AdvancedObjectGrid` 组件替换默认的表格
4. 用户享受虚拟滚动、分组、聚合等高级功能

---

## 六、框架实现计划

### 6.1 阶段一：核心框架搭建（Week 1-2）

**目标**：建立基础的插件系统架构

**任务**：
1. 创建 `@objectos/framework` 包
   - 插件注册表 (`PluginRegistry`)
   - 插件加载器 (`PluginLoader`)
   - 生命周期管理 (`PluginLifecycle`)
   
2. 创建 `@objectos/ui-core` 包
   - 提取通用布局组件
   - 提取基础 UI 组件
   - 实现 `ExtensionSlot` 组件

3. 定义核心类型
   - `Plugin` 接口
   - `ExtensionPoint` 接口
   - `PluginContribution` 类型

**验收标准**：
- 能够注册和加载简单插件
- 插件生命周期钩子正常工作
- 扩展点机制基本可用

### 6.2 阶段二：核心插件迁移（Week 3-4）

**目标**：将现有功能拆分为标准插件

**任务**：
1. 创建 `@objectos/plugin-auth`
   - 迁移认证相关逻辑
   - 提供认证 Hooks 和组件

2. 创建 `@objectos/plugin-grid`
   - 迁移 `ObjectGrid` 组件
   - 注册到 `objectos.views.objectList` 扩展点

3. 创建 `@objectos/plugin-form`
   - 迁移 `ObjectForm` 组件
   - 注册到 `objectos.views.objectForm` 扩展点

4. 创建 `@objectos/plugin-dashboard`
   - 迁移仪表板相关组件

**验收标准**：
- 原有功能在插件化后保持正常
- 所有测试通过
- 应用启动和运行无异常

### 6.3 阶段三：扩展点完善（Week 5-6）

**目标**：实现完整的扩展点体系

**任务**：
1. 定义所有核心扩展点
   - 视图扩展点
   - 组件扩展点
   - 功能扩展点
   - 布局扩展点

2. 实现扩展点优先级机制
   - 支持多个扩展共存
   - 支持扩展选择和切换

3. 实现插件间通信
   - 事件总线 (`EventBus`)
   - 共享状态 (`SharedState`)

**验收标准**：
- 所有扩展点都有文档说明
- 扩展点替换机制工作正常
- 插件间可以正常通信

### 6.4 阶段四：开发者工具（Week 7-8）

**目标**：提供插件开发工具链

**任务**：
1. 创建插件开发模板
   - TypeScript 模板
   - 包含最佳实践

2. 编写插件开发文档
   - 快速开始指南
   - API 参考
   - 最佳实践

3. 实现插件调试工具
   - 插件状态查看器
   - 扩展点检查器

4. 创建示例插件
   - 简单插件示例
   - 高级插件示例（如本文档中的高级表格）

**验收标准**：
- 开发者能够快速创建插件
- 文档清晰完整
- 示例代码可运行

### 6.5 阶段五：测试和优化（Week 9-10）

**目标**：确保框架稳定性和性能

**任务**：
1. 编写单元测试
   - 插件系统测试
   - 扩展点测试

2. 编写集成测试
   - 插件加载测试
   - 插件交互测试

3. 性能优化
   - 插件懒加载
   - 代码分割

4. 安全加固
   - 插件沙箱（隔离）
   - 权限控制

**验收标准**：
- 测试覆盖率达到 80%+
- 应用启动时间无明显增加
- 插件加载按需进行

---

## 七、插件生态规划

### 7.1 官方插件

| 插件名称 | 说明 | 优先级 |
|---------|------|--------|
| `@objectos/plugin-auth` | 认证和授权 | 高 |
| `@objectos/plugin-grid` | 标准对象表格 | 高 |
| `@objectos/plugin-form` | 标准对象表单 | 高 |
| `@objectos/plugin-dashboard` | 仪表板视图 | 高 |
| `@objectos/plugin-chart` | 图表组件 | 中 |
| `@objectos/plugin-kanban` | 看板视图 | 中 |
| `@objectos/plugin-calendar` | 日历视图 | 中 |
| `@objectos/plugin-workflow` | 工作流引擎 | 低 |
| `@objectos/plugin-import-export` | 数据导入导出 | 低 |

### 7.2 社区插件（示例）

| 插件名称 | 说明 | 作者 |
|---------|------|------|
| `@company/plugin-advanced-grid` | 高级表格（虚拟滚动、分组） | 第三方 |
| `@company/plugin-gantt` | 甘特图视图 | 第三方 |
| `@company/plugin-ai-assistant` | AI 助手 | 第三方 |
| `@company/plugin-custom-theme` | 自定义主题 | 第三方 |

### 7.3 插件发现和分发

**短期**（静态加载）：
- 插件通过 npm 包分发
- 在应用中手动注册

**中期**（插件市场）：
- 创建插件市场网站
- 插件可在线浏览和搜索
- 提供安装指南

**长期**（动态加载）：
- 支持运行时安装插件
- 插件沙箱和权限管理
- 自动更新机制

---

## 八、向后兼容策略

### 8.1 兼容性保证

1. **API 兼容性**：现有的公开 API 保持不变
2. **组件兼容性**：现有组件仍可导入和使用
3. **路由兼容性**：现有路由结构保持不变
4. **配置兼容性**：现有配置文件继续有效

### 8.2 迁移路径

```typescript
// 旧代码（继续支持）
import { ObjectGrid } from '@objectos/ui';

function MyPage() {
  return <ObjectGrid objectName="contacts" />;
}

// 新代码（推荐）
import { ExtensionSlot } from '@objectos/framework';

function MyPage() {
  return (
    <ExtensionSlot
      point="objectos.views.objectList"
      props={{ objectName: "contacts" }}
    />
  );
}
```

### 8.3 弃用计划

- **阶段 1**（v0.3.0）：引入框架，旧 API 标记为 Deprecated
- **阶段 2**（v0.4.0）：提供自动迁移工具
- **阶段 3**（v1.0.0）：移除旧 API（主版本升级）

---

## 九、性能考虑

### 9.1 插件懒加载

```typescript
// 使用动态导入实现插件懒加载
const lazyPlugins = {
  'advanced-grid': () => import('@objectos/plugin-advanced-grid'),
  'kanban': () => import('@objectos/plugin-kanban'),
  'calendar': () => import('@objectos/plugin-calendar')
};

// 只在需要时加载
async function loadPlugin(id: string) {
  const loader = lazyPlugins[id];
  if (!loader) return;
  
  const module = await loader();
  pluginRegistry.register(module.default);
}
```

### 9.2 代码分割

```typescript
// Vite 配置
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'framework': ['@objectos/framework'],
          'ui-core': ['@objectos/ui-core'],
          'plugin-grid': ['@objectos/plugin-grid'],
          'plugin-form': ['@objectos/plugin-form']
        }
      }
    }
  }
});
```

### 9.3 性能指标

| 指标 | 目标 |
|------|------|
| 首屏加载时间 | < 2s |
| 插件加载时间 | < 500ms |
| 扩展点解析时间 | < 50ms |
| 内存占用增加 | < 10% |

---

## 十、安全考虑

### 10.1 插件隔离

```typescript
// 插件沙箱（未来功能）
class PluginSandbox {
  execute(plugin: Plugin, context: PluginContext) {
    // 限制插件访问范围
    const sandbox = {
      console: createSafeConsole(),
      fetch: createSafeFetch(),
      // 不暴露 window, document 等全局对象
    };
    
    // 在隔离环境中执行插件代码
    return executeSandboxed(plugin, sandbox, context);
  }
}
```

### 10.2 权限控制

```typescript
// 插件权限声明
export const plugin: Plugin = {
  metadata: {
    id: 'advanced-grid',
    permissions: [
      'read:objects',      // 读取对象数据
      'write:preferences', // 写入用户偏好
      'network:export'     // 网络请求（导出）
    ]
  }
};

// 运行时权限检查
if (!context.hasPermission('network:export')) {
  throw new PermissionError('Plugin does not have export permission');
}
```

### 10.3 代码审查

- 官方插件：通过代码审查和安全扫描
- 社区插件：需要通过认证流程
- 未认证插件：显示安全警告

---

## 十一、文档和示例

### 11.1 文档结构

```
docs/
├── framework/
│   ├── README.md                 # 框架概述
│   ├── plugin-development.md    # 插件开发指南
│   ├── extension-points.md      # 扩展点参考
│   ├── api-reference.md         # API 参考
│   └── best-practices.md        # 最佳实践
├── plugins/
│   ├── official-plugins.md      # 官方插件列表
│   ├── plugin-auth.md           # 认证插件文档
│   ├── plugin-grid.md           # 表格插件文档
│   └── ...
└── examples/
    ├── simple-plugin/           # 简单插件示例
    ├── advanced-grid/           # 高级表格示例
    └── custom-theme/            # 自定义主题示例
```

### 11.2 示例代码仓库

```
examples/
├── simple-hello-world/          # 最简单的插件
├── advanced-grid-plugin/        # 高级表格插件
├── custom-field-renderer/       # 自定义字段渲染器
├── custom-theme/                # 自定义主题
└── multi-plugin-app/            # 多插件集成应用
```

---

## 十二、总结

### 12.1 核心优势

1. **灵活性**：通过插件扩展任意功能
2. **可维护性**：核心框架保持精简
3. **可扩展性**：社区可贡献插件
4. **类型安全**：完整的 TypeScript 支持
5. **性能**：按需加载，代码分割

### 12.2 实施要点

1. **渐进式改造**：逐步将现有功能迁移到插件
2. **保持兼容**：确保现有应用继续工作
3. **文档先行**：先完善文档和示例
4. **社区参与**：鼓励社区贡献插件

### 12.3 成功指标

- **开发效率**：新功能开发时间减少 50%
- **代码质量**：核心框架代码量减少 30%
- **社区活跃度**：至少 10 个社区插件
- **用户满意度**：插件使用率 > 80%

---

## 附录 A：核心 API 参考

### PluginRegistry API

```typescript
class PluginRegistry {
  /** 注册插件 */
  register(plugin: Plugin): void;
  
  /** 卸载插件 */
  unregister(pluginId: string): void;
  
  /** 获取插件 */
  getPlugin(pluginId: string): Plugin | undefined;
  
  /** 获取所有插件 */
  getAllPlugins(): Plugin[];
  
  /** 初始化所有插件 */
  async initializeAll(): Promise<void>;
  
  /** 激活插件 */
  async activate(pluginId: string): Promise<void>;
  
  /** 停用插件 */
  async deactivate(pluginId: string): Promise<void>;
}
```

### ExtensionPoint API

```typescript
interface ExtensionPoint {
  /** 扩展点 ID */
  id: string;
  
  /** 扩展点描述 */
  description?: string;
  
  /** 注册扩展 */
  register(extension: Extension): void;
  
  /** 获取所有扩展 */
  getExtensions(): Extension[];
  
  /** 获取最高优先级的扩展 */
  getActive(): Extension | undefined;
}
```

### useExtensions Hook

```typescript
function useExtensions(pointId: string): Extension[];
function useExtension(pointId: string): Extension | undefined;
```

### usePlugin Hook

```typescript
function usePlugin(pluginId: string): Plugin | undefined;
```

---

## 附录 B：扩展点清单

| 扩展点 ID | 说明 | 接受的 Props | 默认实现 |
|-----------|------|--------------|---------|
| `objectos.views.objectList` | 对象列表视图 | `{ objectName: string }` | `ObjectGrid` |
| `objectos.views.objectDetail` | 对象详情视图 | `{ objectName: string, recordId: string }` | `ObjectDetailView` |
| `objectos.views.objectForm` | 对象表单视图 | `{ objectName: string, recordId?: string }` | `ObjectForm` |
| `objectos.components.fieldRenderer` | 字段渲染器 | `{ field: FieldConfig, value: any }` | `DefaultFieldRenderer` |
| `objectos.components.filterBuilder` | 过滤器构建器 | `{ objectName: string, onFilterChange: Function }` | `DefaultFilterBuilder` |
| `objectos.layout.sidebarItem` | 侧边栏项 | `{ item: MenuItem }` | `DefaultSidebarItem` |

---

## 附录 C：常见问题

**Q1: 插件如何访问后端 API？**

A: 插件可以使用框架提供的 API 客户端：

```typescript
import { useAPI } from '@objectos/framework';

function MyPlugin() {
  const api = useAPI();
  
  const fetchData = async () => {
    const data = await api.find('contacts', { filters: {...} });
    return data;
  };
}
```

**Q2: 插件如何存储配置？**

A: 使用框架提供的配置 API：

```typescript
import { usePluginConfig } from '@objectos/framework';

function MyPlugin() {
  const [config, setConfig] = usePluginConfig('my-plugin');
  
  return (
    <div>
      <input 
        value={config.myOption} 
        onChange={e => setConfig({ ...config, myOption: e.target.value })}
      />
    </div>
  );
}
```

**Q3: 如何调试插件？**

A: 使用 React DevTools 和框架提供的调试工具：

```typescript
// 在浏览器控制台
window.__OBJECTOS_DEBUG__.plugins // 查看所有插件
window.__OBJECTOS_DEBUG__.extensions // 查看所有扩展点
window.__OBJECTOS_DEBUG__.events // 查看事件日志
```

---

## 附录 D：版本历史

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| 1.0 | 2026-01-13 | 初始版本 |

---

**文档维护者**：ObjectOS Team  
**最后更新**：2026-01-13  
**反馈渠道**：GitHub Issues / Discord
