# ObjectOS Frontend Plugin Framework Design Document

## 1. Overview

### 1.1 Design Goals

Transform the ObjectOS frontend from a monolithic application into an extensible plugin-based framework to achieve:

1. **Minimized Core Framework**: Extract core functionality into a base framework with minimal viable features
2. **Plugin Architecture**: Implement complex features through a plugin system
3. **Replaceability**: Allow plugins to replace or enhance standard components (e.g., object grid view)
4. **Developer-Friendly**: Provide clear plugin development specifications and tooling
5. **Backward Compatibility**: Maintain existing functionality during transition

### 1.2 Architecture Principles

- **Minimal Core Principle**: Core framework includes only essential infrastructure (routing, layouts, plugin loader)
- **Plugin Isolation Principle**: Plugins are independent and communicate through standard interfaces
- **Progressive Enhancement Principle**: Framework provides default implementations that plugins can optionally replace
- **Type Safety Principle**: Full TypeScript support throughout
- **Performance First Principle**: Lazy loading of plugins with code splitting support

---

## 2. Core Framework Architecture

### 2.1 Framework Layers

```
┌─────────────────────────────────────────────────────────┐
│                  Application Layer (Apps)                │
│                  apps/web (Main App)                     │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│                   Plugin Layer (Plugins)                 │
│  @objectos/plugin-auth     │  @objectos/plugin-grid      │
│  @objectos/plugin-form     │  @objectos/plugin-workflow  │
│  @objectos/plugin-chart    │  ... (Custom Plugins)       │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│              Core Framework Layer (Core Framework)       │
│  @objectos/framework   │  @objectos/ui-core             │
│  - Plugin Manager      │  - Base Components              │
│  - Router System       │  - Layout System                │
│  - State Management    │  - Theme System                 │
│  - Extension Points    │  - Utility Functions            │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│                  Runtime Layer (Runtime)                 │
│  @objectos/kernel      │  @objectos/server              │
│  (Backend Logic)       │  (API Service)                  │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Core Framework Components

#### 2.2.1 @objectos/framework Package

**Responsibilities**: Provide plugin management, extension points, lifecycle management

**Main Modules**:

```typescript
@objectos/framework
├── plugin-manager/         # Plugin management
│   ├── PluginRegistry.ts   # Plugin registry
│   ├── PluginLoader.ts     # Plugin loader
│   └── PluginLifecycle.ts  # Lifecycle management
├── extension-points/       # Extension point system
│   ├── ExtensionPoint.ts   # Extension point definition
│   ├── SlotRegistry.ts     # Slot registry
│   └── ComponentRegistry.ts # Component registry
├── router/                 # Router system
│   ├── PluginRoute.ts      # Plugin routes
│   └── RouteRegistry.ts    # Route registry
├── context/                # Global context
│   ├── FrameworkContext.ts # Framework context
│   └── PluginContext.ts    # Plugin context
└── types/                  # Type definitions
    ├── plugin.ts           # Plugin types
    └── extension.ts        # Extension types
```

#### 2.2.2 @objectos/ui-core Package

**Responsibilities**: Provide base UI components, layout system, theme system

**Main Modules**:

```typescript
@objectos/ui-core
├── layouts/                # Layout components
│   ├── MainLayout.tsx      # Main layout
│   ├── WorkspaceLayout.tsx # Workspace layout
│   └── SidebarLayout.tsx   # Sidebar layout
├── components/             # Base components
│   ├── ErrorBoundary.tsx   # Error boundary
│   ├── LoadingFallback.tsx # Loading fallback
│   └── ui/                 # Shadcn UI components
├── hooks/                  # Common hooks
│   ├── useFramework.ts     # Framework hook
│   ├── usePlugin.ts        # Plugin hook
│   └── useExtension.ts     # Extension hook
├── theme/                  # Theme system
│   ├── ThemeProvider.tsx   # Theme provider
│   └── themes/             # Theme configs
└── utils/                  # Utilities
    ├── cn.ts               # className merger
    └── lazy.ts             # Lazy loading utilities
