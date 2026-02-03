# Better-Auth Deep Integration Plan for ObjectOS

> **Document Version**: 1.0.0  
> **Date**: February 3, 2026  
> **Status**: Assessment Complete - Ready for Implementation
> **Author**: ObjectOS Lead Architect

---

## 📋 Executive Summary

This document provides a comprehensive plan for deeply integrating better-auth as the unified authentication and authorization service across the entire ObjectOS project. The plan evaluates current implementation, identifies gaps against @objectstack/spec requirements, and outlines a complete development roadmap for production deployment.

### Key Findings

1. **✅ Foundation Exists**: `@objectos/plugin-better-auth` plugin is already implemented with core lifecycle
2. **⚠️ Partial Integration**: better-auth is only partially integrated; @objectos/plugin-server still has duplicate auth code
3. **❌ Spec Gaps**: Several @objectstack/spec authentication and security requirements are not fully implemented
4. **🎯 Clear Path Forward**: Well-defined migration path with minimal breaking changes

### Success Metrics

- [ ] 100% of authentication flows use better-auth
- [ ] All @objectstack/spec auth/security requirements implemented
- [ ] Zero duplicate authentication code across packages
- [ ] 90%+ test coverage for auth flows
- [ ] Complete API documentation
- [ ] Production deployment guide

---

## 🔍 Current State Analysis

### Package Inventory

| Package | Auth Implementation | Status | Notes |
|---------|-------------------|--------|-------|
| **@objectos/plugin-better-auth** | better-auth plugin | ✅ Complete | v0.1.0, fully functional |
| **@objectos/plugin-server** | Duplicate auth code | ⚠️ Needs Migration | Has own auth.controller.ts, auth.middleware.ts |
| **@objectos/plugin-permissions** | Permission types only | ⚠️ Incomplete | Only exports types, no runtime enforcement |
| **@objectos/plugin-audit-log** | No auth integration | ⚠️ Needs Integration | Should log auth events |
| **@objectstack/runtime** | No auth support | ⚠️ Needs Enhancement | Missing auth context in PluginContext |
| **@objectos/kernel** (deprecated) | Full auth system | ⛔ Deprecated | Should not be enhanced |
| **@objectos/server** (deprecated) | Full auth system | ⛔ Deprecated | Should not be enhanced |

### Better-Auth Plugin Features

**Already Implemented:**
- ✅ Email/Password authentication
- ✅ Organization management (multi-tenant)
- ✅ Team management
- ✅ Role-based access control (owner, admin, user)
- ✅ Multi-database support (PostgreSQL, MongoDB, SQLite)
- ✅ First user auto-promotion to super_admin
- ✅ Plugin lifecycle (init, start, destroy)
- ✅ Route registration at `/api/auth/*`

**Missing:**
- ❌ OAuth2/OIDC providers (Google, GitHub, etc.)
- ❌ Two-factor authentication (2FA)
- ❌ Session management UI
- ❌ Password reset flow
- ❌ Email verification
- ❌ API key authentication
- ❌ Rate limiting
- ❌ Brute force protection

### @objectstack/spec Compliance Matrix

#### Authentication Requirements

| Requirement | Spec Reference | Current Status | Gap |
|-------------|---------------|----------------|-----|
| **User Authentication** | System.User | ✅ Implemented | better-auth handles |
| **Session Management** | System.Session | ✅ Implemented | better-auth handles |
| **Token-based Auth** | API.Authentication | ✅ Implemented | JWT via better-auth |
| **OAuth2/OIDC** | API.Authentication | ❌ Missing | Need better-auth plugins |
| **API Key Auth** | API.Authentication | ❌ Missing | Need custom implementation |
| **Multi-factor Auth** | System.Security | ❌ Missing | Need better-auth plugins |

#### Authorization Requirements

| Requirement | Spec Reference | Current Status | Gap |
|-------------|---------------|----------------|-----|
| **Role-based Access Control (RBAC)** | System.Permission | ⚠️ Partial | better-auth has org roles, need system-wide RBAC |
| **Object Permissions** | Data.PermissionSet | ⚠️ Partial | Kernel has it, need plugin |
| **Field-level Security** | Data.Field.permissions | ⚠️ Partial | Kernel has it, need plugin |
| **Record-level Security (RLS)** | Data.Hook.recordLevelSecurity | ❌ Missing | Need implementation |
| **Permission Sets** | System.PermissionSet | ❌ Missing | Need implementation |
| **Sharing Rules** | System.SharingRule | ❌ Missing | Need implementation |

