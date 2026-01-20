# The Permission System Architecture: A Deep Analysis

> **Author**: ObjectOS Core Team  
> **Date**: January 2026  
> **Version**: 1.0  
> **Target Audience**: System Architects, Senior Developers

---

## Executive Summary

ObjectOS implements a **multi-layered security model** that enforces access control at three distinct levels: Object-level, Field-level, and Record-level. This architecture enables enterprise-grade security requirements such as Role-Based Access Control (RBAC), Attribute-Based Access Control (ABAC), and dynamic sharing rules—all driven by declarative YAML metadata.

This article dissects the permission system's design decisions, implementation patterns, and performance considerations.

---

## 1. The Security Philosophy

### 1.1 Zero Trust by Default

**Principle**: *"Every operation is forbidden until explicitly permitted."*

Unlike traditional systems where security is added as an afterthought, ObjectOS treats security as a **first-class architectural concern**:

```typescript
// ❌ Traditional approach (security as middleware)
app.use(authMiddleware);
router.get('/contacts', (req, res) => {
  const data = await db.query('SELECT * FROM contacts');
  res.json(data);
});

// ✅ ObjectOS approach (security as kernel responsibility)
const contacts = await kernel.find('contacts', {
  user: currentUser, // Security context is mandatory
  filters: { account: '123' }
});
// The kernel automatically:
// 1. Checks if user can read 'contacts' object
// 2. Filters fields based on field-level permissions
// 3. Applies record-level security (RLS) filters
```

### 1.2 Declarative vs. Imperative

**Design Choice**: Security rules are **metadata**, not code.

**Why?**
1. **Auditability**: Security policies live in version-controlled YAML, not scattered across controllers
2. **Consistency**: Same rules apply whether accessed via REST, GraphQL, or SDK
3. **AI-Friendliness**: LLMs can generate/modify security rules without writing code

---

## 2. Layer 1: Object-Level Permissions

### 2.1 CRUD Permission Matrix

The most basic security layer defines **who can perform what operation** on an entire object.

**Metadata Definition**:

```yaml
# objects/contacts.object.yml
name: contacts
label: Contact

permission_set:
  allowRead: true                    # Public read
  allowCreate: ['sales', 'admin']    # Only these roles can create
  allowEdit: ['sales', 'admin']      # Only these roles can edit
  allowDelete: ['admin']             # Only admins can delete
```

**Implementation**:

```typescript
// @objectos/kernel/src/permission/ObjectPermissionChecker.ts
export class ObjectPermissionChecker {
  canRead(user: User, object: ObjectConfig): boolean {
    const { allowRead } = object.permission_set;
    
    // true = public access
    if (allowRead === true) return true;
    
    // false = no access
    if (allowRead === false) return false;
    
    // ['role1', 'role2'] = role-based
    if (Array.isArray(allowRead)) {
      return user.roles.some(role => allowRead.includes(role));
    }
    
    // Default deny
    return false;
  }
}
```

### 2.2 Advanced: Dynamic Permissions

**Use Case**: Permission changes based on record state.

**Example**: Only allow editing "Opportunities" when they are in "Draft" status.

```yaml
# objects/opportunities.object.yml
permission_set:
  allowEdit:
    roles: ['sales']
    condition: "status == 'draft'"  # JS expression
```

**Implementation**:

```typescript
canEdit(user: User, object: ObjectConfig, record?: any): boolean {
  const { roles, condition } = object.permission_set.allowEdit;
  
  // Check role first
  if (!user.roles.some(r => roles.includes(r))) {
    return false;
  }
  
  // Evaluate dynamic condition if record is provided
  if (condition && record) {
    const context = { ...record, user };
    return evaluate(condition, context);
  }
  
  return true;
}
```

---

## 3. Layer 2: Field-Level Permissions

### 3.1 Sensitive Field Protection

**Use Case**: HR managers can see employee salaries; regular managers cannot.

**Metadata Definition**:

```yaml
# objects/employees.object.yml
fields:
  name:
    type: text
    label: Full Name
    # No restriction - everyone can see
  
  salary:
    type: currency
    label: Salary
    readable: ['hr', 'admin']        # Only these roles can see
    editable: ['hr']                 # Only HR can modify
  
  social_security_number:
    type: text
    label: SSN
    readable: ['admin']              # Extremely restricted
    editable: false                  # Immutable after creation
```

### 3.2 Implementation Strategy

**Challenge**: How to efficiently filter fields for thousands of objects?

**Solution**: Build a **Permission Projection** at load time.

```typescript
// @objectos/kernel/src/permission/FieldPermissionCache.ts
export class FieldPermissionCache {
  private cache = new Map<string, FieldProjection>();
  
  getProjection(objectName: string, user: User): FieldProjection {
    const cacheKey = `${objectName}:${user.roles.join(',')}`;
    
    if (!this.cache.has(cacheKey)) {
      const object = this.registry.get(objectName);
      const projection = this.buildProjection(object, user);
      this.cache.set(cacheKey, projection);
    }
    
    return this.cache.get(cacheKey);
  }
  
  private buildProjection(object: ObjectConfig, user: User): FieldProjection {
    const readable = [];
    const editable = [];
    
    for (const [name, field] of Object.entries(object.fields)) {
      if (this.canReadField(user, field)) {
        readable.push(name);
      }
      if (this.canEditField(user, field)) {
        editable.push(name);
      }
    }
    
    return { readable, editable };
  }
}
```

**Performance Optimization**:
- Cache per `(object, roles)` tuple
- Invalidate only on metadata reload or role changes
- Time complexity: **O(1)** per request after cache warm-up

### 3.3 Automatic Field Filtering

**When querying**, the kernel automatically filters out inaccessible fields:

```typescript
// User request
const contacts = await kernel.find('contacts', {
  fields: ['name', 'email', 'salary'], // User requests salary
  user: currentUser
});

// If currentUser doesn't have permission to read 'salary'
// Returned data automatically excludes it:
// [{ name: '...', email: '...' }] <- no salary field
```

**Implementation**:

```typescript
async find(objectName: string, options: FindOptions): Promise<any[]> {
  const projection = this.fieldCache.getProjection(objectName, options.user);
  
  // Intersect requested fields with allowed fields
  const allowedFields = options.fields
    ? options.fields.filter(f => projection.readable.includes(f))
    : projection.readable;
  
  // Pass filtered fields to driver
  const records = await this.driver.find(objectName, {
    ...options,
    fields: allowedFields
  });
  
  return records;
}
```

---

## 4. Layer 3: Record-Level Security (RLS)

### 4.1 The Ownership Model

**Use Case**: Sales reps can only see their own Leads.

**Metadata Definition**:

```yaml
# objects/leads.object.yml
sharing_rules:
  default: private                   # Base rule: everything is private
  
  owner_permission:
    read: true                       # Owner can read their records
    edit: true                       # Owner can edit their records
    delete: true                     # Owner can delete their records
  
  # Additional rules
  role_based_access:
    - role: 'sales_manager'
      condition: 'owner.department == user.department'
      permission:
        read: true
        edit: false
```

### 4.2 Implementation: Filter Injection

**Core Concept**: RLS is enforced by **automatically injecting WHERE clauses** into database queries.

```typescript
// @objectos/kernel/src/permission/RecordLevelSecurity.ts
export class RecordLevelSecurity {
  async applyRLS(
    objectName: string,
    filters: FilterGroup,
    user: User
  ): Promise<FilterGroup> {
    const object = this.registry.get(objectName);
    const { sharing_rules } = object;
    
    // Base case: if user is admin, skip RLS
    if (user.isAdmin) {
      return filters;
    }
    
    // Build RLS filter
    const rlsFilter: FilterGroup = { operator: 'OR', conditions: [] };
    
    // Rule 1: User is the owner
    if (sharing_rules.owner_permission.read) {
      rlsFilter.conditions.push({
        field: 'owner',
        operator: '==',
        value: user.id
      });
    }
    
    // Rule 2: Role-based access
    for (const rule of sharing_rules.role_based_access || []) {
      if (user.roles.includes(rule.role)) {
        const condition = this.evaluateCondition(rule.condition, user);
        rlsFilter.conditions.push(condition);
      }
    }
    
    // Combine with user-provided filters
    return {
      operator: 'AND',
      conditions: [filters, rlsFilter]
    };
  }
}
```

