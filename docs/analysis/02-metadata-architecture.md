# Metadata-Driven Architecture: From YAML to Running Code

> **Author**: ObjectOS Core Team  
> **Date**: January 2026  
> **Version**: 1.0  
> **Target Audience**: System Architects, Platform Engineers

---

## Executive Summary

ObjectOS is a **metadata-driven runtime engine**—it generates fully functional enterprise applications from declarative YAML configurations without requiring developers to write imperative code. This article explores the architectural patterns, compiler design, and runtime optimizations that enable this transformation.

**Key Question**: How does a 50-line YAML file become a production-ready REST API with validation, permissions, and database operations?

---

## 1. The Metadata-First Philosophy

### 1.1 What is Metadata-Driven Architecture?

**Definition**: A system where **data about data** (metadata) controls program behavior, rather than hardcoded logic.

**Example Comparison**:

```typescript
// ❌ Traditional Code-First Approach
class ContactController {
  @Post()
  async create(@Body() dto: CreateContactDTO) {
    if (!dto.first_name) throw new Error('first_name required');
    if (!dto.email) throw new Error('email required');
    if (!this.isValidEmail(dto.email)) throw new Error('invalid email');
    
    const contact = await this.db.insert('contacts', dto);
    return contact;
  }
}

// ✅ ObjectOS Metadata-First Approach
// contacts.object.yml
name: contacts
fields:
  first_name:
    type: text
    required: true
  email:
    type: email
    required: true
    unique: true
```

**What ObjectOS generates automatically**:
- REST endpoints (`POST /api/data/contacts`)
- Request validation (required, type, format)
- Database schema (`CREATE TABLE contacts...`)
- Permission checks (RBAC)
- API documentation (OpenAPI spec)

### 1.2 Why Metadata-First?

**Benefits**:

1. **Productivity**: 10x faster development (no boilerplate)
2. **Consistency**: Same rules everywhere (REST, GraphQL, SDK)
3. **Maintainability**: Change YAML, not scattered code
4. **AI-Friendliness**: LLMs excel at structured data generation
5. **Low-Code Integration**: Visual builders can generate YAML

**Trade-offs**:

1. **Learning Curve**: Developers must learn YAML schema
2. **Flexibility**: Complex logic may require escape hatches
3. **Debugging**: Runtime errors point to metadata, not code

---

## 2. The Metadata Lifecycle

### 2.1 The Five-Stage Pipeline

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   1. Load   │──▶│   2. Parse  │──▶│  3. Validate│──▶│  4. Compile │──▶│  5. Execute │
│             │   │             │   │             │   │             │   │             │
│  YAML Files │   │  AST Tree   │   │  Type Check │   │  Runtime    │   │  API Call   │
│  from Disk  │   │  Structure  │   │  & Refs     │   │  Objects    │   │  Handlers   │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
```

### 2.2 Stage 1: Loading (File Discovery)

**Responsibility**: Find and read `*.object.yml` files.

**Implementation**:

```typescript
// @objectos/kernel/src/metadata/MetadataLoader.ts
export class MetadataLoader {
  async load(patterns: string[]): Promise<RawMetadata[]> {
    const files = [];
    
    // Support glob patterns
    for (const pattern of patterns) {
      const matches = await glob(pattern, { cwd: process.cwd() });
      files.push(...matches);
    }
    
    // Read files in parallel
    const contents = await Promise.all(
      files.map(file => fs.readFile(file, 'utf-8'))
    );
    
    return contents.map((content, idx) => ({
      source: files[idx],
      content
    }));
  }
}
```

**Configuration**:

```typescript
// objectql.config.ts
export default {
  metadata: [
    './objects/**/*.object.yml',      // Standard objects
    './custom/**/*.object.yml',       // Custom objects
    'node_modules/@steedos/*/objects/*.object.yml' // Plugins
  ]
};
```

### 2.3 Stage 2: Parsing (YAML → AST)

**Responsibility**: Convert text to structured data.

**Implementation**:

```typescript
// @objectos/kernel/src/metadata/MetadataParser.ts
import yaml from 'yaml';

