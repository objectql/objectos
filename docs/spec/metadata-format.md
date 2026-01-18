# Metadata Format Specification

ObjectOS uses strict YAML schemas for defining application metadata. This document specifies the complete format for object definitions.

## Object Schema

### Basic Structure

```yaml
name: <string>              # Required: Internal API name (snake_case)
label: <string>             # Optional: Human-readable display name
description: <string>       # Optional: Object description
icon: <string>              # Optional: Icon name (from icon library)
enable_api: <boolean>       # Optional: Enable API endpoints (default: true)
enable_audit: <boolean>     # Optional: Enable audit logging (default: false)

fields:
  <field_name>:
    type: <field_type>      # Required: Field data type
    label: <string>         # Optional: Display label
    description: <string>   # Optional: Help text
    required: <boolean>     # Optional: Is field required (default: false)
    unique: <boolean>       # Optional: Must be unique (default: false)
    default: <any>          # Optional: Default value

permission_set:
  allowRead: <boolean|array>     # Who can read records
  allowCreate: <boolean|array>   # Who can create records
  allowEdit: <boolean|array>     # Who can edit records
  allowDelete: <boolean|array>   # Who can delete records
```

### Example: Complete Object Definition

```yaml
name: contacts
label: Contact
description: Customer and prospect contact information
icon: user
enable_api: true
enable_audit: true

fields:
  first_name:
    type: text
    label: First Name
    required: true
    max_length: 100
  
  last_name:
    type: text
    label: Last Name
    required: true
    max_length: 100
  
  email:
    type: email
    label: Email Address
    unique: true
    required: true
  
  phone:
    type: text
    label: Phone Number
    pattern: '^\+?[1-9]\d{1,14}$'
  
  birthdate:
    type: date
    label: Birth Date
  
  account:
    type: lookup
    label: Account
    reference_to: accounts
    on_delete: set_null
  
  is_active:
    type: boolean
    label: Active
    default: true
  
  status:
    type: select
    label: Status
    options:
      - value: active
        label: Active
      - value: inactive
        label: Inactive
      - value: pending
        label: Pending
    default: pending

permission_set:
  allowRead: true                    # Everyone can read
  allowCreate: ['sales', 'admin']    # Sales and admin can create
  allowEdit: ['sales', 'admin']      # Sales and admin can edit
  allowDelete: ['admin']             # Only admin can delete
```

## Field Types Reference

### Text Fields

#### `text`
Short text field (up to 255 characters).

```yaml
field_name:
  type: text
  label: Title
  max_length: 100          # Optional: Maximum length
  min_length: 3            # Optional: Minimum length
  pattern: '^[A-Za-z]+$'   # Optional: Regex pattern
```

#### `textarea`
Long text field (unlimited length).

```yaml
description:
  type: textarea
  label: Description
  rows: 5                  # Optional: Display rows
```

#### `email`
Email address field with validation.

```yaml
email:
  type: email
  label: Email Address
  unique: true
```

#### `url`
URL field with validation.

```yaml
website:
  type: url
  label: Website
```

#### `phone`
Phone number field.

```yaml
phone:
  type: text
  label: Phone
  pattern: '^\+?[1-9]\d{1,14}$'
```

### Numeric Fields

#### `number`
Integer or decimal number.

```yaml
quantity:
  type: number
  label: Quantity
  min: 0                   # Optional: Minimum value
  max: 1000                # Optional: Maximum value
  precision: 2             # Optional: Decimal places
```

#### `currency`
Monetary value.

```yaml
price:
  type: currency
  label: Price
  currency_code: USD       # Optional: Currency code
  precision: 2             # Decimal places
```

#### `percent`
Percentage value (0-100).

```yaml
discount:
  type: percent
  label: Discount Rate
  min: 0
  max: 100
```

### Date and Time Fields

#### `date`
Date only (no time).

```yaml
birth_date:
  type: date
  label: Birth Date
  min: '1900-01-01'        # Optional: Minimum date
  max: '2100-12-31'        # Optional: Maximum date
```