**SQL Translation Example**:

```typescript
// User query
kernel.find('leads', {
  filters: { status: 'open' },
  user: { id: 'user-123', roles: ['sales'] }
});

// Becomes (in PostgreSQL)
SELECT * FROM leads
WHERE status = 'open'
  AND (owner = 'user-123')  -- RLS injected automatically
```

### 4.3 Hierarchical Sharing (Territory-Based)

**Use Case**: Regional managers see all leads in their region.

```yaml
sharing_rules:
  hierarchy_based_access:
    enabled: true
    hierarchy_field: 'reporting_manager'
    grant_access_to: 'subordinates'  # Upward visibility
```

**Implementation**:

```typescript
// Build organizational hierarchy
const subordinateIds = await this.getSubordinates(user.id);

rlsFilter.conditions.push({
  field: 'owner',
  operator: 'IN',
  value: subordinateIds  // [user.id, subordinate1, subordinate2, ...]
});
```

---

## 5. Performance Optimization

### 5.1 The N+1 Query Problem

**Challenge**: Checking permissions for each record individually is slow.

```typescript
// ❌ BAD: O(n) database calls
for (const record of records) {
  if (await canRead(user, record)) {
    results.push(record);
  }
}
```

**Solution**: Push RLS to the database layer.

```typescript
// ✅ GOOD: Single query with WHERE clause
const records = await driver.find('leads', {
  filters: applyRLS(filters, user)  // RLS as WHERE condition
});
```

### 5.2 Permission Caching Strategy

**What to Cache**:
1. ✅ Field projections per role
2. ✅ Static permission rules
3. ❌ Dynamic RLS filters (vary per user/record)

**Cache Invalidation**:
- Metadata reload: Clear all caches
- Role change: Clear user's field projection
- Organization structure change: Clear hierarchy cache

### 5.3 Database Indexing

**Critical Indexes** for RLS performance:

```sql
-- For ownership-based RLS
CREATE INDEX idx_leads_owner ON leads(owner);

-- For territory-based RLS
CREATE INDEX idx_leads_region ON leads(region);

-- For composite conditions
CREATE INDEX idx_leads_owner_status ON leads(owner, status);
```

**Rule of Thumb**: If a field appears in `sharing_rules`, it needs an index.

---

## 6. Audit Logging Integration

### 6.1 Permission Denial Tracking

**Why**: Detect potential security breaches or misconfigured permissions.

```typescript
// When permission is denied
this.auditLog.record({
  event: 'permission_denied',
  user: user.id,
  object: objectName,
  operation: 'read',
  reason: 'insufficient_role',
  timestamp: new Date()
});
```

### 6.2 Data Access Audit

**Compliance Requirement**: Track who accessed what data.

```typescript
// On successful read
this.auditLog.record({
  event: 'data_access',
  user: user.id,
  object: objectName,
  record_id: record.id,
  fields_accessed: ['name', 'email', 'phone'],
  timestamp: new Date()
});
```

---

## 7. Security Best Practices

### 7.1 Least Privilege Principle

**Default to deny**:

```yaml
# ❌ BAD: Default to public
permission_set:
  allowRead: true

# ✅ GOOD: Explicitly grant
permission_set:
  allowRead: ['authenticated_users']
```

### 7.2 Defense in Depth

**Multiple layers of security**:

1. **Network Layer**: HTTPS, rate limiting
2. **Authentication Layer**: JWT, session management
3. **Object Permission Layer**: CRUD access control
4. **Field Permission Layer**: Sensitive field protection
5. **Record Permission Layer**: RLS filtering
6. **Audit Layer**: Track all operations

### 7.3 Avoid Client-Side Security

**Never**:

```typescript
// ❌ NEVER do this
// Client sends which fields to hide
const hiddenFields = req.body.hiddenFields;
```

**Always**:

```typescript
// ✅ Server decides based on user context
const projection = getFieldProjection(objectName, req.user);
```

---

## 8. Testing Strategies

### 8.1 Unit Tests

```typescript
describe('ObjectPermissionChecker', () => {
  it('denies access when role is missing', () => {
    const user = { roles: ['sales'] };
    const object = { permission_set: { allowRead: ['admin'] } };
    
    expect(checker.canRead(user, object)).toBe(false);
  });
  
  it('grants access when role matches', () => {
    const user = { roles: ['sales', 'admin'] };
    const object = { permission_set: { allowRead: ['admin'] } };
    
    expect(checker.canRead(user, object)).toBe(true);
  });
});
```

### 8.2 Integration Tests

```typescript
describe('Record-Level Security', () => {
  it('filters records based on ownership', async () => {
    const user1 = { id: 'user-1', roles: ['sales'] };
    const user2 = { id: 'user-2', roles: ['sales'] };
    
    // Create records
    await kernel.insert('leads', { owner: 'user-1', name: 'Lead A' });
    await kernel.insert('leads', { owner: 'user-2', name: 'Lead B' });
    
    // Query as user-1
    const results = await kernel.find('leads', { user: user1 });
    
    // Should only see own record
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Lead A');
  });
});
```

---

## 9. Migration Path

### 9.1 From Existing Systems

**Challenge**: You have an existing application with hardcoded permissions.

**Strategy**:

```typescript
// Step 1: Extract current rules
const currentPermissions = analyzeExistingCode(codebase);

// Step 2: Generate YAML
const yaml = generatePermissionYAML(currentPermissions);

// Step 3: Validate equivalence
validatePermissions(currentPermissions, yaml);

// Step 4: Gradual migration
enableObjectOSPermissions({ mode: 'shadow' }); // Log differences
enableObjectOSPermissions({ mode: 'enforce' }); // Full enforcement
```

### 9.2 Backward Compatibility

**For legacy clients** not aware of field-level permissions:

```typescript
// Option 1: Return all fields with nulls
{ name: 'John', salary: null } // User can't see salary

// Option 2: Omit fields entirely (recommended)
{ name: 'John' } // No salary field at all
```

---

## 10. Future Enhancements

### 10.1 Attribute-Based Access Control (ABAC)

**Beyond roles**: Grant access based on record attributes.

```yaml
sharing_rules:
  abac:
    - grant: read
      when: |
        record.region == user.region &&
        record.sensitivity_level <= user.clearance_level
```

### 10.2 Time-Based Permissions

**Temporary access**:

```yaml
sharing_rules:
  temporary_access:
    - grant_to: 'contractor@example.com'
      permissions: ['read']
      expires_at: '2026-12-31T23:59:59Z'
```

### 10.3 Permission Delegation

**Share my records with someone**:

```typescript
await kernel.share({
  object: 'opportunities',
  record_id: 'opp-123',
  with_user: 'user-456',
  permissions: ['read', 'edit'],
  reason: 'Vacation coverage'
});
```

---

## 11. Conclusion

The ObjectOS permission system achieves **enterprise-grade security** through:

1. **Multi-Layer Defense**: Object, Field, and Record-level controls
2. **Declarative Configuration**: Security as metadata, not code
3. **Performance-First Design**: Caching and query optimization
4. **Zero Trust Philosophy**: Deny by default, grant explicitly
5. **Auditability**: Every decision is logged and traceable

**Key Takeaway**: Security is not a feature—it's the **foundation** of the kernel architecture.

---

## References

- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)
- [NIST RBAC Standard](https://csrc.nist.gov/projects/role-based-access-control)
- [Salesforce Sharing Model](https://developer.salesforce.com/docs/atlas.en-us.securityImplGuide.meta/securityImplGuide/sharing_model.htm)

---

**Next Article**: [Metadata-Driven Architecture: From YAML to Running Code](./02-metadata-architecture.md)
