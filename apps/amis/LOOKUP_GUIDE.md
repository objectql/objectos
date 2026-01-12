# Lookup Component Enhancement Guide

## Overview

The lookup component has been significantly enhanced to provide a rich, user-friendly experience for managing relationships between objects in the AMIS application.

## Features

### 1. Basic Lookup Configuration

The simplest lookup field configuration:

```yaml
# In your object.yml
fields:
  customer:
    type: lookup
    label: Customer
    reference_to: customers
```

This automatically generates:
- A searchable select dropdown
- Fetches data from `/api/data/customers/query`
- Displays the `name` field as label
- Uses `_id` as value

### 2. Advanced Features

#### Searchable & Clearable

All lookup fields are automatically:
- **Searchable**: Type to filter options
- **Clearable**: Click × to clear selection

#### Custom Label and Value Fields

```yaml
fields:
  assignee:
    type: lookup
    label: Assignee
    reference_to: users
    label_field: full_name    # Display field
    value_field: user_id      # Stored value
```

#### Multiple Reference Fields

Fetch additional fields for display:

```yaml
fields:
  contact:
    type: lookup
    label: Contact
    reference_to: contacts
    reference_fields:
      - _id
      - name
      - email
      - phone
```

### 3. Inline Record Creation

Enable users to create new related records on-the-fly:

```yaml
fields:
  account:
    type: lookup
    label: Account
    reference_to: accounts
    reference_label: 客户      # Used in "New 客户" button
    allow_create: true
```

Features:
- Shows "新建客户" button
- Opens inline form to create new account
- Automatically selects the newly created record

### 4. Filtered Lookups

Restrict lookup options based on criteria:

```yaml
fields:
  contact:
    type: lookup
    label: Contact
    reference_to: contacts
    filters:
      status: active
      type: customer
```

Only shows contacts where `status='active'` AND `type='customer'`.

### 5. Multiple Selection (Many-to-Many)

For many-to-many relationships:

```yaml
fields:
  tags:
    type: lookup
    label: Tags
    reference_to: tags
    multiple: true
```

Allows selecting multiple tags from the dropdown.

### 6. Master-Detail Relationships

For parent-child relationships where child cannot exist without parent:

```yaml
fields:
  order:
    type: master_detail
    label: Order
    reference_to: orders
```

Automatically:
- Marks the field as required
- Creates cascade delete behavior (configured server-side)

## Table Display

Lookup fields in tables automatically resolve to display names instead of IDs:

```yaml
# Given a lookup field:
customer:
  type: lookup
  reference_to: customers
  
# Table column will show:
"John Doe" instead of "abc123"
```

The table column:
- Fetches all reference data on load
- Creates a mapping of ID → Name
- Shows "-" for unresolved references

## Generated AMIS Schema

### Form Field Schema

```javascript
{
  name: "customer",
  label: "Customer",
  type: "select",
  searchable: true,
  clearable: true,
  labelField: "name",
  valueField: "_id",
  source: {
    method: "post",
    url: "/api/data/customers/query",
    data: {
      fields: ["_id", "name"],
      pageSize: 100
    },
    adaptor: `
      const items = payload.data || [];
      return {
        status: 0,
        msg: 'success',
        data: {
          options: items.map(item => ({
            label: item.name || item._id,
            value: item._id,
            ...item
          }))
        }
      };
    `
  }
}
```

### Table Column Schema

```javascript
{
  name: "customer",
  label: "Customer",
  type: "mapping",
  sortable: true,
  placeholder: "-",
  source: {
    method: "post",
    url: "/api/data/customers/query",
    data: {
      fields: ["_id", "name"],
      pageSize: 1000
    },
    adaptor: `
      const items = payload.data || [];
      const mapping = {};
      items.forEach(item => {
        mapping[item._id] = item.name || item._id;
      });
      return mapping;
    `
  }
}
```

## Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `reference_to` | string | Target object name | Required |
| `label_field` | string | Field to display | `'name'` |
| `value_field` | string | Field to store | `'_id'` |
| `reference_fields` | array | Fields to fetch | `['_id', 'name']` |
| `allow_create` | boolean | Enable inline creation | `false` |
| `reference_label` | string | Label for create button | `reference_to` |
| `filters` | object | Filter criteria | `{}` |
| `multiple` | boolean | Allow multiple selection | `false` |

## Examples

### Example 1: Order → Customer Lookup

```yaml
# objects/order.object.yml
name: orders
label: Order
fields:
  order_number:
    type: text
    label: Order Number
    required: true
  
  customer:
    type: lookup
    label: Customer
    reference_to: customers
    allow_create: true
    reference_label: 客户
  
  amount:
    type: currency
    label: Amount
```

**Result**: 
- Searchable customer dropdown
- "新建客户" button to create customers inline
- Customer name shown in table (not ID)

### Example 2: Task → User Lookup with Filters