export class MetadataParser {
  parse(raw: RawMetadata): ObjectAST {
    try {
      // Parse YAML
      const ast = yaml.parse(raw.content);
      
      // Attach metadata
      ast.$source = raw.source;
      ast.$line = this.getLineNumber(raw.content);
      
      return ast;
    } catch (error) {
      throw new MetadataParseError(
        `Failed to parse ${raw.source}: ${error.message}`
      );
    }
  }
}
```

**AST Structure**:

```typescript
interface ObjectAST {
  name: string;
  label: string;
  fields: Record<string, FieldAST>;
  permission_set?: PermissionSetAST;
  
  // Metadata
  $source: string;   // File path
  $line: number;     // Line number (for error messages)
}
```

### 2.4 Stage 3: Validation (Type Checking)

**Responsibility**: Ensure metadata is semantically valid.

**Validation Rules**:

1. **Schema Validation**: Fields have valid types
2. **Reference Validation**: Lookups point to existing objects
3. **Circular Dependency Detection**: No infinite loops
4. **Name Conflicts**: No duplicate object/field names

**Implementation**:

```typescript
// @objectos/kernel/src/metadata/MetadataValidator.ts
export class MetadataValidator {
  validate(ast: ObjectAST, registry: ObjectRegistry): void {
    // 1. Schema validation
    this.validateSchema(ast);
    
    // 2. Reference validation
    this.validateReferences(ast, registry);
    
    // 3. Business rules
    this.validateBusinessRules(ast);
  }
  
  private validateSchema(ast: ObjectAST): void {
    const schema = {
      type: 'object',
      required: ['name', 'fields'],
      properties: {
        name: { type: 'string', pattern: '^[a-z_][a-z0-9_]*$' },
        fields: { type: 'object', minProperties: 1 }
      }
    };
    
    const valid = ajv.validate(schema, ast);
    if (!valid) {
      throw new ValidationError(ajv.errors);
    }
  }
  
  private validateReferences(ast: ObjectAST, registry: ObjectRegistry): void {
    for (const [name, field] of Object.entries(ast.fields)) {
      if (field.type === 'lookup' || field.type === 'master_detail') {
        const target = field.reference_to;
        
        if (!registry.has(target)) {
          throw new ValidationError(
            `Field '${name}' references unknown object '${target}'`,
            { source: ast.$source, field: name }
          );
        }
      }
    }
  }
}
```

**Error Messages** (Developer-Friendly):

```
❌ Validation Error in contacts.object.yml:15

  Field 'account' references unknown object 'accounts_typo'
  
  Did you mean: 'accounts'?
  
  15 |   account:
  16 |     type: lookup
  17 |     reference_to: accounts_typo
                          ^^^^^^^^^^^^
```

### 2.5 Stage 4: Compilation (AST → Runtime Objects)

**Responsibility**: Transform validated AST into executable objects.

**What Gets Compiled**:

1. **Field Descriptors**: Type coercion, validation rules
2. **Query Builders**: SQL/NoSQL query generators
3. **Permission Checkers**: RBAC evaluators
4. **Event Handlers**: Lifecycle hooks

**Implementation**:

```typescript
// @objectos/kernel/src/metadata/MetadataCompiler.ts
export class MetadataCompiler {
  compile(ast: ObjectAST): CompiledObject {
    return {
      name: ast.name,
      label: ast.label,
      
      // Compiled fields
      fields: this.compileFields(ast.fields),
      
      // Compiled validators
      validators: this.compileValidators(ast.fields),
      
      // Compiled permissions
      permissions: this.compilePermissions(ast.permission_set),
      
      // Compiled hooks
      hooks: this.compileHooks(ast.triggers)
    };
  }
  
  private compileFields(fields: Record<string, FieldAST>): CompiledField[] {
    return Object.entries(fields).map(([name, ast]) => ({
      name,
      type: ast.type,
      
      // Type coercion function
      coerce: this.buildCoercer(ast.type),
      
      // Validation function
      validate: this.buildValidator(ast),
      
      // Database column spec
      column: this.buildColumnSpec(ast)
    }));
  }
  
