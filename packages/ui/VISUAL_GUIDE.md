# ObjectQL Airtable-like UI - Visual Guide

## 🎨 UI Components Showcase

### GridView Component
The star of this implementation - an Airtable-style grid with powerful features:

**Features:**
- ✨ Inline editing for text, number, and date fields
- 🎯 Click cells to edit directly
- ⌨️ Keyboard shortcuts (Enter to save, Escape to cancel)
- 🎨 Type-specific rendering (badges, dates, checkboxes)
- 🗑️ Delete actions on row hover
- 📱 Responsive design

**Field Types Supported:**
- `text` - Plain text (editable)
- `number` - Numeric values (editable)
- `date` - Date fields with formatting (editable)
- `badge` - Status indicators with colors (read-only in grid)
- `select` - Dropdown values (read-only in grid)
- `boolean` - Checkboxes (read-only in grid)

**Visual Representation:**
```
┌─────────────────────────────────────────────────────────────┐
│ Project Name    │ Status  │ Priority │ Start Date │ Budget │
├─────────────────────────────────────────────────────────────┤
│ Website Redesign│ Active  │ High     │ 2024-01-15 │ 50000  │
│ Mobile App Dev  │ Active  │ High     │ 2024-02-01 │ 120000 │
│ Marketing       │ Pending │ Medium   │ 2024-03-10 │ 25000  │
└─────────────────────────────────────────────────────────────┘
     ↑ Editable      ↑ Badge   ↑ Badge     ↑ Date      ↑ Edit
```

### Badge Component
Color-coded status indicators:

```
┌─────────────────────────────┐
│ Success │ Warning │ Danger  │
│ Active  │ Pending │ Overdue │
│ Info    │ Default │         │
└─────────────────────────────┘
```

**Color Variants:**
- 🟢 `success` - Green for positive states
- 🟡 `warning` - Yellow for attention needed
- 🔴 `danger` - Red for critical/errors
- 🔵 `info` - Blue for informational
- ⚪ `default` - Gray for neutral

### Toolbar Component
Navigation and actions header:

```
┌──────────────────────────────────────────────────────────┐
│ Projects Database              [Grid] [List]  [+] New   │
│ 120 records                    [↻] Refresh   [⚙] Filter│
└──────────────────────────────────────────────────────────┘
     ↑ Title & subtitle           ↑ View switcher   ↑ Actions
```

### ViewSwitcher Component
Toggle between different view modes:

```
┌─────────────────┐
│ [Grid] [List]   │  ← Active view highlighted
└─────────────────┘
```

## 🎯 Dashboard Views

### Table View (Traditional)
```
┌──────────────────────────────────────────────┐
│ Name         │ Email        │ Status        │
├──────────────────────────────────────────────┤
│ John Doe     │ john@...     │ Active        │
│ Jane Smith   │ jane@...     │ Pending       │
└──────────────────────────────────────────────┘
```

### Grid View (Airtable-style)
```
┌──────────────────────────────────────────────┐
│ Name       │Status │Priority│Date  │Actions│
├──────────────────────────────────────────────┤
│ [Edit me] │ Active│  High  │01/15 │  🗑️   │
│ Project 2 │Pending│ Medium │02/01 │  🗑️   │
└──────────────────────────────────────────────┘
     ↑ Click to edit inline
```

## 📊 Complete Application Layout

```
┌─────────────────────────────────────────────────────────────┐
│ ┌──────────┐  ┌────────────────────────────────────────┐   │
│ │ ObjectQL │  │ Projects Database    [Views] [Actions]  │   │
│ │ 🗄️ Data  │  ├────────────────────────────────────────┤   │
│ │ Browser  │  │                                         │   │
│ ├──────────┤  │   ┌─────────────────────────────────┐  │   │
│ │          │  │   │ GridView with inline editing    │  │   │
│ │Projects ▶│  │   ├─────────────────────────────────┤  │   │
│ │Tasks     │  │   │ Name    │Status │Priority│Date  │  │   │
│ │Contacts  │  │   ├─────────────────────────────────┤  │   │
│ │          │  │   │ [Data rows with badges, dates]  │  │   │
│ ├──────────┤  │   └─────────────────────────────────┘  │   │
│ │Settings  │  │                                         │   │
│ ├──────────┤  └────────────────────────────────────────┘   │
│ │ 👤 Admin │                                               │
│ │ Logout   │                                               │
│ └──────────┘                                               │
└─────────────────────────────────────────────────────────────┘
   ↑ Sidebar        ↑ Main content area with GridView
```

