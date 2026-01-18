# Security Guide

Security is a fundamental concern in ObjectOS. This guide covers authentication, authorization, permissions, and security best practices for building secure applications.

## Security Architecture

ObjectOS implements a multi-layered security model:

1. **Authentication**: Verify user identity
2. **Authorization**: Control access to objects and records
3. **Field-Level Security**: Control access to specific fields
4. **Record-Level Security**: Filter records based on ownership/sharing
5. **Audit Logging**: Track all data changes

## Authentication

### Using Better-Auth

ObjectOS uses [Better-Auth](https://better-auth.com) for authentication, supporting multiple strategies:

- Local (email/password)
- OAuth 2.0 (Google, GitHub, Microsoft)
- SAML (Enterprise SSO)
- LDAP
- Magic Links

### Setup Authentication

```typescript
import { ObjectOS } from '@objectos/kernel';
import { AuthPlugin } from '@objectos/plugin-auth';

const kernel = new ObjectOS();

// Configure auth plugin
kernel.use(AuthPlugin({
  providers: {
    local: {
      enabled: true
    },
    google: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d'
  }
}));
```

### Login Endpoint

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "roles": ["sales"]
  }
}
```

### Using Tokens

Include the token in all authenticated requests:

```bash
GET /api/data/contacts
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Authorization

### Object-Level Permissions

Control CRUD access to entire objects using permission sets:

```yaml
# objects/contacts.object.yml
name: contacts
label: Contact

permission_set:
  allowRead: true                    # Everyone can read
  allowCreate: ['sales', 'admin']    # Only sales and admin can create
  allowEdit: ['sales', 'admin']      # Only sales and admin can edit
  allowDelete: ['admin']             # Only admin can delete
```

**Permission Values:**
- `true`: Everyone has permission
- `false`: No one has permission (system only)
- `['role1', 'role2']`: Only specified roles have permission

### Permission Checking

ObjectOS automatically checks permissions on all operations:

```typescript
// User without 'sales' or 'admin' role tries to create contact
await kernel.insert('contacts', { ... });
// Throws: PermissionDeniedError: Insufficient permissions to create contacts
```

### Custom Permission Checks

Check permissions programmatically:

```typescript
kernel.on('beforeInsert', async (ctx) => {
  // Custom permission logic
  if (ctx.objectName === 'opportunities' && ctx.data.amount > 100000) {
    // Large opportunities require special approval
    if (!ctx.user.roles.includes('senior_sales')) {
      throw new Error('Large opportunities require senior sales approval');
    }
  }
});
```

## Field-Level Security

Control access to specific fields:

```yaml
fields:
  salary:
    type: currency
    label: Salary
    visible_to: ['hr', 'admin']      # Only HR and admin can see
    editable_by: ['hr']              # Only HR can edit
  
  social_security:
    type: text
    label: SSN
    visible_to: ['hr']               # Only HR can see
    editable_by: []                  # No one can edit (read-only)
```

**Behavior:**
- Users without `visible_to` roles cannot see the field in queries or forms
- Users without `editable_by` roles cannot update the field
- Attempts to read/write restricted fields return 403 Forbidden

## Record-Level Security (RLS)

Filter records based on ownership or custom criteria:

### Ownership-Based Access

```typescript
kernel.on('beforeFind', async (ctx) => {
  // Non-admin users can only see their own records
  if (ctx.objectName === 'opportunities' && !ctx.user.roles.includes('admin')) {
    ctx.filters = ctx.filters || {};
    ctx.filters.owner = ctx.user.id;
  }
});
```

### Team-Based Access

```typescript
kernel.on('beforeFind', async (ctx) => {
  if (ctx.objectName === 'accounts') {
    // Users can see accounts owned by their team
    const userTeam = await kernel.findOne('users', ctx.user.id, {
      fields: ['team_id']
    });
    
    ctx.filters = ctx.filters || {};
    ctx.filters.team_id = userTeam.team_id;
  }
});
```

### Sharing Rules

Define sharing rules in metadata:

```yaml
# objects/opportunities.object.yml
sharing_rules:
  - name: Team Access
    criteria:
      team: current_user.team_id
    access: read_write
  
  - name: Manager Access
    criteria:
      reports_to: current_user.id
    access: read_only
```

## Roles and Profiles

### Defining Roles

Roles are defined in the auth system:

```yaml
# objects/_roles.object.yml
name: _roles
label: Role
system: true

records:
  - name: admin
    label: Administrator
    description: Full system access
  
  - name: sales
    label: Sales User
    description: Sales team member
  
  - name: support
    label: Support User
    description: Customer support
  
  - name: guest
    label: Guest
    description: Limited read-only access
```

### Assigning Roles

```typescript
// Assign role to user
await kernel.update('users', userId, {
  roles: ['sales', 'support']
});
```

### Role Hierarchy

Define role inheritance:

```yaml
role_hierarchy:
  admin:
    inherits: [sales, support, guest]
  
  sales:
    inherits: [guest]
  
  support:
    inherits: [guest]
```

## Input Validation & Sanitization

### Automatic Validation

ObjectOS automatically validates:
- Required fields
- Data types
- Unique constraints
- Min/max values
- Pattern matching

### Custom Validation

Add custom validation in hooks:

```typescript
kernel.on('beforeInsert:contacts', async (ctx) => {
  // Validate email domain
  if (ctx.data.email && !ctx.data.email.endsWith('@company.com')) {
    throw new Error('Only company email addresses allowed');
  }
  
  // Sanitize phone number
  if (ctx.data.phone) {
    ctx.data.phone = ctx.data.phone.replace(/[^0-9+]/g, '');
  }
});
```

### SQL Injection Prevention

ObjectOS drivers automatically parameterize queries:

```typescript
// Safe - parameters are escaped
await kernel.find('contacts', {
  filters: {
    email: userInput  // Automatically sanitized
  }
});
```

### XSS Prevention

Sanitize HTML content:

```typescript
import { sanitizeHtml } from '@objectos/security';

kernel.on('beforeInsert', async (ctx) => {
  if (ctx.data.description) {
    ctx.data.description = sanitizeHtml(ctx.data.description);
  }
});
```

## Audit Logging

Enable audit logging to track all changes:

```yaml
# objects/contacts.object.yml
name: contacts
enable_audit: true
```

### Audit Log Structure

```yaml
# objects/_audit_log.object.yml (system object)
name: _audit_log
system: true

fields:
  action:
    type: select
    options: [create, update, delete]
  
  object:
    type: text
  
  record_id:
    type: text
  
  user_id:
    type: lookup
    reference_to: users
  
  old_values:
    type: json
  
  new_values:
    type: json
  
  timestamp:
    type: datetime
  
  ip_address:
    type: text
```

### Querying Audit Logs

```typescript
// Get all changes to a record
const logs = await kernel.find('_audit_log', {
  filters: {
    object: 'contacts',
    record_id: 'contact_123'
  },
  sort: [{ field: 'timestamp', order: 'desc' }]
});
```

## Rate Limiting

Prevent abuse with rate limiting:

```typescript
import { RateLimitPlugin } from '@objectos/plugin-rate-limit';

kernel.use(RateLimitPlugin({
  windowMs: 60 * 1000,     // 1 minute
  maxRequests: 100,        // 100 requests per window
  perUser: true            // Rate limit per user
}));
```

## CORS Configuration

Configure Cross-Origin Resource Sharing:

```typescript
// packages/server/src/main.ts
const app = await NestFactory.create(AppModule);

app.enableCors({
  origin: [
    'http://localhost:5173',      // Development
    'https://app.example.com'     // Production
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

## API Key Authentication

For server-to-server communication:

```typescript
kernel.use(ApiKeyPlugin({
  keys: [
    {
      key: process.env.API_KEY_1,
      name: 'Integration Server',
      scopes: ['read:contacts', 'write:contacts']
    }
  ]
}));
```

**Usage:**
```bash
GET /api/data/contacts
X-API-Key: your-api-key-here
```

## Security Headers

Set security headers in production:

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Encryption

### Encrypting Sensitive Fields

```typescript
import { encrypt, decrypt } from '@objectos/security';

kernel.on('beforeInsert', async (ctx) => {
  // Encrypt SSN before storing
  if (ctx.data.social_security) {
    ctx.data.social_security = encrypt(ctx.data.social_security);
  }
});

kernel.on('afterFind', async (ctx) => {
  // Decrypt SSN when retrieving
  ctx.result.forEach(record => {
    if (record.social_security) {
      record.social_security = decrypt(record.social_security);
    }
  });
});
```

### Environment Variables

Never hard-code secrets:

```bash
# .env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key-here
ENCRYPTION_KEY=your-encryption-key-here
API_KEY=your-api-key-here
```

```typescript
// ❌ BAD
const secret = 'my-secret-key';

// ✅ GOOD
const secret = process.env.JWT_SECRET;
```

## Security Checklist

### Development

- [ ] Use environment variables for secrets
- [ ] Enable strict TypeScript mode
- [ ] Validate all user input
- [ ] Sanitize HTML content
- [ ] Use parameterized queries (automatic with drivers)
- [ ] Implement proper error handling
- [ ] Don't expose stack traces to clients

### Production

- [ ] Use HTTPS only
- [ ] Set security headers (helmet)
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Enable audit logging
- [ ] Use strong JWT secrets
- [ ] Implement session timeout
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Enable database encryption at rest
- [ ] Use VPC/private networks
- [ ] Implement IP whitelisting (if needed)

## Common Security Patterns

### 1. Multi-Factor Authentication

```typescript
kernel.use(MFAPlugin({
  enabled: true,
  methods: ['totp', 'sms'],
  required_for_roles: ['admin']
}));
```

### 2. Password Policies

```typescript
kernel.use(PasswordPolicyPlugin({
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventReuse: 5,         // Can't reuse last 5 passwords
  expiryDays: 90           // Force reset every 90 days
}));
```

### 3. Session Management

```typescript
kernel.use(SessionPlugin({
  maxAge: 24 * 60 * 60 * 1000,  // 24 hours
  rolling: true,                 // Refresh on activity
  secure: true,                  // HTTPS only
  httpOnly: true,                // Not accessible via JavaScript
  sameSite: 'strict'
}));
```

## Testing Security

Test security in your test suite:

```typescript
describe('Security', () => {
  it('should deny access without authentication', async () => {
    await expect(
      kernel.find('contacts', {}, null)  // No user context
    ).rejects.toThrow('Authentication required');
  });
  
  it('should deny create without permission', async () => {
    const guestUser = { id: '1', roles: ['guest'] };
    
    await expect(
      kernel.insert('contacts', { email: 'test@test.com' }, guestUser)
    ).rejects.toThrow('Insufficient permissions');
  });
  
  it('should filter records by ownership', async () => {
    const user = { id: 'user_1', roles: ['sales'] };
    
    const results = await kernel.find('opportunities', {}, user);
    
    // All results should belong to user
    expect(results.every(r => r.owner === user.id)).toBe(true);
  });
});
```

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Better-Auth Documentation](https://better-auth.com)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## Related Documentation

- [Logic Hooks](./logic-hooks.md) - Implement custom security logic
- [SDK Reference](./sdk-reference.md) - API reference
- [HTTP Protocol](../spec/http-protocol.md) - Authentication headers