  private buildCoercer(type: FieldType): CoerceFn {
    return (value: any) => {
      switch (type) {
        case 'text':
          return String(value);
        case 'number':
          return Number(value);
        case 'boolean':
          return Boolean(value);
        case 'date':
          return new Date(value);
        default:
          return value;
      }
    };
  }
}
```

**Compiled Output Example**:

```typescript
// Input YAML
fields:
  email:
    type: email
    required: true
    unique: true

// Compiled to
{
  name: 'email',
  type: 'email',
  
  coerce: (v) => String(v).toLowerCase().trim(),
  
  validate: (v) => {
    if (!v) throw new Error('email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      throw new Error('email is invalid');
    }
  },
  
  column: {
    type: 'VARCHAR(255)',
    unique: true,
    nullable: false
  }
}
```

### 2.6 Stage 5: Execution (Runtime Request Handling)

**Responsibility**: Use compiled objects to handle API requests.

**Request Flow**:

```typescript
// 1. HTTP Request
POST /api/data/contacts
{ "first_name": "John", "email": "john@example.com" }

// 2. Controller delegates to Kernel
const contact = await kernel.insert('contacts', body);

// 3. Kernel uses compiled metadata
const compiled = registry.get('contacts');

// 4. Validate input
for (const field of compiled.fields) {
  field.validate(body[field.name]);
}

// 5. Execute hooks
await compiled.hooks.beforeInsert({ data: body, user });

// 6. Insert via driver
const result = await driver.insert('contacts', body);

// 7. Execute post-hooks
await compiled.hooks.afterInsert({ data: result, user });

// 8. Return result
return result;
```

---

## 3. Advanced Metadata Features

### 3.1 Computed Fields

**Use Case**: Full name = first_name + last_name

**Metadata**:

```yaml
fields:
  first_name:
    type: text
  
  last_name:
    type: text
  
  full_name:
    type: formula
    formula: "first_name + ' ' + last_name"
    readonly: true
```

**Compilation**:

```typescript
compileFormula(ast: FormulaFieldAST): CompiledFormula {
  return {
    name: ast.name,
    type: 'computed',
    
    compute: (record) => {
      // Safe evaluation in sandbox
      const context = { ...record };
      return evaluate(ast.formula, context);
    },
    
    // Never stored in database
    persisted: false
  };
}
```

### 3.2 Relationship Fields

**Use Case**: Contact belongs to Account

**Metadata**:

```yaml
# contacts.object.yml
fields:
  account:
    type: lookup
    reference_to: accounts
    label: Account

# accounts.object.yml
fields:
  contacts:
    type: master_detail
    reference_from: contacts.account
    label: Contacts
```

**Compilation** (Query Generation):

```typescript
// User requests
const contact = await kernel.findOne('contacts', id, {
  include: ['account'] // Expand account relationship
});

// Compiled to SQL (PostgreSQL)
SELECT 
  c.*,
  row_to_json(a.*) as account
FROM contacts c
LEFT JOIN accounts a ON c.account = a.id
WHERE c.id = $1
```

### 3.3 Validation Rules

**Metadata**:

```yaml
fields:
  age:
    type: number
    min: 0
    max: 150
  
  phone:
    type: text
    pattern: '^\+?[1-9]\d{1,14}$'  # E.164 format
  
  custom_validation:
    type: text
    validate: |
      if (value.length < 5) {
        throw new Error('Too short');
      }
