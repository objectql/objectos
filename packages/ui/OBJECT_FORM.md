# ObjectForm - Metadata-Driven Form Component

## Overview

`ObjectForm` is a powerful, metadata-driven form component that automatically generates form fields based on ObjectQL object metadata (`ObjectConfig`). This component eliminates the need to manually create form fields for each property and handles validation automatically based on field configuration.

## Features

- **Automatic Field Generation**: Form fields are automatically generated from `ObjectConfig.fields`
- **Type-Aware Validation**: Each field type gets appropriate validation rules
- **Built-in Validation**: 
  - Required fields
  - Min/max values for numbers
  - Min/max length for text
  - Email and URL format validation
  - Custom regex patterns
- **Smart Layout**: Automatically determines field width (full-width for textarea, markdown, etc.)
- **React Hook Form Integration**: Built on react-hook-form for robust form management
- **TypeScript Support**: Full type safety with ObjectQL types
- **Flexible Configuration**: Customize columns, button text, and more

## Installation

The component is part of `@objectos/ui` package:

```bash
npm install @objectos/ui
```

## Basic Usage

```tsx
import { ObjectForm } from '@objectos/ui';
import type { ObjectConfig } from '@objectql/types';

// Define your object metadata
const userConfig: ObjectConfig = {
  name: 'user',
  label: 'User',
  fields: {
    name: {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      required: true,
      max_length: 100,
    },
    email: {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
    },
    bio: {
      name: 'bio',
      label: 'Biography',
      type: 'textarea',
      max_length: 500,
    },
    is_active: {
      name: 'is_active',
      label: 'Active',
      type: 'boolean',
      defaultValue: true,
    },
  },
};

function UserForm() {
  const handleSubmit = async (data: Record<string, any>) => {
    // Submit to API
    await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  return (
    <ObjectForm
      objectConfig={userConfig}
      onSubmit={handleSubmit}
      submitText="Create User"
    />
  );
}
```

## Props

### ObjectFormProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `objectConfig` | `ObjectConfig` | **Required** | Object metadata configuration |
| `onSubmit` | `(data: Record<string, any>) => void \| Promise<void>` | **Required** | Callback when form is submitted |
| `initialValues` | `Record<string, any>` | `{}` | Initial form values (for editing) |
| `onCancel` | `() => void` | - | Callback when cancel button is clicked |
| `isSubmitting` | `boolean` | `false` | Whether form is in submitting state |
| `submitText` | `string` | `'Save'` | Text for submit button |
| `cancelText` | `string` | `'Cancel'` | Text for cancel button |
| `hideCancelButton` | `boolean` | `false` | Hide the cancel button |
| `className` | `string` | - | Additional CSS classes |
| `columns` | `1 \| 2` | `2` | Number of columns in form grid |
| `formRef` | `React.MutableRefObject<UseFormReturn \| null>` | - | Ref to access form methods |

## Field Type Support

All ObjectQL field types are supported with appropriate input components:

### Text Fields

```tsx
{
  name: { type: 'text', label: 'Name', max_length: 100 },
  email: { type: 'email', label: 'Email' },
  phone: { type: 'phone', label: 'Phone' },
  url: { type: 'url', label: 'Website' },
  password: { type: 'password', label: 'Password' },
}
```

### Textarea Fields

```tsx
{
  description: { 
    type: 'textarea', 
    label: 'Description',
    max_length: 500,
  },
}
```

### Boolean Fields

```tsx
{
  is_active: { 
    type: 'boolean', 
    label: 'Active',
    defaultValue: true,
  },
}
```

### Date Fields

```tsx
{
  birth_date: { type: 'date', label: 'Birth Date' },
  created_at: { type: 'datetime', label: 'Created At' },
}
```

### Numeric Fields

```tsx
{
  age: { 
    type: 'number', 
    label: 'Age',
    min: 0,
    max: 150,
  },
  salary: { 
    type: 'currency', 
    label: 'Salary',
    min: 0,
  },
  completion: { 
    type: 'percent', 
    label: 'Completion',
    min: 0,
    max: 100,
  },
}
```

### Select Fields

```tsx
{
  status: {
    type: 'select',
    label: 'Status',
    required: true,
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ],
  },
}
```

### Lookup/Relationship Fields

```tsx
{
  assignee: {
    type: 'lookup',
    label: 'Assigned To',
    reference_to: 'user',
  },
}
```

## Automatic Validation

The component automatically applies validation based on field configuration:

### Required Fields

```tsx
{
  email: {
    type: 'email',
    label: 'Email',
    required: true,  // ← Validates presence
  },
}
```

### Min/Max Values

```tsx
{
  age: {
    type: 'number',
    label: 'Age',
    min: 18,    // ← Validates minimum value
    max: 100,   // ← Validates maximum value
  },
}
```

### Length Validation

```tsx
{
  username: {
    type: 'text',
    label: 'Username',
    min_length: 3,     // ← Minimum 3 characters
    max_length: 20,    // ← Maximum 20 characters
  },
}
```

### Pattern Validation

