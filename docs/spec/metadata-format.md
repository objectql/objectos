# ObjectQL Metadata Specification

**Version:** 1.0.0

## 1. Architecture Overview

ObjectQL is a **query transpiler** that converts a standardized JSON-DSL into native database queries.

* **Pattern:** Repository Pattern with a Multi-Datasource strategy.
* **Datasources:**
  * **MongoDB:** Schema-less, fast iteration.
  * **PostgreSQL/Knex:** Schema-strict, JSONB hybrid storage.
* **Execution Flow:** `Client -> JSON DSL -> ObjectQL Core -> Driver -> Native Query -> DB`.

## 2. Directory & Datasource Resolution

The system uses a **"Directory-as-Datasource"** convention to map objects to database connections.

### 2.1 Standard Structure

```text
/project-root
├── /objects
│   ├── /_common/           # [Reserved] Mixins or abstract definitions
│   │
│   ├── /external/          # [Datasource: external] (e.g., pg)
│   │   └── erp_orders.object.yml  # -> Mapped to 'external' connection
│   │
│   └── users.object.yml           # [Datasource: default] (Root level = default)
│
├── /roles                  # RBAC Definitions
└── objectql.config.js          # Connection config (Environment specific)
```

### 2.2 Resolution Priority

1. **Explicit:** `datasource` property in YAML (if supported).
2. **Implicit:** Subdirectory name under `/objects/`.
3. **Fallback:** `default` connection.

### 2.3 Connection Configuration (`objectql.config.js`)

This file exports the configuration for all valid datasources. The `default` datasource is required.

```javascript
module.exports = {
  datasources: {
    // The 'default' connection (Required)
    // Used for files in /objects/*.object.yml (root)
    default: {
      driver: '@objectql/driver-mongo',
      connection: process.env.MONGO_URL
    },

    // 'logs' connection
    // Used for files in /objects/logs/*.object.yml
    external: {
      driver: '@objectql/driver-knex', // NPM package or Driver Instance
      client: 'pg',                    // Knex specific config
      connection: process.env.POSTGRES_URL
    },
  }
}
```

## 3. Object Definition

Object files are typically defined in YAML (or JSON) and represent a business entity or database table.

Files should use **Snake Case** filenames (e.g., `project_tasks.object.yml`).

### 3.1 Root Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | **Required.** Unique API name of the object. Should match filename. |
| `label` | `string` | Human-readable label (e.g., "Project Task"). |
| `icon` | `string` | SLDS icon string (e.g., `standard:task`). |
| `description` | `string` | Internal description of the object. |
| `fields` | `Map` | Dictionary of field definitions. |
| `actions` | `Map` | Dictionary of custom action definitions. |

## 4. Field Definitions

Fields are defined under the `fields` key. The key for each entry corresponds to the field's API name.

```yaml
fields:
  field_name:
    type: text
    label: Field Label
```

### 4.1 Common Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `type` | `string` | **Required.** Data type of the field. See Section 4.2. |
| `label` | `string` | Display label for UI validation messages. |
| `required` | `boolean` | If `true`, the field cannot be null/undefined. Default: `false`. |
| `defaultValue` | `any` | Default value if not provided during creation. |
| `index` | `boolean` | Hint to create a database index. |
| `searchable` | `boolean` | Hint to include this field in global search. |
| `sortable` | `boolean` | Hint that this field can be used for sorting in UI. |
| `description` | `string` | Help text or documentation for the field. |

### 4.2 Supported Field Types

| Type | Description | Specific Properties |
| :--- | :--- | :--- |
| **Basic Types** | | |
| `text` | Single line text. | `min_length`, `max_length`, `regex` |
| `textarea` | Multiline text. | `rows`, `min_length`, `max_length` |
| `markdown` | Markdown formatted text. | |
| `html` | Rich text content (HTML). | |
| `number` | Numeric value (integer or float). | `precision`, `min`, `max` |
| `currency` | Monetary value. | `scale`, `min`, `max` |
| `percent` | Percentage value (0-1). | `scale`, `min`, `max` |
| `boolean` | `true` or `false`. | |
| **System/Format Types** | | |
| `email` | Email address with validation. | |
| `phone` | Phone number formatting. | |
| `url` | Web URL validation. | |
| `password` | Encrypted or masked string. | |
| **Date & Time** | | |
| `date` | Date only (YYYY-MM-DD). | |
| `datetime` | Date and time (ISO string). | |
| `time` | Time only (HH:mm:ss). | |
| **Complex/Media** | | |
| `file` | File attachment (stored as JSON). | `multiple` |
| `image` | Image attachment (stored as JSON). | `multiple` |
| `avatar` | User avatar image. | |
| `location` | Geolocation (lat/lng JSON). | |
| **Relationships** | | |
| `select` | Selection from a list. | `options`, `multiple` |
| `lookup` | Reference to another object. | `reference_to`, `multiple` |
| `master_detail` | Strong ownership relationship. | `reference_to` (Required) |
| **Advanced** | | |
| `formula` | Read-only calculated field. | `expression`, `data_type` |
| `summary` | Roll-up summary of child records. | `summary_object`, `summary_type`, `summary_field`, `summary_filters` |
| `auto_number` | Auto-incrementing unique identifier. | `auto_number_format` |
| `object` | JSON object structure. | |
| `grid` | Array of objects/rows. | |

### 4.6 Field Attributes