```

**Compilation**:

```typescript
compileValidation(ast: FieldAST): ValidatorFn {
  const validators = [];
  
  // Built-in validators
  if (ast.required) {
    validators.push((v) => {
      if (!v) throw new Error(`${ast.name} is required`);
    });
  }
  
  if (ast.min !== undefined) {
    validators.push((v) => {
      if (v < ast.min) throw new Error(`${ast.name} must be >= ${ast.min}`);
    });
  }
  
  if (ast.pattern) {
    const regex = new RegExp(ast.pattern);
    validators.push((v) => {
      if (!regex.test(v)) throw new Error(`${ast.name} format invalid`);
    });
  }
  
  // Custom validator
  if (ast.validate) {
    validators.push(compileCustomValidator(ast.validate));
  }
  
  // Compose all validators
  return (value) => {
    for (const validate of validators) {
      validate(value);
    }
  };
}
```

---

## 4. Registry Architecture

### 4.1 The Object Registry

**Purpose**: Centralized metadata store for fast lookups.

**Implementation**:

```typescript
// @objectos/kernel/src/metadata/ObjectRegistry.ts
export class ObjectRegistry {
  private objects = new Map<string, CompiledObject>();
  private index = {
    byLabel: new Map<string, string>(),
    byTable: new Map<string, string>(),
  };
  
  register(compiled: CompiledObject): void {
    // Store by name
    this.objects.set(compiled.name, compiled);
    
    // Build indexes
    this.index.byLabel.set(compiled.label, compiled.name);
    this.index.byTable.set(compiled.table || compiled.name, compiled.name);
  }
  
  get(name: string): CompiledObject {
    const obj = this.objects.get(name);
    if (!obj) {
      throw new Error(`Object '${name}' not found`);
    }
    return obj;
  }
  
  // Fast lookups
  getByLabel(label: string): CompiledObject {
    const name = this.index.byLabel.get(label);
    return this.get(name);
  }
  
  // List all objects
  list(filter?: ObjectFilter): CompiledObject[] {
    let objects = Array.from(this.objects.values());
    
    if (filter?.category) {
      objects = objects.filter(o => o.category === filter.category);
    }
    
    return objects;
  }
}
```

### 4.2 Dependency Graph

**Challenge**: Objects reference each other (circular dependencies).

**Solution**: Topological sort during loading.

```typescript
// @objectos/kernel/src/metadata/DependencyResolver.ts
export class DependencyResolver {
  resolve(objects: ObjectAST[]): ObjectAST[] {
    const graph = this.buildGraph(objects);
    return this.topologicalSort(graph);
  }
  
  private buildGraph(objects: ObjectAST[]): Graph {
    const graph = new Map();
    
    for (const obj of objects) {
      const deps = this.getDependencies(obj);
      graph.set(obj.name, deps);
    }
    
    return graph;
  }
  
  private getDependencies(obj: ObjectAST): string[] {
    const deps = [];
    
    for (const field of Object.values(obj.fields)) {
      if (field.type === 'lookup' || field.type === 'master_detail') {
        deps.push(field.reference_to);
      }
    }
    
    return deps;
  }
  
  private topologicalSort(graph: Graph): ObjectAST[] {
    // Kahn's algorithm
    const sorted = [];
    const inDegree = this.calculateInDegree(graph);
    const queue = this.findZeroInDegree(inDegree);
    
    while (queue.length > 0) {
      const node = queue.shift();
      sorted.push(node);
      
      for (const neighbor of graph.get(node)) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      }
    }
    
    if (sorted.length !== graph.size) {
      throw new Error('Circular dependency detected');
    }
    
    return sorted;
  }
}
```

---

## 5. Performance Optimizations

### 5.1 Lazy Loading

**Problem**: Loading 1000 objects at startup is slow.

**Solution**: Load on-demand with caching.

```typescript
export class LazyRegistry extends ObjectRegistry {
  private loader: MetadataLoader;
  private loaded = new Set<string>();
  
  get(name: string): CompiledObject {
    // Load if not already loaded
    if (!this.loaded.has(name)) {
      this.loadObject(name);
    }
    
    return super.get(name);
  }
  
  private async loadObject(name: string): Promise<void> {
    const raw = await this.loader.load([`**/${name}.object.yml`]);
    const ast = this.parser.parse(raw[0]);
    const compiled = this.compiler.compile(ast);
    
    this.register(compiled);
    this.loaded.add(name);
  }
}
```

### 5.2 Metadata Caching

**Strategy**: Cache compiled metadata in Redis.

```typescript
export class CachedRegistry extends ObjectRegistry {
  private cache: RedisClient;
  
