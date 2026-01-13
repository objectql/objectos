# Frontend Plugin Framework - Visual Summary

## 🎯 What Problem Are We Solving?

**Current State (Monolithic)**:
```
┌─────────────────────────────────────┐
│     apps/web (Everything mixed)     │
│  - Auth logic                        │
│  - Grid components                   │
│  - Form components                   │
│  - Dashboard components              │
│  - Chart components                  │
│  - All tightly coupled               │
└─────────────────────────────────────┘
```
**Problems:**
- Hard to customize specific features
- Can't replace components easily
- Difficult to add new views
- Community can't contribute easily

**Future State (Plugin-Based)**:
```
┌─────────────────────────────────────────────────────┐
│         apps/web (Minimal Shell)                     │
│         - Plugin Loader                              │
│         - Extension Point Router                     │
└────────────────┬────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───▼────────┐        ┌───────▼────────┐
│  Official  │        │   Community    │
│  Plugins   │        │   Plugins      │
├────────────┤        ├────────────────┤
│ - Auth     │        │ - Advanced     │
│ - Grid     │        │   Grid         │
│ - Form     │        │ - Gantt Chart  │
│ - Dashboard│        │ - AI Assistant │
└────────────┘        └────────────────┘
```
**Benefits:**
- ✅ Easy to customize and replace
- ✅ Community can contribute
- ✅ Core stays minimal and maintainable
- ✅ Features loaded on-demand

---

## 🏗️ Architecture: The 4 Layers

```
┌────────────────────────────────────────────────────────┐
│  LAYER 4: Application                                  │
│  apps/web - Thin shell that loads plugins              │
└──────────────────────┬─────────────────────────────────┘
                       │
┌──────────────────────┴─────────────────────────────────┐
│  LAYER 3: Plugins (The Features)                       │
│  @objectos/plugin-auth    @objectos/plugin-grid        │
│  @objectos/plugin-form    @objectos/plugin-chart       │
│  @company/plugin-advanced-grid (3rd party!)            │
└──────────────────────┬─────────────────────────────────┘
                       │
┌──────────────────────┴─────────────────────────────────┐
│  LAYER 2: Core Framework (The Infrastructure)          │
│  @objectos/framework        @objectos/ui-core          │
│  - PluginRegistry           - Base Components          │
│  - ExtensionSlot            - Layouts                  │
│  - EventBus                 - Theme System             │
└──────────────────────┬─────────────────────────────────┘
                       │
┌──────────────────────┴─────────────────────────────────┐
│  LAYER 1: Runtime (Backend - Unchanged)                │
│  @objectos/kernel           @objectos/server           │
└────────────────────────────────────────────────────────┘
```

---

## 🔌 How Plugins Work: Extension Points

### Example: Replacing the Object Grid

**Step 1: Framework defines an extension point**
```typescript
// In apps/web/src/pages/ObjectListPage.tsx
<ExtensionSlot 
  point="objectos.views.objectList"  // 🎯 Extension point ID
  props={{ objectName: "contacts" }}
  fallback={<DefaultGrid />}          // Default if no plugin
/>
```

**Step 2: Plugin registers to that point**
```typescript
// In @objectos/plugin-advanced-grid
export const plugin: Plugin = {
  metadata: { id: 'advanced-grid', version: '1.0.0' },
  contributions: {
    extensions: [{
      point: 'objectos.views.objectList',  // 🎯 Same ID
      component: AdvancedGrid,              // Your custom component
      priority: 100                         // Higher = wins
    }]
  }
};
```

**Step 3: Framework automatically uses the plugin**
```
User visits /contacts
  ↓
Framework looks up "objectos.views.objectList"
  ↓
Finds: DefaultGrid (priority: 0) and AdvancedGrid (priority: 100)
  ↓
Renders AdvancedGrid (highest priority wins!)
```

---

## 📦 Core Extension Points

| Extension Point ID | Purpose | Default Component |
|--------------------|---------|-------------------|
| `objectos.views.objectList` | List view for objects | `ObjectGrid` |
| `objectos.views.objectDetail` | Detail view for records | `ObjectDetailView` |
| `objectos.views.objectForm` | Form for create/edit | `ObjectForm` |
| `objectos.components.fieldRenderer` | How to render a field | `DefaultFieldRenderer` |
| `objectos.components.filterBuilder` | Query filter UI | `DefaultFilterBuilder` |
| `objectos.layout.sidebarItem` | Sidebar menu items | `DefaultSidebarItem` |

**Any of these can be replaced by a plugin!**

---

## 💡 Real Example: Advanced Grid Plugin

### What We Want to Build

Replace the standard object list table with an advanced one that has:
- ✨ Virtual scrolling (handle 100k+ rows)
- 📊 Grouping and aggregation
- 📥 Export to Excel
- 🎨 Custom cell renderers

### The Code

**1. Create the plugin structure**
```
packages/plugin-advanced-grid/
├── src/
│   ├── plugin.ts              # Plugin definition
│   ├── components/
│   │   └── AdvancedGrid.tsx   # The grid component
│   └── index.ts
└── package.json
```