```

---

## 3. Plugin System Design

### 3.1 Plugin Specification

#### 3.1.1 Plugin Interface Definition

```typescript
// @objectos/framework/types/plugin.ts

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  /** Unique plugin identifier */
  id: string;
  /** Plugin name */
  name: string;
  /** Plugin version */
  version: string;
  /** Plugin description */
  description?: string;
  /** Author information */
  author?: string;
  /** Plugin dependencies */
  dependencies?: string[];
  /** Plugin configuration schema */
  configSchema?: any;
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginLifecycle {
  /** Before plugin initialization */
  beforeInit?(): void | Promise<void>;
  /** Plugin initialization */
  onInit?(): void | Promise<void>;
  /** Plugin activation */
  onActivate?(): void | Promise<void>;
  /** Plugin deactivation */
  onDeactivate?(): void | Promise<void>;
  /** Plugin unload */
  onUnload?(): void | Promise<void>;
}

/**
 * Plugin contributions
 */
export interface PluginContributions {
  /** Registered components */
  components?: Record<string, React.ComponentType<any>>;
  /** Registered routes */
  routes?: PluginRoute[];
  /** Extension point implementations */
  extensions?: ExtensionContribution[];
  /** Menu items */
  menus?: MenuContribution[];
  /** Commands */
  commands?: CommandContribution[];
}

/**
 * Complete plugin interface
 */
export interface Plugin extends PluginLifecycle {
  /** Plugin metadata */
  metadata: PluginMetadata;
  /** Plugin contributions */
  contributions?: PluginContributions;
}
```

#### 3.1.2 Plugin Development Template

```typescript
// Plugin example: @objectos/plugin-advanced-grid

import { Plugin, ExtensionPoint } from '@objectos/framework';
import { AdvancedObjectGrid } from './components/AdvancedObjectGrid';