  async get(name: string): Promise<CompiledObject> {
    // Try cache first
    const cached = await this.cache.get(`meta:${name}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Load and compile
    const compiled = await super.get(name);
    
    // Store in cache
    await this.cache.set(
      `meta:${name}`,
      JSON.stringify(compiled),
      'EX', 3600 // 1 hour TTL
    );
    
    return compiled;
  }
}
```

### 5.3 Hot Reload (Development)

**Goal**: Changes to YAML reflect immediately without restart.

```typescript
export class HotReloadRegistry extends ObjectRegistry {
  watch(patterns: string[]): void {
    const watcher = chokidar.watch(patterns);
    
    watcher.on('change', async (path) => {
      console.log(`Reloading ${path}...`);
      
      // Parse object name from path
      const name = this.extractObjectName(path);
      
      // Reload
      await this.reload(name);
      
      // Notify clients via WebSocket
      this.emit('metadata:updated', { object: name });
    });
  }
  
  private async reload(name: string): Promise<void> {
    // 1. Load new metadata
    const raw = await this.loader.loadOne(name);
    
    // 2. Parse and validate
    const ast = this.parser.parse(raw);
    this.validator.validate(ast, this);
    
    // 3. Compile
    const compiled = this.compiler.compile(ast);
    
    // 4. Replace in registry
    this.register(compiled);
    
    // 5. Sync database schema
    await this.driver.syncSchema(compiled);
  }
}
```

---

## 6. Schema Synchronization

### 6.1 Database Schema Generation

**Challenge**: Keep database schema in sync with YAML metadata.

**Strategy**: Auto-migration on startup.

```typescript
// @objectos/kernel/src/schema/SchemaSync.ts
export class SchemaSync {
  async sync(compiled: CompiledObject): Promise<void> {
    const current = await this.driver.getTableSchema(compiled.name);
    const desired = this.generateSchema(compiled);
    
    const diff = this.diffSchema(current, desired);
    
    if (diff.isEmpty()) {
      console.log(`✓ ${compiled.name} schema up to date`);
      return;
    }
    
    // Apply migrations
    for (const migration of diff.migrations) {
      await this.applyMigration(migration);
    }
  }
  
  private generateSchema(compiled: CompiledObject): TableSchema {
    const columns = [];
    
    // Add standard columns
    columns.push(
      { name: 'id', type: 'UUID', primaryKey: true },
      { name: 'created_at', type: 'TIMESTAMP', default: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMP', default: 'NOW()' }
    );
    
    // Add field columns
    for (const field of compiled.fields) {
      if (field.persisted !== false) {
        columns.push(field.column);
      }
    }
    
    return { name: compiled.name, columns };
  }
  
  private diffSchema(current: TableSchema, desired: TableSchema): SchemaDiff {
    return {
      added: desired.columns.filter(c => !current.columns.find(cc => cc.name === c.name)),
      removed: current.columns.filter(c => !desired.columns.find(dc => dc.name === c.name)),
      modified: this.findModifiedColumns(current.columns, desired.columns)
    };
  }
}
```

**Generated SQL Example**:

```sql
-- From YAML
name: contacts
fields:
  email:
    type: email
    unique: true

-- Generated SQL
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  email VARCHAR(255) UNIQUE NOT NULL
);

CREATE INDEX idx_contacts_email ON contacts(email);
```

---

## 7. Error Handling

### 7.1 Metadata Errors vs. Runtime Errors

**Metadata Error** (detected at load time):

```yaml
# Invalid field type
fields:
  age:
    type: invalid_type  # ❌ Unknown type
```

```
❌ Metadata Error in employees.object.yml:5

  Unknown field type 'invalid_type'
  
  Valid types: text, number, boolean, date, email, lookup, master_detail
  
  5 |   age:
  6 |     type: invalid_type
```

**Runtime Error** (detected during request):

```typescript
// User sends invalid data
POST /api/data/contacts
{ "email": "not-an-email" }
```

```json
{
  "error": "ValidationError",
  "message": "email is invalid",
  "field": "email",
  "value": "not-an-email"
}
```

### 7.2 Metadata Validation Levels

```typescript
enum ValidationLevel {
  STRICT = 'strict',   // Fail on any warning
  WARN = 'warn',       // Log warnings, continue
  LOOSE = 'loose'      // Ignore non-critical issues
}
```

---

## 8. Extensibility

### 8.1 Custom Field Types

**Use Case**: Add a `gps_location` field type.

```typescript
// 1. Define field type
kernel.registerFieldType('gps_location', {
  validate(value) {
    if (!value.lat || !value.lng) {
      throw new Error('GPS location requires lat and lng');
    }
    if (value.lat < -90 || value.lat > 90) {
      throw new Error('Invalid latitude');
    }
  },
  
  toDatabase(value) {
    return `POINT(${value.lng} ${value.lat})`;
  },
  
  fromDatabase(value) {
    const [lng, lat] = value.split(/[(),]/).filter(Boolean).map(Number);
    return { lat, lng };
  }
});

// 2. Use in YAML
fields:
  location:
    type: gps_location
    label: Location
```

### 8.2 Custom Validators

```typescript
kernel.registerValidator('credit_card', (value) => {
  // Luhn algorithm
  if (!this.luhnCheck(value)) {
    throw new Error('Invalid credit card number');
  }
});

// Use in YAML
fields:
  card_number:
    type: text
    validators: ['credit_card']
```

---

## 9. Testing Metadata

### 9.1 Metadata Unit Tests

```typescript
describe('Contact Metadata', () => {
  let registry: ObjectRegistry;
  
  beforeEach(async () => {
    registry = new ObjectRegistry();
    await registry.load(['./objects/contacts.object.yml']);
  });
  
  it('should have required fields', () => {
    const contact = registry.get('contacts');
    
    expect(contact.fields).toHaveProperty('first_name');
    expect(contact.fields.first_name.required).toBe(true);
  });
  
  it('should validate email format', () => {
    const contact = registry.get('contacts');
    const emailField = contact.fields.email;
    
    expect(() => emailField.validate('invalid')).toThrow();
    expect(() => emailField.validate('valid@example.com')).not.toThrow();
  });
});
```

### 9.2 Schema Validation Tests

```typescript
describe('Schema Sync', () => {
  it('should generate correct SQL for text fields', () => {
    const schema = generateSchema({
      name: 'test',
      fields: {
        name: { type: 'text', required: true }
      }
    });
    
    expect(schema.sql).toContain('name VARCHAR(255) NOT NULL');
  });
});
```

---

## 10. Best Practices

### 10.1 Metadata Organization

```
objects/
  core/
    users.object.yml
    roles.object.yml
  
  crm/
    accounts.object.yml
    contacts.object.yml
    opportunities.object.yml
  
  custom/
    my_custom_object.object.yml
```

### 10.2 Naming Conventions

```yaml
# ✅ GOOD
name: contacts          # Lowercase, plural
label: Contact          # Title case, singular

fields:
  first_name:           # Snake case
    type: text
    label: First Name   # Title case

# ❌ BAD
name: Contact           # Should be lowercase
label: contacts         # Should be singular

fields:
  FirstName:            # Should be snake_case
    type: text
```

### 10.3 Version Control

```yaml
# Include version and changelog in metadata
version: 2.0.0

changelog:
  - version: 2.0.0
    changes:
      - "Added email field"
      - "Removed fax field"
  - version: 1.0.0
    changes:
      - "Initial version"
```

---

## 11. Conclusion

The metadata-driven architecture of ObjectOS achieves **extreme productivity** through:

1. **Five-Stage Pipeline**: Load → Parse → Validate → Compile → Execute
2. **Type-Safe Compilation**: Metadata errors caught at load time
3. **Automatic Code Generation**: REST APIs, validation, schema
4. **Performance Optimizations**: Caching, lazy loading, hot reload
5. **Extensibility**: Custom types, validators, hooks

**Key Insight**: By treating metadata as **source code**, ObjectOS enables a new paradigm where **data structures drive implementation**, not the other way around.

---

**Next Article**: [The Sync Engine Design: Local-First Architecture](./03-sync-engine-design.md)