#### Security Requirements

| Requirement | Spec Reference | Current Status | Gap |
|-------------|---------------|----------------|-----|
| **Audit Logging** | System.AuditEvent | ✅ Implemented | @objectos/plugin-audit-log |
| **CORS Configuration** | API.Security | ⚠️ Partial | In better-auth config, need system-wide |
| **Rate Limiting** | API.Security | ❌ Missing | Need implementation |
| **XSS Protection** | API.Security | ❌ Missing | Need headers middleware |
| **CSRF Protection** | API.Security | ❌ Missing | Need tokens |
| **SQL Injection Prevention** | Data.Security | ✅ Implemented | Driver-level parameterization |

#### API Requirements

| Requirement | Spec Reference | Current Status | Gap |
|-------------|---------------|----------------|-----|
| **Authentication Endpoints** | API.Endpoint.auth | ✅ Implemented | `/api/auth/*` via better-auth |
| **Authorization Header** | API.Request.headers | ✅ Implemented | `Authorization: Bearer <token>` |
| **Session Context** | API.Request.context | ⚠️ Partial | In middleware, need in PluginContext |
| **User Context** | API.Request.user | ✅ Implemented | In auth.middleware.ts |
| **Permission Check API** | API.Endpoint.permissions | ❌ Missing | Need `/api/permissions/check` |

### Duplicate Code Analysis

**Files with Duplicate Auth Logic:**

1. **packages/plugins/server/src/auth/**
   - `auth.controller.ts` - Duplicates better-auth handler
   - `auth.middleware.ts` - Custom middleware (should use better-auth session)
   - `auth.client.ts` - Duplicates better-auth client initialization
   - `auth.module.ts` - Module configuration

2. **packages/kernel/src/permissions/** (Deprecated but still referenced)
   - `permission-set-loader.ts`
   - `permission-manager.ts`
   - `object-permissions.ts`
   - `field-permissions.ts`

**Estimated Lines of Duplicate Code**: ~1,500 lines

---

## 🎯 Integration Architecture

### Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    @objectstack/runtime                      │
│  • Enhanced PluginContext with auth helpers                 │
│  • Security hooks (beforeAuth, afterAuth, onUnauthorized)   │
│  • User context propagation                                 │
└──────────────┬──────────────────────────────────────────────┘
               │
       ┌───────┴────────┬────────────┬──────────┬─────────────┐
       │                │            │          │             │
┌──────▼─────────┐ ┌───▼────┐ ┌────▼────┐ ┌───▼─────┐ ┌─────▼──────┐
│ Better-Auth    │ │ Perms  │ │ Audit   │ │ Server  │ │ Other      │
│ Plugin         │ │ Plugin │ │ Log     │ │ Plugin  │ │ Plugins    │
│                │ │        │ │ Plugin  │ │         │ │            │
│ • Auth/Session │ │ • RBAC │ │ • Track │ │ • API   │ │            │
│ • Org/Teams    │ │ • RLS  │ │ • Audit │ │ • HTTP  │ │            │
└────────────────┘ └────────┘ └─────────┘ └─────────┘ └────────────┘
```

### Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│  Client  │────▶│ Server Plugin│────▶│ Better-Auth │────▶│ Database │
│          │     │ (Middleware) │     │   Plugin    │     │          │
└──────────┘     └──────────────┘     └─────────────┘     └──────────┘
      │                  │                     │                 │
      │ 1. HTTP Request  │                     │                 │
      │ with Auth Header │                     │                 │
      ├─────────────────▶│                     │                 │
      │                  │ 2. Extract Session  │                 │
      │                  ├────────────────────▶│                 │
      │                  │                     │ 3. Query User   │
      │                  │                     ├────────────────▶│
      │                  │                     │◀────────────────┤
      │                  │ 4. User + Roles     │                 │
      │                  │◀────────────────────┤                 │
      │                  │ 5. Attach to req    │                 │
      │                  │                     │                 │
      │ 6. Proceed       │                     │                 │
      │◀─────────────────┤                     │                 │
```

### Authorization Flow (with Permissions Plugin)

```
┌──────────┐     ┌──────────────┐     ┌─────────────────┐     ┌────────┐
│  Client  │────▶│ API Endpoint │────▶│ Permissions     │────▶│ObjectQL│
│          │     │              │     │ Plugin          │     │        │
└──────────┘     └──────────────┘     └─────────────────┘     └────────┘
      │                  │                     │                    │
      │ 1. API Call      │                     │                    │
      │ (e.g., create)   │                     │                    │
      ├─────────────────▶│                     │                    │
      │                  │ 2. Check Permission │                    │
      │                  ├────────────────────▶│                    │
      │                  │                     │ 3. Load Permission │
      │                  │                     │    Set for Role    │
      │                  │                     │                    │
      │                  │ 4. Allow/Deny       │                    │
      │                  │◀────────────────────┤                    │
      │                  │                     │                    │
      │                  │ 5. Execute Query    │                    │
      │                  │ (if allowed)        │                    │
      │                  ├────────────────────────────────────────▶│
      │                  │◀───────────────────────────────────────┤
      │ 6. Response      │                     │                    │
      │◀─────────────────┤                     │                    │
```

---

## 📐 Implementation Phases

### Phase 1: Runtime Enhancement (Week 1-2)

**Objective**: Enhance @objectstack/runtime to support authentication context

#### 1.1 PluginContext Enhancement

**File**: `packages/runtime/src/types.ts`

Add authentication context to PluginContext:

```typescript
export interface AuthContext {
  /**
   * Current authenticated user (if any)
   */
  user?: {
    id: string;
    email?: string;
    role: string;
    roles: string[];
    organizationId?: string;
    teamIds?: string[];
    isSystem: boolean;
  };

  /**
   * Session information
   */
  session?: {
    id: string;
    expiresAt: Date;
    activeOrganizationId?: string;
  };

  /**
   * Check if user has permission
   */
  hasPermission(permission: string): Promise<boolean>;

  /**
   * Check if user has role
   */
  hasRole(role: string): boolean;

  /**
   * Check if user can perform action on object
   */
  canAccess(object: string, action: 'create' | 'read' | 'update' | 'delete'): Promise<boolean>;
}