| Attribute | Type | Description |
| :--- | :--- | :--- |
| `required` | `boolean` | If true, database enforces NOT NULL. |
| `unique` | `boolean` | If true, database enforces UNIQUE constraint. |
| `readonly` | `boolean` | UI hint: Field should not be editable by users. |
| `hidden` | `boolean` | UI/API hint: Field should be hidden by default. |
| `defaultValue` | `any` | Default value on creation. |
| `help_text` | `string` | Tooltip for end-users. |
| `multiple` | `boolean` | Allows multiple values (stored as JSON array). |
| `min`, `max` | `number` | Range validation for numeric types. |
| `min_length`, `max_length` | `number` | Length validation for text types. |
| `regex` | `string` | Custom regular expression validation. |


### 4.3 Relationship Fields

Key properties for `lookup` or `master_detail`:

*   **reference_to**: The `name` of the target object.

```yaml
owner:
  type: lookup
  reference_to: users
  label: Owner
```

### 4.4 Select Options

Options for `select` can be a simple list or label/value pairs.

```yaml
status:
  type: select
  options:
    - label: Planned
      value: planned
    - label: In Progress
      value: in_progress
```

## 5. Actions (RPC)

Custom business logic can be defined in the `actions` section.

```yaml
actions:
  approve:
    label: Approve Request
    description: Approves the current record.
    params:
      comment:
        type: textarea
        label: Approval Comments
    result:
      type: boolean
```

## 6. App Definition

App files define application interfaces with custom navigation menus, similar to Airtable interfaces. Apps are defined in `*.app.yml` or `*.app.yaml` files.

### 6.1 Root Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | **Required.** Display name of the app. |
| `id` | `string` | Unique identifier for the app. If not provided, uses `name`. |
| `code` | `string` | URL-friendly code/slug for the app. |
| `description` | `string` | Description of the app's purpose. |
| `icon` | `string` | Icon identifier (e.g., `ri-dashboard-line`). |
| `color` | `string` | Color theme for the app (e.g., `blue`, `gray`). |
| `dark` | `boolean` | Whether to use dark mode by default. |
| `menu` | `array` | Left-side navigation menu configuration. See Section 6.2. |

### 6.2 Menu Configuration

The `menu` property defines the left-side navigation structure. It can be either:
- An array of menu items (flat structure)
- An array of menu sections (grouped structure)

#### Menu Item Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `label` | `string` | **Required.** Display label for the menu item. |
| `id` | `string` | Unique identifier for the menu item. |
| `icon` | `string` | Icon identifier (e.g., `ri-home-line`, `ri-dashboard-line`). |
| `type` | `string` | Type: `object`, `page`, `url`, or `divider`. Default: `page`. |
| `object` | `string` | Object name to link to (when `type: object`). |
| `url` | `string` | URL path (when `type: page` or `type: url`). |
| `badge` | `string|number` | Badge text or count to display next to the item. |
| `visible` | `boolean` | Whether the item is visible. Default: `true`. |
| `items` | `array` | Nested sub-menu items (for hierarchical menus). |

#### Menu Section Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `label` | `string` | Section title/header. |
| `items` | `array` | **Required.** Menu items in this section. |
| `collapsible` | `boolean` | Whether the section can be collapsed. Default: `false`. |
| `collapsed` | `boolean` | Whether the section is collapsed by default. Default: `false`. |

### 6.3 Menu Types

**`object`**: Links to an object's list view
```yaml
- label: Projects
  icon: ri-building-line
  type: object
  object: projects
```

**`page`**: Links to an internal page/route
```yaml
- label: Dashboard
  icon: ri-dashboard-line
  type: page
  url: /dashboard
```

**`url`**: External or absolute URL link
```yaml
- label: Documentation
  icon: ri-book-line
  type: url
  url: https://docs.example.com
```

**`divider`**: Visual separator (no label or action)
```yaml
- type: divider
```

### 6.4 Complete App Example

```yaml
name: Project Management
description: Manage and track your projects efficiently.
code: projects
icon: ri-dashboard-line
color: blue
dark: false

menu:
  # Main section
  - label: Main
    items:
      - label: Dashboard
        icon: ri-dashboard-line
        type: page
        url: /dashboard
      - label: All Projects
        icon: ri-building-line
        type: object
        object: projects
      - label: Active Tasks
        icon: ri-checkbox-circle-line
        type: object
        object: tasks
        badge: 12
  
  # Views section
  - label: Views
    collapsible: true
    items:
      - label: My Projects
        icon: ri-user-line
        type: page
        url: /my-projects
      - label: Team Calendar
        icon: ri-calendar-line
        type: page
        url: /calendar
      - label: Reports
        icon: ri-bar-chart-line
        type: page
        url: /reports
  
  # Settings
  - label: Settings
    collapsible: true
    collapsed: true
    items:
      - label: App Settings
        icon: ri-settings-3-line
        type: page
        url: /settings
      - type: divider
      - label: Help & Support
        icon: ri-question-line
        type: url
        url: https://docs.example.com
```

## 7. Complete Object Example

```yaml
name: project
label: Project
icon: standard:case
description: Tracks internal projects and deliverables.
enable_search: true

fields:
  name:
    label: Project Name
    type: text
    required: true
    index: true
    searchable: true
  
  status:
    label: Status
    type: select
    defaultValue: planned
    options:
      - label: Planned
        value: planned
      - label: Active
        value: active
      - label: Archived
        value: archived

  priority:
    label: Priority
    type: select
    options: [High, Medium, Low]

  start_date:
    label: Start Date
    type: date

  budget:
    label: Total Budget
    type: currency
    scale: 2

  manager:
    label: Project Manager
    type: lookup
    reference_to: users
    index: true

  notes:
    label: Internal Notes
    type: textarea

actions:
  calculate_roi:
    label: Calculate ROI
    result: 
      type: currency
```