export const advancedGridPlugin: Plugin = {
  metadata: {
    id: 'advanced-grid',
    name: 'Advanced Object Grid',
    version: '1.0.0',
    description: 'Advanced object grid with virtual scrolling, grouping, and aggregation',
    author: 'ObjectOS Team',
    dependencies: ['@objectos/ui-core']
  },

  // Lifecycle hooks
  async onInit() {
    console.log('Advanced Grid Plugin initialized');
  },

  async onActivate() {
    console.log('Advanced Grid Plugin activated');
  },

  // Plugin contributions
  contributions: {
    // Register component to extension point
    extensions: [
      {
        point: 'objectos.views.objectList',
        id: 'advanced-grid-view',
        component: AdvancedObjectGrid,
        priority: 100, // High priority, replaces default
        metadata: {
          label: 'Advanced Grid View',
          description: 'Enhanced grid with grouping and aggregation'
        }
      }
    ],

    // Register menu items
    menus: [
      {
        id: 'toggle-advanced-grid',
        parent: 'view-options',
        label: 'Use Advanced Grid',
        command: 'advanced-grid.toggle'
      }
    ],

    // Register commands
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

### 3.2 Extension Point Mechanism

#### 3.2.1 Core Extension Points Definition

```typescript
// @objectos/framework/extension-points/core-extensions.ts

export const CORE_EXTENSION_POINTS = {
  // View extension points
  OBJECT_LIST_VIEW: 'objectos.views.objectList',        // Object list view
  OBJECT_DETAIL_VIEW: 'objectos.views.objectDetail',    // Object detail view
  OBJECT_FORM_VIEW: 'objectos.views.objectForm',        // Object form view
  DASHBOARD_VIEW: 'objectos.views.dashboard',           // Dashboard view

  // Component extension points
  FIELD_RENDERER: 'objectos.components.fieldRenderer',  // Field renderer
  FILTER_BUILDER: 'objectos.components.filterBuilder',  // Filter builder
  CHART_RENDERER: 'objectos.components.chartRenderer',  // Chart renderer

  // Feature extension points
  AUTH_PROVIDER: 'objectos.features.authProvider',      // Auth provider
  DATA_TRANSFORMER: 'objectos.features.dataTransformer',// Data transformer
  EXPORT_HANDLER: 'objectos.features.exportHandler',    // Export handler

  // Layout extension points
  SIDEBAR_ITEM: 'objectos.layout.sidebarItem',          // Sidebar item
  TOOLBAR_ITEM: 'objectos.layout.toolbarItem',          // Toolbar item
  ACTION_BUTTON: 'objectos.layout.actionButton',        // Action button
} as const;
```

#### 3.2.2 Extension Point Usage

```typescript
// Define extension point in framework
import { ExtensionSlot } from '@objectos/framework';

function ObjectListPage({ objectName }: { objectName: string }) {
  return (
    <div>
      <h1>Object List: {objectName}</h1>
      
      {/* Extension point: object list view */}
      <ExtensionSlot
        point="objectos.views.objectList"
        props={{ objectName }}
        fallback={<DefaultObjectGrid objectName={objectName} />}
      />
    </div>
  );
}

// ExtensionSlot implementation
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
  
  // Sort by priority and select the highest
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

### 3.3 Plugin Loading Mechanism

#### 3.3.1 Static Plugin Loading

```typescript
// apps/web/src/plugins/index.ts
import { PluginRegistry } from '@objectos/framework';
import authPlugin from '@objectos/plugin-auth';
import gridPlugin from '@objectos/plugin-grid';
import formPlugin from '@objectos/plugin-form';
import advancedGridPlugin from '@objectos/plugin-advanced-grid';

export function registerPlugins(registry: PluginRegistry) {
  // Register core plugins
  registry.register(authPlugin);
  registry.register(gridPlugin);
  registry.register(formPlugin);
  
  // Register third-party plugins
  registry.register(advancedGridPlugin);
}
```

#### 3.3.2 Dynamic Plugin Loading (Future)

```typescript
// Load remote plugin dynamically
async function loadRemotePlugin(url: string) {
  const module = await import(/* @vite-ignore */ url);
  const plugin = module.default;
  
  // Validate plugin
  if (!isValidPlugin(plugin)) {
    throw new Error('Invalid plugin format');
  }
  
  // Register plugin
  pluginRegistry.register(plugin);
}
```

---

## 4. Plugin Development Guide

### 4.1 Creating a New Plugin

#### Step 1: Initialize Plugin Project

```bash
# Using CLI (future feature)
npx @objectos/cli create-plugin my-advanced-grid

# Or manually
mkdir packages/plugin-advanced-grid
cd packages/plugin-advanced-grid
pnpm init
```

#### Step 2: Define Plugin Structure

```
packages/plugin-advanced-grid/
├── src/
│   ├── index.ts              # Plugin entry
│   ├── plugin.ts             # Plugin definition
│   ├── components/           # Components
│   │   ├── AdvancedGrid.tsx
│   │   └── GridToolbar.tsx
│   ├── hooks/                # Custom hooks
│   │   └── useGridState.ts
│   └── types/                # Type definitions
│       └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

#### Step 3: Implement Plugin

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

#### Step 4: Implement Component

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
      {/* Advanced grid implementation */}
      <table>
        {/* ... */}
      </table>
    </div>
  );
}
```

### 4.2 Plugin Configuration

```typescript
// Plugins can define configuration schema
export const plugin: Plugin = {
  metadata: {
    id: 'advanced-grid',
    configSchema: {
      type: 'object',
      properties: {
        enableVirtualScroll: {
          type: 'boolean',
          default: true,
          description: 'Enable virtual scrolling'
        },
        pageSize: {
          type: 'number',
          default: 50,
          description: 'Rows per page'
        },
        theme: {
          type: 'string',
          enum: ['light', 'dark', 'auto'],
          default: 'auto',
          description: 'Theme'
        }
      }
    }
  },

  async onInit() {
    // Read configuration
    const config = this.getConfig();
    console.log('Grid config:', config);
  }
};
```

### 4.3 Plugin Communication

#### 4.3.1 Event Bus

```typescript
// Use event bus for inter-plugin communication
import { useEventBus } from '@objectos/framework';

// Plugin A: Publish event
function PluginA() {
  const eventBus = useEventBus();
  
  const handleAction = () => {
    eventBus.emit('grid.rowSelected', { rowId: '123', data: {...} });
  };
  
  return <button onClick={handleAction}>Select Row</button>;
}

// Plugin B: Subscribe to event
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

#### 4.3.2 Shared State