**2. Define the plugin** (`src/plugin.ts`)
```typescript
import { Plugin } from '@objectos/framework';
import { AdvancedGrid } from './components/AdvancedGrid';

export const advancedGridPlugin: Plugin = {
  metadata: {
    id: 'advanced-grid',
    name: 'Advanced Object Grid',
    version: '1.0.0',
    description: 'Grid with virtual scrolling and grouping'
  },
  
  contributions: {
    extensions: [{
      point: 'objectos.views.objectList',  // Replace list view
      component: AdvancedGrid,
      priority: 100  // Higher than default (0)
    }],
    
    commands: [{
      id: 'advanced-grid.export',
      label: 'Export to Excel',
      handler: (ctx) => exportToExcel(ctx.data)
    }]
  }
};
```

**3. Implement the component** (`src/components/AdvancedGrid.tsx`)
```typescript
import { useReactTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useObjectData } from '@objectos/ui-core';

export function AdvancedGrid({ objectName }: { objectName: string }) {
  const { data } = useObjectData(objectName);
  
  const table = useReactTable({
    data,
    columns: generateColumns(objectName),
    // ... table config
  });
  
  const virtualizer = useVirtualizer({
    count: data.length,
    estimateSize: () => 35,
    // ... virtualizer config
  });
  
  return (
    <div>
      <table>
        {/* Render virtual rows */}
      </table>
    </div>
  );
}
```

**4. Register the plugin** (`apps/web/src/main.tsx`)
```typescript
import { PluginRegistry } from '@objectos/framework';
import advancedGridPlugin from '@objectos/plugin-advanced-grid';

const registry = new PluginRegistry();
registry.register(advancedGridPlugin);  // That's it!
```

**Result:** Every object list page now uses AdvancedGrid automatically! 🎉

---

## 🗺️ Implementation Roadmap

### Phase 1: Foundation (Week 1-2) 🏗️
- Create `@objectos/framework` package
- Implement `PluginRegistry` and `ExtensionSlot`
- Define core types

**Deliverable:** Can load a simple "Hello World" plugin

---

### Phase 2: Migration (Week 3-4) 📦
- Create `@objectos/plugin-auth`
- Create `@objectos/plugin-grid`
- Create `@objectos/plugin-form`
- Move existing code into plugins

**Deliverable:** App works same as before, but with plugins

---

### Phase 3: Extension Points (Week 5-6) 🔌
- Define all 10+ core extension points
- Implement priority mechanism
- Add event bus for plugin communication

**Deliverable:** Plugins can replace any UI component

---

### Phase 4: Developer Experience (Week 7-8) 📚
- Write plugin development guide
- Create CLI tool for scaffolding
- Build example plugins
- Set up plugin debugging tools

**Deliverable:** Easy for developers to create plugins

---

### Phase 5: Polish (Week 9-10) ✨
- Add lazy loading for plugins
- Optimize bundle size
- Write tests (80% coverage)
- Performance benchmarks

**Deliverable:** Production-ready plugin system

---

## 🎯 Success Metrics

| Metric | Target |
|--------|--------|
| Core framework size | -30% code reduction |
| Plugin load time | < 500ms per plugin |
| New feature dev time | -50% (with plugins) |
| Community plugins | 10+ within 6 months |
| Test coverage | 80%+ |

---

## 🚀 Quick Start (After Implementation)

**For Plugin Users:**
```bash
# Install a community plugin
pnpm add @company/plugin-advanced-grid

# Register it
import advancedGrid from '@company/plugin-advanced-grid';
registry.register(advancedGrid);
```

**For Plugin Developers:**
```bash
# Create new plugin
npx @objectos/cli create-plugin my-plugin

# Develop
cd packages/plugin-my-plugin
pnpm dev

# Publish
pnpm build
npm publish
```

---

## ❓ FAQ

**Q: Will this break existing apps?**  
A: No! We maintain backward compatibility. Old code continues to work.

**Q: Do I have to use plugins?**  
A: No! The framework provides default implementations for everything.

**Q: Can plugins talk to each other?**  
A: Yes! Via EventBus and SharedState APIs.

**Q: How do I debug plugins?**  
A: Use React DevTools + built-in plugin inspector:
```typescript
window.__OBJECTOS_DEBUG__.plugins
window.__OBJECTOS_DEBUG__.extensions
```

**Q: Can plugins be loaded dynamically?**  
A: Phase 1 uses static imports. Dynamic loading comes in Phase 2 (future).

**Q: What about security?**  
A: Official plugins are reviewed. Community plugins require certification. Future: plugin sandbox.

---

## 📚 More Information

- **Full Chinese Design:** [FRONTEND_PLUGIN_FRAMEWORK.md](../FRONTEND_PLUGIN_FRAMEWORK.md)
- **Full English Design:** [FRONTEND_PLUGIN_FRAMEWORK_EN.md](../FRONTEND_PLUGIN_FRAMEWORK_EN.md)
- **Main README:** [README.md](./README.md)

---

**Ready to Review?** 👀  
Please read the full design documents and provide feedback!