export interface PluginContext {
  // ... existing members ...

  /**
   * Authentication context (if available)
   */
  auth?: AuthContext;

  /**
   * Set authentication context (called by auth plugin)
   */
  setAuth(auth: AuthContext): void;
}
```

#### 1.2 Security Hooks

**File**: `packages/runtime/src/kernel.ts`

Add security lifecycle hooks:

```typescript
export class ObjectKernel {
  // ... existing code ...

  /**
   * Register security hooks
   */
  async bootstrap(): Promise<void> {
    // ... existing bootstrap code ...

    // Add security hooks
    this.context.registerHook('auth:beforeAuthenticate');
    this.context.registerHook('auth:afterAuthenticate');
    this.context.registerHook('auth:onUnauthorized');
    this.context.registerHook('auth:beforeAuthorize');
    this.context.registerHook('auth:afterAuthorize');
    this.context.registerHook('auth:onForbidden');

    // ... rest of bootstrap ...
  }
}
```

**Deliverables:**
- ✅ Enhanced PluginContext with AuthContext
- ✅ Security hooks in kernel
- ✅ Type definitions updated
- ✅ Unit tests (10+ tests)
- ✅ Documentation updated

---

### Phase 2: Better-Auth Plugin Enhancement (Week 2-3)

**Objective**: Enhance better-auth plugin with missing features and runtime integration

#### 2.1 OAuth2/OIDC Support

**File**: `packages/plugins/better-auth/src/auth-client.ts`

Add OAuth providers:

```typescript
import { google, github } from "better-auth/plugins/oauth";

export const getBetterAuth = async (config: BetterAuthConfig = {}) => {
  // ... existing code ...

  authInstance = betterAuth({
    // ... existing config ...
    
    plugins: [
      // OAuth providers
      google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        enabled: !!process.env.GOOGLE_CLIENT_ID,
      }),
      github({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        enabled: !!process.env.GITHUB_CLIENT_ID,
      }),
      
      // ... existing organization plugin ...
    ]
  });

  return authInstance;
};
```

#### 2.2 Two-Factor Authentication

**File**: `packages/plugins/better-auth/src/auth-client.ts`

```typescript
import { twoFactor } from "better-auth/plugins";