```typescript
// Use framework-provided state management
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

## 5. Example: Replacing Standard Object Grid

### 5.1 Scenario

Developer wants to replace the standard object list view with an advanced grid component featuring:
- Virtual scrolling for large datasets
- Row grouping and aggregation
- Custom column renderers
- Export to Excel

### 5.2 Implementation Steps

#### Step 1: Create Plugin

```bash
mkdir packages/plugin-advanced-grid
cd packages/plugin-advanced-grid
```

#### Step 2: Install Dependencies

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

#### Step 3: Implement Advanced Grid Component

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

  // Generate column definitions from schema
  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (!schema) return [];
    
    return Object.entries(schema.fields).map(([fieldName, fieldConfig]) => ({
      id: fieldName,
      accessorKey: fieldName,
      header: fieldConfig.label || fieldName,
      // Support grouping and aggregation
      enableGrouping: true,
      aggregationFn: fieldConfig.type === 'number' ? 'sum' : 'count',
      // Custom cell rendering
      cell: (info) => {
        const value = info.getValue();
        // Render based on field type
        if (fieldConfig.type === 'currency') {
          return `$${value?.toFixed(2) || '0.00'}`;
        }
        return value;
      }
    }));
  }, [schema]);

  // Create table instance
  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getAggregatedRowModel: getAggregatedRowModel(),
  });

  // Virtual scroll container ref
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  // Virtualize rows
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
      {/* Toolbar */}
      <div className="grid-toolbar">
        <button onClick={() => exportToExcel(data)}>
          Export to Excel
        </button>
        <button onClick={() => table.toggleAllRowsExpanded()}>
          Toggle Grouping
        </button>
      </div>

      {/* Virtual scrolling table */}
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

// Export to Excel helper
function exportToExcel(data: any[]) {
  // Implementation
  console.log('Exporting to Excel:', data);
}
```

#### Step 4: Define Plugin

```typescript
// src/plugin.ts
import { Plugin } from '@objectos/framework';
import { AdvancedObjectGrid } from './components/AdvancedObjectGrid';

export const advancedGridPlugin: Plugin = {
  metadata: {
    id: 'advanced-grid',
    name: 'Advanced Object Grid',
    version: '1.0.0',
    description: 'Advanced object grid with virtual scrolling, grouping, and export',
    author: 'Your Name'
  },

  async onInit() {
    console.log('Advanced Grid Plugin initialized');
  },

  contributions: {
    // Register as object list view extension
    extensions: [
      {
        point: 'objectos.views.objectList',
        id: 'advanced-grid-view',
        component: AdvancedObjectGrid,
        priority: 100, // High priority, replaces default
        metadata: {
          label: 'Advanced Grid',
          description: 'Enhanced grid with virtual scrolling and grouping',
          icon: 'table'
        }
      }
    ],

    // Add menu item for toggling
    menus: [
      {
        id: 'view.toggle-advanced-grid',
        parent: 'view-options',
        label: 'Use Advanced Grid',
        command: 'advanced-grid.enable'
      }
    ],

    // Register commands
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
          // Trigger export logic
        }
      }
    ]
  }
};

export default advancedGridPlugin;
```

#### Step 5: Register Plugin in App

```typescript
// apps/web/src/main.tsx
import { PluginRegistry } from '@objectos/framework';
import advancedGridPlugin from '@objectos/plugin-advanced-grid';

const pluginRegistry = new PluginRegistry();

// Register plugin
pluginRegistry.register(advancedGridPlugin);

// Initialize all plugins
await pluginRegistry.initializeAll();

// Render app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <FrameworkProvider registry={pluginRegistry}>
    <App />
  </FrameworkProvider>
);
```

#### Step 6: Use in Page

```typescript
// apps/web/src/pages/objects/ObjectListRoute.tsx
import { ExtensionSlot } from '@objectos/framework';
import { DefaultObjectGrid } from '@objectos/ui-core';

export function ObjectListRoute({ objectName }: { objectName: string }) {
  return (
    <div className="object-list-page">
      <h1>{objectName}</h1>
      
      {/* Extension slot will automatically use advanced grid if registered with higher priority */}
      <ExtensionSlot
        point="objectos.views.objectList"
        props={{ objectName }}
        fallback={<DefaultObjectGrid objectName={objectName} />}
      />
    </div>
  );
}
```