```tsx
{
  phone: {
    type: 'text',
    label: 'Phone',
    regex: '^\\d{3}-\\d{3}-\\d{4}$',  // ← Custom regex
  },
}
```

### Built-in Format Validation

Email and URL fields have automatic format validation:

```tsx
{
  email: {
    type: 'email',  // ← Auto-validates email format
    label: 'Email',
  },
  website: {
    type: 'url',    // ← Auto-validates URL format (must start with http/https)
    label: 'Website',
  },
}
```

## Advanced Usage

### Edit Mode with Initial Values

```tsx
function EditUserForm({ userId }: { userId: string }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(setUser);
  }, [userId]);

  if (!user) return <div>Loading...</div>;

  return (
    <ObjectForm
      objectConfig={userConfig}
      initialValues={user}
      onSubmit={async (data) => {
        await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      }}
      submitText="Update User"
    />
  );
}
```

### With Loading State

```tsx
function UserFormWithLoading() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast.success('User created!');
    } catch (error) {
      toast.error('Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ObjectForm
      objectConfig={userConfig}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
```

### Access Form Methods

```tsx
import { useObjectForm } from '@objectos/ui';

function AdvancedUserForm() {
  const { formRef, getValues, setValue, reset } = useObjectForm(userConfig);

  const handleCustomAction = () => {
    const currentValues = getValues();
    console.log('Current form values:', currentValues);
    
    // Programmatically set a value
    setValue('status', 'active');
  };

  return (
    <>
      <button onClick={handleCustomAction}>
        Get Current Values
      </button>
      
      <ObjectForm
        objectConfig={userConfig}
        formRef={formRef}
        onSubmit={async (data) => {
          await saveUser(data);
          reset(); // Reset form after successful submission
        }}
      />
    </>
  );
}
```

### Single Column Layout

```tsx
<ObjectForm
  objectConfig={userConfig}
  onSubmit={handleSubmit}
  columns={1}  // Single column layout
/>
```

### Custom Button Text

```tsx
<ObjectForm
  objectConfig={userConfig}
  onSubmit={handleSubmit}
  submitText="Create Account"
  cancelText="Go Back"
/>
```

### Hide Cancel Button

```tsx
<ObjectForm
  objectConfig={userConfig}
  onSubmit={handleSubmit}
  hideCancelButton={true}
/>
```

## Integration with ObjectOS

The component is designed to work seamlessly with ObjectOS architecture:

```tsx
import { ObjectForm } from '@objectos/ui';
import type { ObjectConfig } from '@objectql/types';

function ObjectEditView({ objectName, recordId }: { objectName: string; recordId: string }) {
  const [config, setConfig] = useState<ObjectConfig | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Fetch metadata
    fetch(`/api/metadata/object/${objectName}`)
      .then(res => res.json())
      .then(setConfig);

    // Fetch data
    fetch(`/api/data/${objectName}/${recordId}`)
      .then(res => res.json())
      .then(setData);
  }, [objectName, recordId]);

  if (!config || !data) return <div>Loading...</div>;

  return (
    <ObjectForm
      objectConfig={config}
      initialValues={data}
      onSubmit={async (formData) => {
        await fetch(`/api/data/${objectName}/${recordId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }}
    />
  );
}
```

## Field Layout Rules

The component automatically determines field layout:

### Full-Width Fields

These fields automatically span full width (in 2-column layout):
- `textarea`
- `markdown`
- `html`
- `grid`
- `object`

### Regular Fields

Other field types use normal column width in 2-column layout.

## Hidden Fields

The following fields are automatically hidden:
- System fields: `_id`, `id`, `created_at`, `updated_at`, `created_by`, `updated_by`
- Fields with `hidden: true`
- Read-only auto-generated fields: `auto_number`, `formula`, `summary`

## Styling

The component uses Tailwind CSS classes and follows the ObjectOS design system:

```tsx
<ObjectForm
  objectConfig={config}
  onSubmit={handleSubmit}
  className="bg-card p-6 rounded-lg"  // Custom styling
/>
```

## Best Practices

1. **Always provide object metadata**: The component relies on `ObjectConfig` for field generation and validation
2. **Handle async submissions**: Use `isSubmitting` state to prevent double submissions
3. **Provide initial values for edit mode**: Pass existing data via `initialValues`
4. **Use validation rules**: Configure `required`, `min`, `max`, etc. in field metadata
5. **Handle errors gracefully**: Wrap submissions in try-catch blocks
6. **Reset form after success**: Use `reset()` method to clear form after successful submission

## Comparison with Manual Forms

| Feature | ObjectForm | Manual Form |
|---------|-----------|-------------|
| Field Generation | Automatic from metadata | Manual for each field |
| Validation | Automatic based on field config | Manual validation logic |
| Type-specific Inputs | Automatic | Manual component selection |
| Layout | Smart auto-layout | Manual grid setup |
| Use Case | Object-based CRUD | Custom forms with specific logic |

## Examples

See `packages/ui/src/components/examples/ObjectFormExample.tsx` for a complete working example with all field types.

## License

Part of the ObjectOS project. See repository license for details.