```yaml
# objects/task.object.yml
name: tasks
label: Task
fields:
  title:
    type: text
    label: Title
    required: true
  
  assignee:
    type: lookup
    label: Assignee
    reference_to: users
    label_field: full_name
    filters:
      status: active
      role: developer
```

**Result**:
- Only shows active developers
- Displays full name
- Stores user ID

### Example 3: Project → Tags (Many-to-Many)

```yaml
# objects/project.object.yml
name: projects
label: Project
fields:
  name:
    type: text
    label: Project Name
    required: true
  
  tags:
    type: lookup
    label: Tags
    reference_to: tags
    multiple: true
    allow_create: true
```

**Result**:
- Multi-select dropdown
- Can create new tags inline
- Stores array of tag IDs

### Example 4: Line Item → Order (Master-Detail)

```yaml
# objects/line_items.object.yml
name: line_items
label: Line Item
fields:
  order:
    type: master_detail
    label: Order
    reference_to: orders
  
  product:
    type: lookup
    label: Product
    reference_to: products
    
  quantity:
    type: number
    label: Quantity
    min: 1
```

**Result**:
- Order field is required
- Cannot create line item without order
- Product is optional lookup

## API Integration

### Query Endpoint

Lookup fields call the query endpoint:

```http
POST /api/data/{object}/query
Content-Type: application/json

{
  "fields": ["_id", "name"],
  "pageSize": 100,
  "filters": { ... }  // Optional
}
```

Response:
```json
{
  "data": [
    { "_id": "1", "name": "Customer A" },
    { "_id": "2", "name": "Customer B" }
  ],
  "total": 2
}
```

### Create Endpoint (for inline creation)

When `allow_create: true`:

```http
POST /api/data/{object}
Content-Type: application/json

{
  "name": "New Customer Name"
}
```

Response:
```json
{
  "_id": "3",
  "name": "New Customer Name"
}
```

## Best Practices

### 1. Choose the Right Field Type

- **lookup**: Optional relationships (order → customer)
- **master_detail**: Required parent-child (line_item → order)

### 2. Limit Reference Fields

Only fetch fields you'll display:

```yaml
# Good
reference_fields: [_id, name]

# Avoid (unless needed)
reference_fields: [_id, name, email, phone, address, ...]
```

### 3. Use Filters Wisely

Apply filters to reduce options:

```yaml
# Show only active users
assignee:
  type: lookup
  reference_to: users
  filters:
    status: active
```

### 4. Enable Inline Creation Sparingly

Only for frequently created related records:

```yaml
# Good: Often need to create new customers
customer:
  allow_create: true

# Avoid: Users are managed separately
assignee:
  allow_create: false
```

### 5. Custom Labels for Clarity

Use descriptive labels:

```yaml
# Good
reference_label: 客户  # Shows "新建客户"

# Less clear
reference_label: record  # Shows "新建record"
```

## Troubleshooting

### Issue: Dropdown shows IDs instead of names

**Solution**: Check the `label_field` matches your object's display field:

```yaml
# If your users have 'full_name' instead of 'name'
assignee:
  label_field: full_name
```

### Issue: Can't find records in dropdown

**Solution**: Check your filters aren't too restrictive:

```yaml
# Remove or adjust filters
filters:
  status: active  # Are there any active records?
```

### Issue: Inline creation doesn't work

**Solution**: Ensure the object has a simple creation form:

```yaml
allow_create: true
# The default form only has 'name' field
# For complex objects, omit allow_create
```

### Issue: Table shows "-" for all lookups

**Solution**: Verify the API endpoint returns data and the `label_field` exists:

```yaml
label_field: name  # Must exist in referenced object
```

## Performance Considerations

1. **Table Loading**: Lookup columns fetch all reference data on table load
   - For large datasets (>1000 records), consider pagination
   - Use `pageSize` in source configuration

2. **Form Dropdowns**: Limit to 100 options by default
   - Users can search for more
   - Consider filters to reduce initial load

3. **Caching**: AMIS caches dropdown options
   - Refresh the page to see new reference records
   - Or trigger a manual refresh

## Testing

The lookup component includes 14 comprehensive tests:

```bash
pnpm test src/__tests__/lookupComponent.test.ts
```

Tests cover:
- Basic lookup configuration
- Custom fields and labels
- Master-detail relationships
- Inline creation
- Multiple selection
- Filtered lookups
- Table column display

## Migration from Old Lookup

If you have existing lookup fields, they will continue to work. To use new features:

```yaml
# Old style (still works)
customer:
  type: lookup
  reference_to: customers

# New style (with enhancements)
customer:
  type: lookup
  reference_to: customers
  allow_create: true      # NEW
  searchable: true        # AUTO
  clearable: true         # AUTO
  filters: {...}          # NEW
  multiple: false         # NEW
```

All new features are optional and backward compatible.