### 5.3 Result

When users visit any object list page:
1. Framework looks up all registrations for `objectos.views.objectList` extension point
2. Sorts by priority (`advanced-grid-view` has priority 100)
3. Automatically uses `AdvancedObjectGrid` component to replace default grid
4. Users enjoy advanced features like virtual scrolling, grouping, and aggregation

---

## 6. Implementation Roadmap

### 6.1 Phase 1: Core Framework Setup (Week 1-2)

**Goal**: Establish basic plugin system architecture

**Tasks**:
1. Create `@objectos/framework` package
   - Plugin Registry (`PluginRegistry`)
   - Plugin Loader (`PluginLoader`)
   - Lifecycle Manager (`PluginLifecycle`)
   
2. Create `@objectos/ui-core` package
   - Extract common layout components
   - Extract base UI components
   - Implement `ExtensionSlot` component

3. Define core types
   - `Plugin` interface
   - `ExtensionPoint` interface
   - `PluginContribution` types

**Acceptance Criteria**:
- Can register and load simple plugins
- Plugin lifecycle hooks work correctly
- Extension point mechanism is functional

### 6.2 Phase 2: Core Plugin Migration (Week 3-4)

**Goal**: Split existing features into standard plugins

**Tasks**:
1. Create `@objectos/plugin-auth`
   - Migrate authentication logic
   - Provide auth hooks and components

2. Create `@objectos/plugin-grid`
   - Migrate `ObjectGrid` component
   - Register to `objectos.views.objectList` extension point

3. Create `@objectos/plugin-form`
   - Migrate `ObjectForm` component
   - Register to `objectos.views.objectForm` extension point

4. Create `@objectos/plugin-dashboard`
   - Migrate dashboard-related components

**Acceptance Criteria**:
- Original features work normally after plugin migration
- All tests pass
- Application starts and runs without issues

### 6.3 Phase 3: Extension Point Enhancement (Week 5-6)

**Goal**: Implement complete extension point system

**Tasks**:
1. Define all core extension points
   - View extension points
   - Component extension points
   - Feature extension points
   - Layout extension points

2. Implement extension point priority mechanism
   - Support multiple extensions coexisting
   - Support extension selection and switching

3. Implement plugin communication
   - Event Bus (`EventBus`)
   - Shared State (`SharedState`)

**Acceptance Criteria**:
- All extension points are documented
- Extension replacement mechanism works
- Plugins can communicate normally

### 6.4 Phase 4: Developer Tools (Week 7-8)

**Goal**: Provide plugin development toolchain

**Tasks**:
1. Create plugin development template
   - TypeScript template
   - Include best practices

2. Write plugin development documentation
   - Quick start guide
   - API reference
   - Best practices

3. Implement plugin debugging tools
   - Plugin state viewer
   - Extension point inspector

4. Create example plugins
   - Simple plugin example
   - Advanced plugin example (like the grid in this doc)

**Acceptance Criteria**:
- Developers can quickly create plugins
- Documentation is clear and complete
- Example code is runnable

### 6.5 Phase 5: Testing and Optimization (Week 9-10)

**Goal**: Ensure framework stability and performance

**Tasks**:
1. Write unit tests
   - Plugin system tests
   - Extension point tests

2. Write integration tests
   - Plugin loading tests
   - Plugin interaction tests

3. Performance optimization
   - Plugin lazy loading
   - Code splitting

4. Security hardening
   - Plugin sandbox (isolation)
   - Permission control

**Acceptance Criteria**:
- Test coverage reaches 80%+
- No significant increase in app startup time
- Plugins load on-demand

---

## 7. Plugin Ecosystem Planning

### 7.1 Official Plugins

| Plugin Name | Description | Priority |
|-------------|-------------|----------|
| `@objectos/plugin-auth` | Authentication and authorization | High |
| `@objectos/plugin-grid` | Standard object grid | High |
| `@objectos/plugin-form` | Standard object form | High |
| `@objectos/plugin-dashboard` | Dashboard view | High |
| `@objectos/plugin-chart` | Chart components | Medium |
| `@objectos/plugin-kanban` | Kanban view | Medium |
| `@objectos/plugin-calendar` | Calendar view | Medium |
| `@objectos/plugin-workflow` | Workflow engine | Low |
| `@objectos/plugin-import-export` | Data import/export | Low |