#### `datetime`
Date and time.

```yaml
created_at:
  type: datetime
  label: Created At
  default: now             # Special value: current timestamp
```

#### `time`
Time only (no date).

```yaml
start_time:
  type: time
  label: Start Time
```

### Boolean and Selection Fields

#### `boolean`
True/false checkbox.

```yaml
is_active:
  type: boolean
  label: Active
  default: true
```

#### `select`
Dropdown selection (single value).

```yaml
status:
  type: select
  label: Status
  options:
    - value: draft
      label: Draft
    - value: published
      label: Published
  default: draft
```

#### `multiselect`
Multiple selection.

```yaml
tags:
  type: multiselect
  label: Tags
  options:
    - value: important
      label: Important
    - value: urgent
      label: Urgent
```

### Relationship Fields

#### `lookup`
Many-to-one relationship (foreign key).

```yaml
account:
  type: lookup
  label: Account
  reference_to: accounts
  on_delete: set_null      # Options: set_null, cascade, restrict
```

#### `master_detail`
Master-detail relationship (cascade delete).

```yaml
account:
  type: master_detail
  label: Account
  reference_to: accounts
  on_delete: cascade       # Automatically cascades
```

### Special Fields

#### `autonumber`
Auto-incrementing number.

```yaml
ticket_number:
  type: autonumber
  label: Ticket #
  format: 'TKT-{0000}'     # Format template
  start_number: 1          # Starting number
```

#### `formula`
Calculated field.

```yaml
full_name:
  type: formula
  label: Full Name
  formula: 'first_name + " " + last_name'
  return_type: text
```

#### `rollup_summary`
Aggregation from related records.

```yaml
total_opportunities:
  type: rollup_summary
  label: Total Opportunities
  reference_to: opportunities
  summary_type: count      # Options: count, sum, min, max, avg
```

## Field Attributes

### Common Attributes

All fields support these attributes:

| Attribute | Type | Description |
|-----------|------|-------------|
| `type` | string | **Required**. Field data type |
| `label` | string | Display label for UI |
| `description` | string | Help text shown in UI |
| `required` | boolean | Field is required (default: false) |
| `unique` | boolean | Value must be unique (default: false) |
| `default` | any | Default value for new records |
| `readonly` | boolean | Field cannot be edited (default: false) |
| `hidden` | boolean | Hide from UI (default: false) |

### Validation Attributes

| Attribute | Applies To | Description |
|-----------|------------|-------------|
| `min` | number, currency, percent, date | Minimum value |
| `max` | number, currency, percent, date | Maximum value |
| `min_length` | text, textarea | Minimum character length |
| `max_length` | text, textarea, email, url | Maximum character length |
| `pattern` | text, email, url, phone | Regex validation pattern |
| `precision` | number, currency, percent | Decimal places |

### Relationship Attributes

| Attribute | Applies To | Description |
|-----------|------------|-------------|
| `reference_to` | lookup, master_detail | Target object name |
| `on_delete` | lookup, master_detail | Cascade behavior |
| `related_list_label` | lookup, master_detail | Label in related list |

## Permission Schema

Permissions control who can access and modify records.

### Object-Level Permissions

```yaml
permission_set:
  allowRead: <boolean|array<string>>
  allowCreate: <boolean|array<string>>
  allowEdit: <boolean|array<string>>
  allowDelete: <boolean|array<string>>
```

- `true`: Everyone has permission
- `false`: No one has permission
- `['role1', 'role2']`: Only specified roles have permission

### Field-Level Permissions

```yaml
fields:
  salary:
    type: currency
    label: Salary
    visible_to: ['hr', 'admin']      # Only HR and admin can see
    editable_by: ['hr']              # Only HR can edit
```

## Validation Rules

### Built-in Validation

ObjectOS automatically validates:
- Required fields
- Unique fields
- Data type correctness
- Min/max constraints
- Pattern matching
- Reference integrity

### Custom Validation

Define custom validation in hooks (see [Logic Hooks](../guide/logic-hooks.md)).