export const getBetterAuth = async (config: BetterAuthConfig = {}) => {
  // ... existing code ...

  authInstance = betterAuth({
    // ... existing config ...
    
    plugins: [
      twoFactor({
        enabled: config.twoFactorEnabled ?? true,
        issuer: config.twoFactorIssuer || "ObjectOS",
      }),
      // ... other plugins ...
    ]
  });

  return authInstance;
};
```

#### 2.3 Runtime Integration

**File**: `packages/plugins/better-auth/src/plugin.ts`

Enhance plugin to set auth context:

```typescript
export class BetterAuthPlugin implements Plugin {
  // ... existing code ...

  async init(context: PluginContext): Promise<void> {
    this.context = context;

    // ... existing initialization ...

    // Register auth context helper
    context.registerService('auth:getContext', async (req: any) => {
      const session = await this.getSession(req);
      
      if (!session) return null;

      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role || 'user',
          roles: [session.user.role || 'user'],
          organizationId: session.session.activeOrganizationId,
          isSystem: session.user.role === 'super_admin',
        },
        session: {
          id: session.session.id,
          expiresAt: new Date(session.session.expiresAt),
          activeOrganizationId: session.session.activeOrganizationId,
        },
        hasPermission: async (permission: string) => {
          // Delegate to permissions plugin
          const permsPlugin = context.getService('permissions');
          return permsPlugin?.hasPermission(session.user, permission) ?? false;
        },
        hasRole: (role: string) => {
          return session.user.role === role;
        },
        canAccess: async (object: string, action: string) => {
          // Delegate to permissions plugin
          const permsPlugin = context.getService('permissions');
          return permsPlugin?.canAccess(session.user, object, action) ?? false;
        },
      };
    });

    // ... rest of init ...
  }

  private async getSession(req: any): Promise<any> {
    if (!this.authInstance) return null;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers || {})) {
      if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, v));
      } else if (value) {
        headers.append(key, value as string);
      }
    }

    return await this.authInstance.api.getSession({ headers });
  }
}
```

**Deliverables:**
- ✅ OAuth2/OIDC support (Google, GitHub)
- ✅ Two-factor authentication
- ✅ Runtime context integration
- ✅ Session helpers
- ✅ Unit tests (15+ tests)
- ✅ Integration tests (5+ tests)

---

### Phase 3: Permissions Plugin Implementation (Week 3-5)

**Objective**: Create comprehensive permissions plugin for RBAC, RLS, and field-level security

#### 3.1 Plugin Structure

**File**: `packages/plugins/permissions/src/plugin.ts`

```typescript
import type { Plugin, PluginContext } from '@objectstack/runtime';

export interface PermissionsPluginConfig {
  defaultDeny?: boolean;
  permissionsDir?: string;
  enableCache?: boolean;
  cacheTimeout?: number;
}

export class PermissionsPlugin implements Plugin {
  name = 'com.objectos.permissions';
  version = '0.1.0';
  dependencies = ['com.objectos.auth.better-auth'];

  private config: PermissionsPluginConfig;
  private permissionSets: Map<string, PermissionSet> = new Map();
  private cache?: Map<string, any>;

  constructor(config: PermissionsPluginConfig = {}) {
    this.config = {
      defaultDeny: true,
      enableCache: true,
      cacheTimeout: 300000, // 5 minutes
      ...config,
    };
  }

  async init(context: PluginContext): Promise<void> {
    context.logger.info('[Permissions Plugin] Initializing...');

    // Load permission sets from YAML files
    await this.loadPermissionSets();

    // Register services
    context.registerService('permissions', this);
    context.registerService('permissions:check', this.checkPermission.bind(this));

    // Register hooks
    context.hook('data:beforeCreate', this.enforceCreatePermission.bind(this));
    context.hook('data:beforeRead', this.enforceReadPermission.bind(this));
    context.hook('data:beforeUpdate', this.enforceUpdatePermission.bind(this));
    context.hook('data:beforeDelete', this.enforceDeletePermission.bind(this));

    context.logger.info('[Permissions Plugin] Initialized successfully');
  }