### 7.2 Community Plugins (Examples)

| Plugin Name | Description | Author |
|-------------|-------------|--------|
| `@company/plugin-advanced-grid` | Advanced grid (virtual scroll, grouping) | Third-party |
| `@company/plugin-gantt` | Gantt chart view | Third-party |
| `@company/plugin-ai-assistant` | AI assistant | Third-party |
| `@company/plugin-custom-theme` | Custom theme | Third-party |

### 7.3 Plugin Discovery and Distribution

**Short-term** (Static loading):
- Plugins distributed via npm packages
- Manually registered in app

**Mid-term** (Plugin marketplace):
- Create plugin marketplace website
- Browse and search plugins online
- Provide installation guide

**Long-term** (Dynamic loading):
- Support runtime plugin installation
- Plugin sandbox and permission management
- Auto-update mechanism

---

## 8. Backward Compatibility Strategy

### 8.1 Compatibility Guarantees

1. **API Compatibility**: Existing public APIs remain unchanged
2. **Component Compatibility**: Existing components can still be imported and used
3. **Route Compatibility**: Existing route structure stays the same
4. **Config Compatibility**: Existing config files continue to work

### 8.2 Migration Path

```typescript
// Old code (still supported)
import { ObjectGrid } from '@objectos/ui';

function MyPage() {
  return <ObjectGrid objectName="contacts" />;
}

// New code (recommended)
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

### 8.3 Deprecation Plan

- **Phase 1** (v0.3.0): Introduce framework, mark old APIs as Deprecated
- **Phase 2** (v0.4.0): Provide automatic migration tool
- **Phase 3** (v1.0.0): Remove old APIs (major version upgrade)

---

## 9. Performance Considerations

### 9.1 Plugin Lazy Loading

```typescript
// Use dynamic imports for lazy loading plugins
const lazyPlugins = {
  'advanced-grid': () => import('@objectos/plugin-advanced-grid'),
  'kanban': () => import('@objectos/plugin-kanban'),
  'calendar': () => import('@objectos/plugin-calendar')
};

// Load only when needed
async function loadPlugin(id: string) {
  const loader = lazyPlugins[id];
  if (!loader) return;
  
  const module = await loader();
  pluginRegistry.register(module.default);
}
```

### 9.2 Code Splitting

```typescript
// Vite configuration
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

### 9.3 Performance Metrics

| Metric | Target |
|--------|--------|
| First screen load time | < 2s |
| Plugin load time | < 500ms |
| Extension point resolution | < 50ms |
| Memory overhead increase | < 10% |

---

## 10. Security Considerations

### 10.1 Plugin Isolation

```typescript
// Plugin sandbox (future feature)
class PluginSandbox {
  execute(plugin: Plugin, context: PluginContext) {
    // Limit plugin access scope
    const sandbox = {
      console: createSafeConsole(),
      fetch: createSafeFetch(),
      // Don't expose window, document, etc.
    };
    
    // Execute plugin code in isolated environment
    return executeSandboxed(plugin, sandbox, context);
  }
}
```

### 10.2 Permission Control

```typescript
// Plugin permission declaration
export const plugin: Plugin = {
  metadata: {
    id: 'advanced-grid',
    permissions: [
      'read:objects',      // Read object data
      'write:preferences', // Write user preferences
      'network:export'     // Network requests (export)
    ]
  }
};

// Runtime permission check
if (!context.hasPermission('network:export')) {
  throw new PermissionError('Plugin does not have export permission');
}
```

### 10.3 Code Review

- Official plugins: Pass code review and security scanning
- Community plugins: Require certification process
- Uncertified plugins: Display security warning

---

## 11. Documentation and Examples

### 11.1 Documentation Structure