## 🎨 Color Palette

The new design uses a consistent **stone** color scheme:

```
stone-50   #fafaf9 ░░░░ Background
stone-100  #f5f5f4 ▒▒▒▒ Borders light
stone-200  #e7e5e4 ▓▓▓▓ Borders strong
stone-600  #57534e ████ Secondary text
stone-900  #1c1917 ████ Primary text
```

## 🔧 Field Components

### SelectField
```
┌─────────────────────┐
│ Status              │
│ ┌─────────────────┐ │
│ │ Select option ▼ │ │
│ └─────────────────┘ │
└─────────────────────┘
```

### DateField
```
┌─────────────────────┐
│ Start Date          │
│ ┌─────────────────┐ │
│ │ 2024-01-15  📅  │ │
│ └─────────────────┘ │
└─────────────────────┘
```

### BadgeField
```
┌─────────────────────┐
│ Priority            │
│ [High] [Medium] [Low]│ ← Click to select
└─────────────────────┘
```

## 💡 Usage Patterns

### Basic GridView Setup
```tsx
const columns = [
  { id: 'name', label: 'Name', type: 'text', editable: true },
  { id: 'status', label: 'Status', type: 'badge', options: [...] }
]

<GridView
  columns={columns}
  data={data}
  onCellEdit={(row, col, value) => updateData(row, col, value)}
  onRowClick={(row) => navigate(`/detail/${row.id}`)}
  onDelete={(row) => deleteRecord(row)}
/>
```

### Complete Page with Toolbar
```tsx
<div className="flex flex-col h-screen">
  <Toolbar title="Projects" subtitle="120 records">
    <ViewSwitcher views={views} activeView="grid" />
    <Button onClick={handleRefresh}>Refresh</Button>
    <Button onClick={handleCreate}>New</Button>
  </Toolbar>
  
  <GridView columns={columns} data={data} />
</div>
```

## 📱 Responsive Behavior

### Desktop (≥1024px)
- Full sidebar visible
- Wide grid columns
- All actions visible

### Tablet (768px - 1023px)
- Collapsible sidebar
- Adjusted column widths
- Compact toolbar

### Mobile (<768px)
- Hidden sidebar (toggle button)
- Stacked layout
- Touch-optimized

## ⌨️ Keyboard Shortcuts

In GridView:
- `Click` - Start editing cell (if editable)
- `Enter` - Save changes
- `Escape` - Cancel editing
- `Tab` - Navigate between fields (in modals)

## 🎯 Empty States

### No Data
```
┌─────────────────────────────────┐
│                                 │
│         🗄️                      │
│    No records found             │
│                                 │
│  [Create First Record]          │
│                                 │
└─────────────────────────────────┘
```

### Loading
```
┌─────────────────────────────────┐
│                                 │
│         ⏳                      │
│    Loading data...              │
│                                 │
└─────────────────────────────────┘
```

### Error
```
┌─────────────────────────────────┐
│                                 │
│         ⚠️                      │
│    Error loading data           │
│    [Try Again]                  │
│                                 │
└─────────────────────────────────┘
```

## 🚀 Getting Started

1. **Import components:**
```tsx
import {
  GridView,
  Toolbar,
  ViewSwitcher,
  Badge,
  Select,
  Popover
} from '@objectql/ui'
```

2. **Define columns:**
```tsx
const columns = [
  { id: 'name', label: 'Name', type: 'text', width: 200, editable: true },
  { id: 'status', label: 'Status', type: 'badge', width: 120 }
]
```

3. **Render GridView:**
```tsx
<GridView columns={columns} data={data} />
```

## 📚 Documentation

- **AIRTABLE_GUIDE.md** - Complete usage guide
- **AIRTABLE_IMPLEMENTATION.md** - Technical details
- **AIRTABLE_UI_SUMMARY_CN.md** - 中英文总结
- **examples/airtable-example.tsx** - Working example

## ✨ Live Example

See the complete example in `packages/ui/examples/airtable-example.tsx` which demonstrates:
- All field types
- Inline editing
- View switching
- Create/edit modals
- Delete functionality

---

**Built with:** React 18, TypeScript, Tailwind CSS, TanStack Table

**License:** MIT