  async checkPermission(user: any, permission: string): Promise<boolean> {
    // Check cache first
    if (this.config.enableCache && this.cache) {
      const cacheKey = `${user.id}:${permission}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }
    }

    // Get permission set for user's role
    const permSet = this.permissionSets.get(user.role);
    if (!permSet) {
      return !this.config.defaultDeny;
    }

    // Check permission
    const hasPermission = permSet.permissions.includes(permission) ||
                         permSet.permissions.includes('*');

    // Cache result
    if (this.config.enableCache && this.cache) {
      const cacheKey = `${user.id}:${permission}`;
      this.cache.set(cacheKey, hasPermission);
      setTimeout(() => this.cache?.delete(cacheKey), this.config.cacheTimeout);
    }

    return hasPermission;
  }

  async canAccess(user: any, object: string, action: string): Promise<boolean> {
    // Load object permissions
    const objectPerms = await this.getObjectPermissions(object);
    if (!objectPerms) {
      return !this.config.defaultDeny;
    }

    // Check action permission
    const permKey = `allow${action.charAt(0).toUpperCase() + action.slice(1)}`;
    const allowedRoles = objectPerms[permKey];

    if (allowedRoles === true) {
      return true;
    }

    if (Array.isArray(allowedRoles)) {
      return user.roles.some(role => allowedRoles.includes(role));
    }

    return false;
  }

  private async enforceCreatePermission(context: any, data: any): Promise<void> {
    const { user, object } = context;
    
    if (!user || user.isSystem) {
      return; // System user bypasses permission checks
    }

    const canCreate = await this.canAccess(user, object, 'create');
    if (!canCreate) {
      throw new Error(`Permission denied: User ${user.id} cannot create ${object}`);
    }
  }

  // Similar implementations for Read, Update, Delete...

  private async loadPermissionSets(): Promise<void> {
    // Load from YAML files in permissionsDir
    // Implementation details...
  }

  private async getObjectPermissions(object: string): Promise<any> {
    // Load object permissions from metadata
    // Implementation details...
  }
}
```

#### 3.2 Permission Set YAML Format

**File**: `permissions/admin.permission.yml`

```yaml
name: admin
label: Administrator
permissions:
  # System permissions
  - system.user.read
  - system.user.write
  - system.settings.read
  - system.settings.write
  
  # Object permissions (wildcard)
  - data.*.create
  - data.*.read
  - data.*.update
  - data.*.delete

# Object-specific overrides
objects:
  _audit_log:
    allowCreate: false
    allowRead: true
    allowUpdate: false
    allowDelete: false
```

**Deliverables:**
- ✅ PermissionsPlugin implementation
- ✅ Permission set loader
- ✅ RBAC enforcement
- ✅ Object-level permissions
- ✅ Field-level security
- ✅ Permission cache
- ✅ Unit tests (20+ tests)
- ✅ Integration tests (10+ tests)
- ✅ YAML schema documentation

---

### Phase 4: Server Plugin Migration (Week 5-6)

**Objective**: Migrate @objectos/plugin-server to use better-auth plugin exclusively

#### 4.1 Remove Duplicate Auth Code

**Files to Delete:**
- `packages/plugins/server/src/auth/auth.controller.ts` ❌
- `packages/plugins/server/src/auth/auth.client.ts` ❌

**Files to Modify:**
- `packages/plugins/server/src/auth/auth.middleware.ts` ✏️
- `packages/plugins/server/src/auth/auth.module.ts` ✏️

#### 4.2 Updated Auth Middleware

**File**: `packages/plugins/server/src/auth/auth.middleware.ts`

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    @Inject('KERNEL') private kernel: ObjectKernel,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Get auth context from better-auth plugin via kernel
      const getAuthContext = this.kernel.getService('auth:getContext');
      const authContext = await getAuthContext(req);

      if (authContext) {
        // Attach user and session to request
        req.user = authContext.user;
        req.session = authContext.session;
        
        // Also attach to kernel context for this request
        const pluginContext = this.kernel.pluginContext;
        pluginContext.setAuth(authContext);
      } else {
        // Anonymous user
        req.user = {
          roles: ['guest'],
          isSystem: false
        };
      }
    } catch (e) {
      console.error("Auth Middleware Error:", e);
      req.user = {
        roles: ['guest'],
        isSystem: false
      };
    }

    next();
  }
}
```

#### 4.3 Updated Auth Module

**File**: `packages/plugins/server/src/auth/auth.module.ts`

```typescript
import { Module, Global } from '@nestjs/common';
import { AuthMiddleware } from './auth.middleware';