```
docs/
├── framework/
│   ├── README.md                 # Framework overview
│   ├── plugin-development.md    # Plugin development guide
│   ├── extension-points.md      # Extension point reference
│   ├── api-reference.md         # API reference
│   └── best-practices.md        # Best practices
├── plugins/
│   ├── official-plugins.md      # Official plugin list
│   ├── plugin-auth.md           # Auth plugin docs
│   ├── plugin-grid.md           # Grid plugin docs
│   └── ...
└── examples/
    ├── simple-plugin/           # Simple plugin example
    ├── advanced-grid/           # Advanced grid example
    └── custom-theme/            # Custom theme example
```

### 11.2 Example Code Repository

```
examples/
├── simple-hello-world/          # Simplest plugin
├── advanced-grid-plugin/        # Advanced grid plugin
├── custom-field-renderer/       # Custom field renderer
├── custom-theme/                # Custom theme
└── multi-plugin-app/            # Multi-plugin integration app
```

---

## 12. Summary

### 12.1 Core Advantages

1. **Flexibility**: Extend any feature through plugins
2. **Maintainability**: Keep core framework minimal
3. **Extensibility**: Community can contribute plugins
4. **Type Safety**: Full TypeScript support
5. **Performance**: On-demand loading, code splitting

### 12.2 Implementation Key Points

1. **Progressive Transformation**: Gradually migrate existing features to plugins
2. **Maintain Compatibility**: Ensure existing apps continue working
3. **Documentation First**: Perfect documentation and examples first
4. **Community Participation**: Encourage community to contribute plugins

### 12.3 Success Metrics

- **Development Efficiency**: New feature development time reduced by 50%
- **Code Quality**: Core framework code reduced by 30%
- **Community Activity**: At least 10 community plugins
- **User Satisfaction**: Plugin usage rate > 80%

---

## Appendix A: Core API Reference

### PluginRegistry API

```typescript
class PluginRegistry {
  /** Register plugin */
  register(plugin: Plugin): void;
  
  /** Unregister plugin */
  unregister(pluginId: string): void;
  
  /** Get plugin */
  getPlugin(pluginId: string): Plugin | undefined;
  
  /** Get all plugins */
  getAllPlugins(): Plugin[];
  
  /** Initialize all plugins */
  async initializeAll(): Promise<void>;
  
  /** Activate plugin */
  async activate(pluginId: string): Promise<void>;
  
  /** Deactivate plugin */
  async deactivate(pluginId: string): Promise<void>;
}
```

### ExtensionPoint API

```typescript
interface ExtensionPoint {
  /** Extension point ID */
  id: string;
  
  /** Extension point description */
  description?: string;
  
  /** Register extension */
  register(extension: Extension): void;
  
  /** Get all extensions */
  getExtensions(): Extension[];
  
  /** Get active extension with highest priority */
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

## Appendix B: Extension Point Checklist

| Extension Point ID | Description | Accepted Props | Default Implementation |
|--------------------|-------------|----------------|------------------------|
| `objectos.views.objectList` | Object list view | `{ objectName: string }` | `ObjectGrid` |
| `objectos.views.objectDetail` | Object detail view | `{ objectName: string, recordId: string }` | `ObjectDetailView` |
| `objectos.views.objectForm` | Object form view | `{ objectName: string, recordId?: string }` | `ObjectForm` |
| `objectos.components.fieldRenderer` | Field renderer | `{ field: FieldConfig, value: any }` | `DefaultFieldRenderer` |
| `objectos.components.filterBuilder` | Filter builder | `{ objectName: string, onFilterChange: Function }` | `DefaultFilterBuilder` |
| `objectos.layout.sidebarItem` | Sidebar item | `{ item: MenuItem }` | `DefaultSidebarItem` |

---

## Appendix C: FAQ

**Q1: How do plugins access backend APIs?**

A: Plugins can use the API client provided by the framework:

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

**Q2: How do plugins store configuration?**

A: Use the configuration API provided by the framework:

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

**Q3: How to debug plugins?**

A: Use React DevTools and framework-provided debugging tools:

```typescript
// In browser console
window.__OBJECTOS_DEBUG__.plugins // View all plugins
window.__OBJECTOS_DEBUG__.extensions // View all extension points
window.__OBJECTOS_DEBUG__.events // View event log
```

---

## Appendix D: Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-13 | Initial version |

---

**Maintained by**: ObjectOS Team  
**Last Updated**: 2026-01-13  
**Feedback**: GitHub Issues / Discord
