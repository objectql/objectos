# Enhanced Form Components - Quick Reference

## Component Overview

### FormSection
```tsx
<FormSection 
  title="Personal Information"
  description="Enter your basic details"
  icon={User}
  collapsible={true}
  columns={2}
>
  {/* Your fields here */}
</FormSection>
```

**Key Features:**
- 🎨 Collapsible sections
- 🎯 Icon support
- 📐 1 or 2 column layouts
- 📝 Descriptions

---

### FormActions
```tsx
<FormActions
  onSave={handleSave}
  onSaveAndNew={handleSaveAndNew}
  onCancel={handleCancel}
  isSubmitting={isSubmitting}
  errorCount={errorCount}
/>
```

**Key Features:**
- 💾 Save button
- ➕ Save & New workflow
- ❌ Cancel button
- ⏳ Loading states
- ⚠️ Error feedback

---

### DynamicForm
```tsx
<DynamicForm
  objectConfig={config}
  onSubmit={handleSubmit}
  sections={sections}
  fieldDependencies={dependencies}
  realtimeValidation={true}
/>
```

**Key Features:**
- 🤖 Auto-generate from metadata
- 📋 Section layouts
- 📑 Tab layouts
- 🔄 Conditional fields
- ✅ Zod validation
- ⚡ Real-time validation

---

## Quick Start

### Installation
```bash
npm install @objectos/ui
```

### Import
```tsx
import { 
  FormSection, 
  FormActions, 
  DynamicForm 
} from '@objectos/ui'
```

### Simple Example
```tsx
import { DynamicForm } from '@objectos/ui'

const config = {
  name: 'user',
  fields: {
    name: { type: 'text', label: 'Name', required: true },
    email: { type: 'email', label: 'Email', required: true }
  }
}

function MyForm() {
  return (
    <DynamicForm
      objectConfig={config}
      onSubmit={data => console.log(data)}
    />
  )
}
```

---

## Use Cases

| Component | Best For |
|-----------|----------|
| **FormSection** | Organizing long forms into logical groups |
| **FormActions** | Consistent form buttons across your app |
| **DynamicForm** | Metadata-driven CRUD operations |

---

## Documentation

📚 **Full Guide**: See [ENHANCED_FORM_COMPONENTS.md](./ENHANCED_FORM_COMPONENTS.md)

📂 **Examples**: See [examples/](./examples/) directory

---

## Architecture

```
┌─────────────────────────────────────────┐
│           DynamicForm                    │
│  (Metadata-driven orchestrator)         │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  FormSection 1                     │ │
│  │  ├─ Field 1                        │ │
│  │  ├─ Field 2                        │ │
│  │  └─ Field 3                        │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  FormSection 2 (Collapsible)       │ │
│  │  ├─ Field 4                        │ │
│  │  └─ Field 5 (Conditional)          │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  FormActions                       │ │
│  │  [Cancel] [Save & New] [Save]      │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Features Comparison

| Feature | ObjectForm | DynamicForm |
|---------|-----------|-------------|
| Auto-generate fields | ✅ | ✅ |
| Validation | ✅ Basic | ✅ Zod schema |
| Sections | ❌ | ✅ |
| Tabs | ❌ | ✅ |
| Conditional fields | ❌ | ✅ |
| Field dependencies | ❌ | ✅ |
| Save & New | ❌ | ✅ |
| Real-time validation | ❌ | ✅ |

**Migration**: DynamicForm is a drop-in replacement for ObjectForm with optional advanced features.

---

## Testing

```bash
cd packages/ui
npm test
```

- ✅ 28 tests passing
- ✅ FormSection: 10 tests
- ✅ FormActions: 18 tests

---

## Contributing

Follow ObjectOS coding standards:
- Use TypeScript strict mode
- Include JSDoc comments
- Add tests for new features
- Update documentation