@Global()
@Module({
  providers: [
    AuthMiddleware,
  ],
  exports: [
    AuthMiddleware,
  ],
})
export class AuthModule {}
```

**Deliverables:**
- ✅ Removed duplicate auth code
- ✅ Updated middleware to use better-auth
- ✅ Updated module configuration
- ✅ Updated tests
- ✅ Migration guide for developers

---

### Phase 5: Audit Log Integration (Week 6-7)

**Objective**: Integrate audit-log plugin with authentication events

#### 5.1 Auth Event Logging

**File**: `packages/plugins/better-auth/src/plugin.ts`

```typescript
export class BetterAuthPlugin implements Plugin {
  // ... existing code ...

  async init(context: PluginContext): Promise<void> {
    // ... existing initialization ...

    // Hook into better-auth events and emit audit events
    context.hook('auth:afterAuthenticate', async (session: any) => {
      await context.trigger('audit:log', {
        event: 'user.login',
        userId: session.user.id,
        timestamp: new Date(),
        metadata: {
          sessionId: session.session.id,
          organizationId: session.session.activeOrganizationId,
        },
      });
    });

    context.hook('auth:beforeSignOut', async (session: any) => {
      await context.trigger('audit:log', {
        event: 'user.logout',
        userId: session.user.id,
        timestamp: new Date(),
        metadata: {
          sessionId: session.session.id,
        },
      });
    });

    // ... rest of init ...
  }
}
```

**Deliverables:**
- ✅ Auth event logging
- ✅ Integration with audit-log plugin
- ✅ Event schema documentation
- ✅ Tests

---

### Phase 6: API Enhancement (Week 7-8)

**Objective**: Add missing API endpoints and security features

#### 6.1 Permission Check API

**File**: `packages/plugins/server/src/api/permissions.controller.ts` (New)

```typescript
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/permissions')
@UseGuards(AuthGuard)
export class PermissionsController {
  constructor(
    @Inject('KERNEL') private kernel: ObjectKernel,
  ) {}

  @Post('check')
  async checkPermission(
    @Req() req: Request,
    @Body() body: { permission?: string; object?: string; action?: string }
  ) {
    const user = req.user;
    const permsPlugin = this.kernel.getService('permissions');

    if (body.permission) {
      const hasPermission = await permsPlugin.checkPermission(user, body.permission);
      return { hasPermission };
    }

    if (body.object && body.action) {
      const canAccess = await permsPlugin.canAccess(user, body.object, body.action);
      return { canAccess };
    }

    throw new Error('Either permission or (object + action) must be provided');
  }

  @Post('check-batch')
  async checkBatchPermissions(
    @Req() req: Request,
    @Body() body: { checks: Array<{ permission?: string; object?: string; action?: string }> }
  ) {
    const user = req.user;
    const permsPlugin = this.kernel.getService('permissions');

    const results = await Promise.all(
      body.checks.map(async (check) => {
        if (check.permission) {
          return {
            ...check,
            hasPermission: await permsPlugin.checkPermission(user, check.permission),
          };
        }
        if (check.object && check.action) {
          return {
            ...check,
            canAccess: await permsPlugin.canAccess(user, check.object, check.action),
          };
        }
        return { ...check, error: 'Invalid check format' };
      })
    );

    return { results };
  }
}
```

#### 6.2 Rate Limiting Middleware

**File**: `packages/plugins/server/src/middleware/rate-limit.middleware.ts` (New)

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number = 60000; // 1 minute
  private readonly maxRequests: number = 100;

  use(req: Request, res: Response, next: NextFunction) {
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();

    // Get or create request log for this key
    let requestLog = this.requests.get(key as string) || [];

    // Remove requests outside the time window
    requestLog = requestLog.filter(time => now - time < this.windowMs);

    // Check if limit exceeded
    if (requestLog.length >= this.maxRequests) {
      res.status(429).json({
        success: false,
        error: {
          code: 429,
          message: 'Too many requests',
          retryAfter: Math.ceil((requestLog[0] + this.windowMs - now) / 1000),
        },
      });
      return;
    }

    // Add current request
    requestLog.push(now);
    this.requests.set(key as string, requestLog);

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      for (const [k, log] of this.requests.entries()) {
        const cleanLog = log.filter(time => now - time < this.windowMs);
        if (cleanLog.length === 0) {
          this.requests.delete(k);
        } else {
          this.requests.set(k, cleanLog);
        }
      }
    }

    next();
  }
}
```

