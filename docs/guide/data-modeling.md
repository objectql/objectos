# Data Modeling Guide

ObjectOS uses declarative YAML files to define data models. This guide covers how to model your business data using the ObjectQL metadata format.

## Overview

Data modeling in ObjectOS is done entirely in YAML files with the `.object.yml` extension. These files define:

- **Objects**: Business entities (like Contact, Account, Order)
- **Fields**: Properties of objects (name, email, price, etc.)
- **Relationships**: How objects relate to each other
- **Validation**: Rules that data must satisfy
- **Permissions**: Who can read, create, update, or delete records

## Creating Your First Object

### Step 1: Create the File

Create a file named `contact.object.yml` in your `objects/` directory:

```yaml
name: contacts
label: Contact
icon: user
description: Customer and prospect contact information
```

### Step 2: Add Fields

Add fields to describe your contact:

```yaml
name: contacts
label: Contact
icon: user

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
  
  birthdate:
    type: date
    label: Birth Date
```

### Step 3: Add Permissions

Define who can access this object:

```yaml
permission_set:
  allowRead: true                    # Everyone can read
  allowCreate: ['sales', 'admin']    # Sales and admin can create
  allowEdit: ['sales', 'admin']      # Sales and admin can edit
  allowDelete: ['admin']             # Only admin can delete
```

## Object Structure

### Object Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | API name (snake_case, no spaces) |
| `label` | string | No | Display name for UI |
| `icon` | string | No | Icon name (from icon library) |
| `description` | string | No | Object description |
| `enable_api` | boolean | No | Enable REST API (default: true) |
| `enable_audit` | boolean | No | Enable audit logging (default: false) |

### Example

```yaml
name: projects
label: Project
icon: folder
description: Project management and tracking
enable_api: true
enable_audit: true
```

## Field Types

### Text Fields

#### Short Text (`text`)

```yaml
first_name:
  type: text
  label: First Name
  required: true
  max_length: 100
```

#### Long Text (`textarea`)

```yaml
description:
  type: textarea
  label: Description
  max_length: 5000
```

#### Email (`email`)

```yaml
email:
  type: email
  label: Email Address
  unique: true
  required: true
```

#### URL (`url`)

```yaml
website:
  type: url
  label: Website
```

### Numeric Fields

#### Number (`number`)

```yaml
age:
  type: number
  label: Age
  min: 0
  max: 150
```

#### Currency (`currency`)

```yaml
annual_revenue:
  type: currency
  label: Annual Revenue
  currency_code: USD
  precision: 2
```

#### Percent (`percent`)

```yaml
discount_rate:
  type: percent
  label: Discount Rate
  min: 0
  max: 100
  precision: 2
```

### Date Fields

#### Date (`date`)

```yaml
birth_date:
  type: date
  label: Birth Date
```

#### DateTime (`datetime`)

```yaml
created_at:
  type: datetime
  label: Created At
  default: now
```

### Selection Fields

#### Select (`select`)

Single choice dropdown:

```yaml
status:
  type: select
  label: Status
  options:
    - value: draft
      label: Draft
    - value: active
      label: Active
    - value: archived
      label: Archived
  default: draft
```

#### Multi-Select (`multiselect`)

Multiple choice:

```yaml
interests:
  type: multiselect
  label: Interests
  options:
    - value: tech
      label: Technology
    - value: sports
      label: Sports
    - value: music
      label: Music
```

### Boolean (`boolean`)

```yaml
is_active:
  type: boolean
  label: Active
  default: true
```

## Relationships

### Many-to-One (Lookup)

A Contact belongs to one Account:

```yaml
# In contact.object.yml
fields:
  account:
    type: lookup
    label: Account
    reference_to: accounts
    on_delete: set_null  # When account deleted, set to null
```

### One-to-Many (Inverse of Lookup)

One Account has many Contacts. This is automatically created by the lookup field above.

### Master-Detail

Like lookup, but with cascade delete:

```yaml
fields:
  account:
    type: master_detail
    label: Account
    reference_to: accounts
    # on_delete: cascade is automatic
```

When the Account is deleted, all related Contacts are also deleted.

### Many-to-Many (Junction Object)

Create a junction object for many-to-many relationships:

```yaml
# opportunity_contact.object.yml
name: opportunity_contacts
label: Opportunity Contact
fields:
  opportunity:
    type: master_detail
    reference_to: opportunities
  
  contact:
    type: master_detail
    reference_to: contacts
  
  role:
    type: select
    options:
      - Decision Maker
      - Influencer
      - User
```

## Field Validation

### Required Fields

```yaml
email:
  type: email
  required: true
```

### Unique Fields

```yaml
email:
  type: email
  unique: true
```

### Min/Max Values

```yaml
age:
  type: number
  min: 18
  max: 100

price:
  type: currency
  min: 0
```

### String Length

```yaml
name:
  type: text
  min_length: 2
  max_length: 100
```

### Pattern Matching

```yaml
phone:
  type: text
  pattern: '^\+?[1-9]\d{1,14}$'  # E.164 phone format
```

## Default Values

Set default values for new records:

```yaml
status:
  type: select
  default: draft

created_at:
  type: datetime
  default: now

is_active:
  type: boolean
  default: true
```

## Field-Level Permissions

Control who can see or edit specific fields:

```yaml
salary:
  type: currency
  label: Salary
  visible_to: ['hr', 'admin']    # Only HR and admin can see
  editable_by: ['hr']            # Only HR can edit
```

## Calculated Fields

### Formula Fields

Define calculated fields using formulas:

```yaml
full_name:
  type: formula
  label: Full Name
  formula: 'first_name + " " + last_name'
  return_type: text
```

### Rollup Summary Fields

Aggregate data from related records:

```yaml
# In account.object.yml
total_opportunities:
  type: rollup_summary
  label: Total Opportunities
  reference_to: opportunities
  summary_type: count

total_revenue:
  type: rollup_summary
  label: Total Revenue
  reference_to: opportunities
  summary_field: amount
  summary_type: sum
  filters:
    stage: 'closed_won'
```

## Auto-Number Fields

Generate sequential numbers:

```yaml
ticket_number:
  type: autonumber
  label: Ticket #
  format: 'TKT-{0000}'
  start_number: 1
```

## Complete Example: CRM Objects

### Account Object

```yaml
# objects/account.object.yml
name: accounts
label: Account
icon: building
description: Company or organization

fields:
  name:
    type: text
    label: Account Name
    required: true
    max_length: 255
  
  industry:
    type: select
    label: Industry
    options:
      - value: technology
        label: Technology
      - value: finance
        label: Financial Services
      - value: healthcare
        label: Healthcare
      - value: retail
        label: Retail
  
  website:
    type: url
    label: Website
  
  annual_revenue:
    type: currency
    label: Annual Revenue
    currency_code: USD
  
  employee_count:
    type: number
    label: Number of Employees
    min: 0
  
  type:
    type: select
    label: Type
    options:
      - Customer
      - Prospect
      - Partner
    default: Prospect

permission_set:
  allowRead: true
  allowCreate: ['sales', 'admin']
  allowEdit: ['sales', 'admin']
  allowDelete: ['admin']
```

### Contact Object

```yaml
# objects/contact.object.yml
name: contacts
label: Contact
icon: user
description: Person associated with an account

fields:
  first_name:
    type: text
    label: First Name
    required: true
  
  last_name:
    type: text
    label: Last Name
    required: true
  
  email:
    type: email
    label: Email
    unique: true
    required: true
  
  phone:
    type: text
    label: Phone
  
  title:
    type: text
    label: Job Title
  
  account:
    type: lookup
    label: Account
    reference_to: accounts
    on_delete: set_null
  
  birthdate:
    type: date
    label: Birth Date
  
  is_primary:
    type: boolean
    label: Primary Contact
    default: false

permission_set:
  allowRead: true
  allowCreate: ['sales', 'admin']
  allowEdit: ['sales', 'admin']
  allowDelete: ['admin']
```

### Opportunity Object

```yaml
# objects/opportunity.object.yml
name: opportunities
label: Opportunity
icon: currency-dollar
description: Sales opportunity

fields:
  name:
    type: text
    label: Opportunity Name
    required: true
  
  account:
    type: lookup
    label: Account
    reference_to: accounts
    required: true
  
  amount:
    type: currency
    label: Amount
    currency_code: USD
    min: 0
  
  probability:
    type: percent
    label: Probability
    min: 0
    max: 100
  
  expected_revenue:
    type: formula
    label: Expected Revenue
    formula: 'amount * (probability / 100)'
    return_type: currency
  
  stage:
    type: select
    label: Stage
    required: true
    options:
      - value: prospecting
        label: Prospecting
      - value: qualification
        label: Qualification
      - value: proposal
        label: Proposal
      - value: negotiation
        label: Negotiation
      - value: closed_won
        label: Closed Won
      - value: closed_lost
        label: Closed Lost
    default: prospecting
  
  close_date:
    type: date
    label: Expected Close Date
    required: true
  
  owner:
    type: lookup
    label: Owner
    reference_to: users
    required: true

permission_set:
  allowRead: ['sales', 'admin']
  allowCreate: ['sales', 'admin']
  allowEdit: ['sales', 'admin']
  allowDelete: ['admin']
```

## Best Practices

### 1. Naming Conventions

- **Object names**: Use snake_case plural (e.g., `contacts`, `sales_orders`)
- **Field names**: Use snake_case (e.g., `first_name`, `annual_revenue`)
- **Labels**: Use Title Case (e.g., "First Name", "Annual Revenue")

### 2. Required Fields

Make fields required if they are essential for the object to make sense:

```yaml
# Good: Contact must have a name and email
first_name:
  required: true
email:
  required: true
```

### 3. Unique Constraints

Use unique constraints to prevent duplicates:

```yaml
email:
  unique: true
```

### 4. Field Length

Set reasonable maximum lengths:

```yaml
name:
  max_length: 255  # Standard for most text fields
```

### 5. Default Values

Provide sensible defaults:

```yaml
status:
  default: draft
is_active:
  default: true
```

## Testing Your Models

After creating objects, test them:

```bash
# Start the server
pnpm run dev

# Test API endpoints
curl http://localhost:3000/api/metadata/contacts
curl http://localhost:3000/api/data/contacts/query
```

## Next Steps

- **[Logic Hooks](./logic-hooks.md)** - Add custom business logic
- **[Security Guide](./security-guide.md)** - Configure permissions
- **[Metadata Format Spec](../spec/metadata-format.md)** - Complete field type reference