#### 6.3 Security Headers Middleware

**File**: `packages/plugins/server/src/middleware/security-headers.middleware.ts` (New)

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // XSS Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Frame options
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    );
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    next();
  }
}
```

**Deliverables:**
- ✅ Permission check API endpoints
- ✅ Rate limiting middleware
- ✅ Security headers middleware
- ✅ CSRF protection (optional)
- ✅ API documentation
- ✅ Tests

---

### Phase 7: Testing & Documentation (Week 8-9)

**Objective**: Comprehensive testing and documentation

#### 7.1 Test Coverage Goals

| Component | Target Coverage | Tests |
|-----------|----------------|-------|
| Better-Auth Plugin | 90%+ | Unit + Integration |
| Permissions Plugin | 90%+ | Unit + Integration |
| Server Plugin Auth | 85%+ | Unit + E2E |
| Runtime Auth Context | 90%+ | Unit |
| API Endpoints | 85%+ | E2E |

#### 7.2 Documentation Deliverables

1. **Authentication Guide**
   - Setup instructions
   - OAuth configuration
   - 2FA setup
   - Session management
   - API authentication

2. **Authorization Guide**
   - Permission system overview
   - Role configuration
   - Permission sets
   - Object permissions
   - Field-level security
   - Record-level security

3. **Security Guide**
   - Security best practices
   - CORS configuration
   - Rate limiting
   - XSS/CSRF protection
   - Audit logging

4. **API Reference**
   - Authentication endpoints
   - Authorization endpoints
   - Error codes
   - Examples

5. **Migration Guide**
   - From kernel to runtime
   - From old auth to better-auth
   - Breaking changes
   - Upgrade checklist

**Deliverables:**
- ✅ 90%+ test coverage
- ✅ All documentation complete
- ✅ API reference published
- ✅ Migration guide
- ✅ Example applications

---

### Phase 8: Production Deployment (Week 9-10)

**Objective**: Production-ready deployment

#### 8.1 Deployment Checklist

- [ ] Environment variable configuration
- [ ] Database migration scripts
- [ ] Docker images
- [ ] Kubernetes manifests (optional)
- [ ] Health check endpoints
- [ ] Monitoring integration
- [ ] Backup strategy
- [ ] Disaster recovery plan

#### 8.2 Performance Optimization

- [ ] Permission cache implementation
- [ ] Session cache (Redis)
- [ ] Database query optimization
- [ ] Connection pooling
- [ ] Response compression

#### 8.3 Security Hardening

- [ ] Secrets management (HashiCorp Vault / AWS Secrets Manager)
- [ ] SSL/TLS configuration
- [ ] Security headers
- [ ] Penetration testing
- [ ] Vulnerability scanning
- [ ] Security audit

**Deliverables:**
- ✅ Production deployment guide
- ✅ Docker images
- ✅ Performance benchmarks
- ✅ Security audit report
- ✅ Monitoring dashboards

---

## 📊 Success Metrics

### Functional Metrics

- [ ] 100% of authentication flows use better-auth
- [ ] All @objectstack/spec auth requirements implemented
- [ ] Zero duplicate authentication code
- [ ] 90%+ test coverage for auth/authz code
- [ ] All deprecated packages removed from dependencies

### Performance Metrics

- [ ] Authentication response time < 100ms (p95)
- [ ] Permission check latency < 50ms (p95)
- [ ] Session lookup < 10ms (with cache)
- [ ] API throughput > 1000 req/s

### Security Metrics

- [ ] Zero critical vulnerabilities
- [ ] All OWASP Top 10 mitigations in place
- [ ] Penetration test passed
- [ ] Security audit passed

---

## 🚨 Risks & Mitigation

### Risk 1: Breaking Changes

**Impact**: High  
**Probability**: Medium

**Mitigation**:
- Maintain backward compatibility layer during migration
- Provide comprehensive migration guide
- Version all APIs
- Deprecation warnings for 2 releases before removal

### Risk 2: Performance Degradation

**Impact**: Medium  
**Probability**: Low

**Mitigation**:
- Implement caching at all levels
- Load test before production
- Monitor performance metrics
- Optimize database queries

### Risk 3: Security Vulnerabilities

**Impact**: Critical  
**Probability**: Low

**Mitigation**:
- Regular security audits
- Dependency scanning
- Penetration testing
- Bug bounty program

### Risk 4: Integration Complexity

**Impact**: Medium  
**Probability**: Medium

**Mitigation**:
- Start with small, isolated changes
- Comprehensive testing at each phase
- Rollback plan for each phase
- Parallel run of old and new systems during transition

---

## 📅 Timeline Summary

| Phase | Duration | Start | End | Deliverables |
|-------|----------|-------|-----|--------------|
| Phase 1: Runtime Enhancement | 2 weeks | Week 1 | Week 2 | Enhanced PluginContext |
| Phase 2: Better-Auth Enhancement | 1 week | Week 2 | Week 3 | OAuth, 2FA |
| Phase 3: Permissions Plugin | 2 weeks | Week 3 | Week 5 | RBAC, RLS |
| Phase 4: Server Migration | 1 week | Week 5 | Week 6 | Remove duplicates |
| Phase 5: Audit Integration | 1 week | Week 6 | Week 7 | Event logging |
| Phase 6: API Enhancement | 1 week | Week 7 | Week 8 | New endpoints |
| Phase 7: Testing & Docs | 1 week | Week 8 | Week 9 | Complete docs |
| Phase 8: Production | 1 week | Week 9 | Week 10 | Deployment |

**Total Duration**: 10 weeks

---

## ✅ Next Steps

### Immediate Actions (This Week)

1. **Review & Approve Plan**
   - Technical review with team
   - Stakeholder approval
   - Resource allocation

2. **Setup Development Environment**
   - Clone repository
   - Install dependencies
   - Configure test databases

3. **Begin Phase 1**
   - Create feature branch
   - Enhance PluginContext types
   - Add security hooks
   - Write initial tests

### Week 2 Actions

1. **Complete Phase 1**
   - Finish runtime enhancements
   - Code review
   - Merge to main

2. **Begin Phase 2**
   - Add OAuth support
   - Implement 2FA
   - Runtime integration

---

## 📝 Appendices

### Appendix A: Environment Variables

```bash
# Better-Auth Configuration
BETTER_AUTH_URL=http://localhost:3000/api/auth
BETTER_AUTH_SECRET=your-secret-key-here

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Database
OBJECTQL_DATABASE_URL=postgres://user:pass@localhost:5432/objectos

# Session
SESSION_SECRET=your-session-secret
SESSION_TIMEOUT=3600000

# Security
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Appendix B: Database Schema

Better-Auth automatically creates the following tables:

- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth accounts
- `verification` - Email verifications
- `organization` - Organizations
- `member` - Organization members
- `invitation` - Organization invitations
- `team` - Teams within organizations

No manual schema creation needed.

### Appendix C: API Endpoints Summary

#### Authentication Endpoints (via better-auth)

- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in/email` - Email/password login
- `POST /api/auth/sign-in/google` - Google OAuth login
- `POST /api/auth/sign-in/github` - GitHub OAuth login
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/get-session` - Get current session
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/two-factor/verify` - Verify 2FA code
- `POST /api/auth/two-factor/enable` - Enable 2FA
- `POST /api/auth/two-factor/disable` - Disable 2FA

#### Permission Endpoints (new)

- `POST /api/permissions/check` - Check single permission
- `POST /api/permissions/check-batch` - Check multiple permissions
- `GET /api/permissions/my-permissions` - Get current user's permissions
- `GET /api/permissions/roles` - List available roles
- `GET /api/permissions/role/:roleName` - Get role permissions

---

## 📚 References

1. [Better-Auth Documentation](https://www.better-auth.com/docs)
2. [@objectstack/spec Protocol](https://github.com/objectstack-ai/spec)
3. [ObjectOS Architecture](./ARCHITECTURE.md)
4. [Spec System Development Plan](./SPEC_SYSTEM_DEVELOPMENT_PLAN.md)
5. [NestJS Documentation](https://docs.nestjs.com/)

---

**Document Status**: ✅ Ready for Implementation  
**Last Updated**: February 3, 2026  
**Next Review**: End of Phase 1 (Week 2)
