# Base Layer Implementation Guide

## 概述

本文档提供 ObjectQL Base 层的详细实现指南，包括代码示例、API 设计、以及集成步骤。

## 一、类型定义

### 1.1 扩展 TypeScript 类型

**文件**: `packages/metadata/src/types.ts`

添加 Base 相关类型：

```typescript
/**
 * Base role types for access control
 */
export type BaseRole = 'owner' | 'editor' | 'commenter' | 'viewer';

/**
 * Base member configuration
 */
export interface BaseMember {
  baseId: string;
  userId: string;
  role: BaseRole;
  permissions?: Record<string, boolean>;
  invitedBy?: string;
  invitedAt?: Date;
  joinedAt?: Date;
  lastAccessedAt?: Date;
}

/**
 * Base settings configuration
 */
export interface BaseSettings {
  /** Default timezone for the base */
  timezone?: string;
  /** Locale for date/number formatting */
  locale?: string;
  /** Default view when opening the base */
  defaultView?: string;
  /** Whether to show archived records by default */
  showArchived?: boolean;
  /** Custom field for additional settings */
  [key: string]: any;
}

/**
 * Base configuration metadata
 */
export interface BaseConfig {
  /** Unique identifier */
  id?: string;
  /** Base name */
  name: string;
  /** URL-friendly slug */
  slug: string;
  /** Description */
  description?: string;
  /** Icon identifier */
  icon?: string;
  /** Color theme */
  color?: 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'gray' | 'pink' | 'teal';
  /** Cover image URL */
  cover?: string;
  /** Organization ID this base belongs to */
  organizationId: string;
  /** Whether this is a template */
  isTemplate?: boolean;
  /** Whether this is archived */
  isArchived?: boolean;
  /** Whether this is publicly accessible */
  isPublic?: boolean;
  /** Base settings */
  settings?: BaseSettings;
  /** Template category */
  templateCategory?: string;
  /** Created by user ID */
  createdBy?: string;
  /** Created timestamp */
  createdAt?: Date;
  /** Updated timestamp */
  updatedAt?: Date;
}
```

### 1.2 扩展现有类型

扩展 `ObjectConfig` 以支持 Base 关联：

```typescript
export interface ObjectConfig {
  name: string;
  label?: string;
  description?: string;
  icon?: string;
  
  /** Base ID this object belongs to (optional) */
  baseId?: string;
  
  fields?: Record<string, FieldConfig>;
  methods?: Record<string, Function>;
  listeners?: Record<string, Function>;
  actions?: Record<string, ActionConfig>;
  data?: any[];
}
```

扩展 `AppConfig` 以支持 Base 关联：

```typescript
export interface AppConfig {
  id?: string;
  name: string;
  code?: string;
  description?: string;
  icon?: string;
  color?: string;
  dark?: boolean;
  
  /** Base ID this app belongs to (optional) */
  baseId?: string;
  
  menu?: AppMenuSection[] | AppMenuItem[];
}
```

### 1.3 扩展 Context

**文件**: `packages/core/src/types.ts`

```typescript
export interface ObjectQLContext {
  // === Identity & Isolation ===
  userId?: string;
  spaceId?: string;      // Organization ID
  baseId?: string;       // ← 新增：Base ID for data isolation
  roles: string[];
  
  // ... rest of the interface
}

export interface ObjectQLContextOptions {
  userId?: string;
  spaceId?: string;
  baseId?: string;       // ← 新增
  roles?: string[];
  isSystem?: boolean;
  ignoreTriggers?: boolean;
}
```

---

## 二、Repository 层集成

### 2.1 自动注入 baseId 过滤

**文件**: `packages/core/src/repository.ts`

在 Repository 的查询方法中自动注入 `baseId` 过滤：

```typescript
export class ObjectRepository {
  private ctx: ObjectQLContext;
  private driver: Driver;
  private entityName: string;
  private objectConfig: ObjectConfig;

  async find(query: Partial<UnifiedQuery>): Promise<any[]> {
    // Auto-inject baseId filter if context has baseId
    const enhancedQuery = this.injectBaseFilter(query);
    
    // Execute the query
    return this.driver.find(this.entityName, enhancedQuery, this.ctx);
  }

  async findOne(query: Partial<UnifiedQuery>): Promise<any | null> {
    const enhancedQuery = this.injectBaseFilter(query);
    return this.driver.findOne(this.entityName, enhancedQuery, this.ctx);
  }

  async insert(doc: any): Promise<any> {
    // Auto-inject baseId if context has it and object supports it
    const enhancedDoc = this.injectBaseId(doc);
    return this.driver.insert(this.entityName, enhancedDoc, this.ctx);
  }

  async update(id: string, doc: any): Promise<any> {
    // Ensure update is within the same base
    const filter: FilterCriterion = ['_id', '=', id];
    const enhancedQuery = this.injectBaseFilter({ filters: [filter] });
    
    return this.driver.update(
      this.entityName,
      enhancedQuery.filters,
      doc,
      this.ctx
    );
  }

  async delete(id: string): Promise<boolean> {
    const filter: FilterCriterion = ['_id', '=', id];
    const enhancedQuery = this.injectBaseFilter({ filters: [filter] });
    
    return this.driver.delete(
      this.entityName,
      enhancedQuery.filters,
      this.ctx
    );
  }

  /**
   * Inject baseId filter into the query if:
   * 1. Context has a baseId
   * 2. Object has baseId field
   * 3. Not in system mode (isSystem = true)
   * 4. Not a Base-related object (to avoid recursion)
   */
  private injectBaseFilter(query: Partial<UnifiedQuery>): UnifiedQuery {
    // Skip if system mode or no baseId in context
    if (this.ctx.isSystem || !this.ctx.baseId) {
      return query as UnifiedQuery;
    }

    // Skip Base-related objects to avoid recursion
    const baseRelatedObjects = ['base', 'base_member'];
    if (baseRelatedObjects.includes(this.entityName)) {
      return query as UnifiedQuery;
    }

    // Skip if object doesn't have baseId field
    if (!this.objectConfig.fields?.baseId) {
      return query as UnifiedQuery;
    }

    // Build the baseId filter
    const baseFilter: FilterCriterion = ['baseId', '=', this.ctx.baseId];

    // If no existing filters, just add baseId filter
    if (!query.filters || query.filters.length === 0) {
      return {
        ...query,
        filters: [baseFilter],
      } as UnifiedQuery;
    }

    // Wrap existing filters with AND baseId
    return {
      ...query,
      filters: [
        '(',
        ...query.filters,
        ')',
        'and',
        baseFilter,
      ],
    } as UnifiedQuery;
  }

  /**
   * Inject baseId into document on insert
   */
  private injectBaseId(doc: any): any {
    if (!this.ctx.baseId || !this.objectConfig.fields?.baseId) {
      return doc;
    }

    // Don't override if already set (allows explicit base assignment in system mode)
    if (doc.baseId) {
      return doc;
    }

    return {
      ...doc,
      baseId: this.ctx.baseId,
    };
  }
}
```

---

## 三、API 端点设计

### 3.1 Base CRUD API

**文件**: `packages/api/src/routes/base.ts`

```typescript
import { Router } from 'express';
import { ObjectQL } from '@objectql/core';

export function createBaseRouter(objectql: ObjectQL) {
  const router = Router();

  /**
   * POST /api/base/create
   * Create a new base
   */
  router.post('/create', async (req, res) => {
    try {
      const { name, slug, organizationId, ...rest } = req.body;
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Create context with sudo to create base
      const ctx = objectql.getContext({ 
        userId, 
        spaceId: organizationId,
        isSystem: true 
      });

      // Check if user has permission to create base in this org
      // (This should check organization membership)
      const member = await ctx.object('member').findOne({
        filters: [
          ['organizationId', '=', organizationId],
          'and',
          ['userId', '=', userId]
        ]
      });

      if (!member) {
        return res.status(403).json({ error: 'Not a member of this organization' });
      }

      // Create the base
      const base = await ctx.object('base').insert({
        name,
        slug,
        organizationId,
        createdBy: userId,
        ...rest
      });

      // Add creator as owner
      await ctx.object('base_member').insert({
        baseId: base._id,
        userId,
        role: 'owner',
        joinedAt: new Date()
      });

      res.json(base);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/base/list
   * List bases for the current user
   */
  router.get('/list', async (req, res) => {
    try {
      const userId = req.session?.userId;
      const { organizationId } = req.query;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const ctx = objectql.getContext({ userId, isSystem: true });

      // Get bases where user is a member
      const memberships = await ctx.object('base_member').find({
        filters: [['userId', '=', userId]],
        fields: ['baseId', 'role']
      });

      const baseIds = memberships.map(m => m.baseId);

      if (baseIds.length === 0) {
        return res.json([]);
      }

      // Get base details
      const filters: any[] = [['_id', 'in', baseIds]];
      
      if (organizationId) {
        filters.push('and', ['organizationId', '=', organizationId]);
      }

      // Exclude archived by default
      filters.push('and', ['isArchived', '!=', true]);

      const bases = await ctx.object('base').find({
        filters,
        sort: [['updatedAt', 'desc']]
      });

      // Attach user's role to each base
      const basesWithRole = bases.map(base => ({
        ...base,
        userRole: memberships.find(m => m.baseId === base._id)?.role
      }));

      res.json(basesWithRole);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/base/:id
   * Get base details
   */
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const ctx = objectql.getContext({ userId, isSystem: true });

      // Check access
      const membership = await ctx.object('base_member').findOne({
        filters: [
          ['baseId', '=', id],
          'and',
          ['userId', '=', userId]
        ]
      });

      if (!membership) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const base = await ctx.object('base').findOne({
        filters: [['_id', '=', id]]
      });

      if (!base) {
        return res.status(404).json({ error: 'Base not found' });
      }

      res.json({
        ...base,
        userRole: membership.role
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * PATCH /api/base/:id
   * Update base
   */
  router.patch('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session?.userId;
      const updates = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const ctx = objectql.getContext({ userId, isSystem: true });

      // Check if user is owner or editor
      const membership = await ctx.object('base_member').findOne({
        filters: [
          ['baseId', '=', id],
          'and',
          ['userId', '=', userId]
        ]
      });

      if (!membership || !['owner', 'editor'].includes(membership.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Prevent changing organizationId and createdBy
      delete updates.organizationId;
      delete updates.createdBy;

      const updated = await ctx.object('base').update(id, {
        ...updates,
        updatedAt: new Date()
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/base/:id
   * Delete base (soft delete - archive it)
   */
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const ctx = objectql.getContext({ userId, isSystem: true });

      // Only owner can delete
      const membership = await ctx.object('base_member').findOne({
        filters: [
          ['baseId', '=', id],
          'and',
          ['userId', '=', userId],
          'and',
          ['role', '=', 'owner']
        ]
      });

      if (!membership) {
        return res.status(403).json({ error: 'Only owners can delete bases' });
      }

      // Soft delete by archiving
      await ctx.object('base').update(id, {
        isArchived: true,
        updatedAt: new Date()
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
```

### 3.2 Base Members API

```typescript
/**
 * POST /api/base/:id/members/add
 * Add a member to the base
 */
router.post('/:id/members/add', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: newUserId, role = 'viewer' } = req.body;
    const currentUserId = req.session?.userId;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const ctx = objectql.getContext({ userId: currentUserId, isSystem: true });

    // Check if current user is owner or editor
    const membership = await ctx.object('base_member').findOne({
      filters: [
        ['baseId', '=', id],
        'and',
        ['userId', '=', currentUserId]
      ]
    });

    if (!membership || !['owner', 'editor'].includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Check if user already a member
    const existing = await ctx.object('base_member').findOne({
      filters: [
        ['baseId', '=', id],
        'and',
        ['userId', '=', newUserId]
      ]
    });

    if (existing) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    // Add member
    const newMember = await ctx.object('base_member').insert({
      baseId: id,
      userId: newUserId,
      role,
      invitedBy: currentUserId,
      invitedAt: new Date(),
      joinedAt: new Date()
    });

    res.json(newMember);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/base/:id/members
 * List base members
 */
router.get('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const ctx = objectql.getContext({ userId, isSystem: true });

    // Check access
    const membership = await ctx.object('base_member').findOne({
      filters: [
        ['baseId', '=', id],
        'and',
        ['userId', '=', userId]
      ]
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const members = await ctx.object('base_member').find({
      filters: [['baseId', '=', id]],
      sort: [['joinedAt', 'asc']]
    });

    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 四、UI 组件

### 4.1 Base Switcher Component

```tsx
// packages/ui/src/components/BaseSwitcher.tsx
import React, { useState, useEffect } from 'react';

interface Base {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  userRole?: string;
}

interface BaseSwitcherProps {
  organizationId: string;
  currentBaseId?: string;
  onBaseChange: (baseId: string) => void;
}

export function BaseSwitcher({ organizationId, currentBaseId, onBaseChange }: BaseSwitcherProps) {
  const [bases, setBases] = useState<Base[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBases();
  }, [organizationId]);

  const fetchBases = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/base/list?organizationId=${organizationId}`);
      const data = await response.json();
      setBases(data);
    } catch (error) {
      console.error('Failed to fetch bases:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentBase = bases.find(b => b._id === currentBaseId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors"
      >
        <i className={currentBase?.icon || 'ri-database-2-line'} />
        <span className="font-medium">{currentBase?.name || 'Select Base'}</span>
        <i className="ri-arrow-down-s-line text-stone-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-stone-200 py-2 z-50">
          {loading ? (
            <div className="px-4 py-3 text-stone-500">Loading...</div>
          ) : bases.length === 0 ? (
            <div className="px-4 py-3 text-stone-500">No bases found</div>
          ) : (
            bases.map(base => (
              <button
                key={base._id}
                onClick={() => {
                  onBaseChange(base._id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-stone-50 transition-colors ${
                  base._id === currentBaseId ? 'bg-stone-100' : ''
                }`}
              >
                <i className={base.icon || 'ri-database-2-line'} />
                <div className="flex-1 text-left">
                  <div className="font-medium">{base.name}</div>
                  <div className="text-xs text-stone-500">{base.userRole}</div>
                </div>
                {base._id === currentBaseId && (
                  <i className="ri-check-line text-blue-600" />
                )}
              </button>
            ))
          )}
          
          <div className="border-t border-stone-200 mt-2 pt-2">
            <button
              onClick={() => {
                // Navigate to create base page
                window.location.href = '/bases/create';
              }}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-stone-50 transition-colors text-blue-600"
            >
              <i className="ri-add-line" />
              <span>Create New Base</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 五、使用示例

### 5.1 在 Object 中使用 Base

```yaml
# tasks.object.yml
name: tasks
label: Tasks
description: Task tracking within a base
icon: ri-task-line

fields:
  # Auto-managed by ObjectQL
  baseId:
    type: text
    label: Base
    required: true
    index: true
    hidden: true  # Hide from UI, managed automatically
  
  title:
    type: text
    label: Title
    required: true
  
  status:
    type: select
    label: Status
    options:
      - todo
      - in_progress
      - done
```

### 5.2 查询 Base 数据

```typescript
// User selects a base
const baseId = 'base_abc123';

// Create context with baseId
const ctx = objectql.getContext({
  userId: currentUser.id,
  spaceId: organization.id,
  baseId: baseId  // ← Sets the base context
});

// All queries automatically filtered by baseId
const tasks = await ctx.object('tasks').find({
  filters: [['status', '=', 'in_progress']]
});
// Returns only tasks in base_abc123

// Insert automatically includes baseId
const newTask = await ctx.object('tasks').insert({
  title: 'New task',
  status: 'todo'
  // baseId is auto-injected
});
```

### 5.3 跨 Base 查询 (System Mode)

```typescript
// System context can query across bases
const systemCtx = objectql.getContext({
  userId: currentUser.id,
  isSystem: true  // ← Bypasses baseId filtering
});

// Get all tasks across all bases
const allTasks = await systemCtx.object('tasks').find({});

// Or query specific bases
const tasksInMultipleBases = await systemCtx.object('tasks').find({
  filters: [['baseId', 'in', ['base_1', 'base_2']]]
});
```

---

## 六、迁移指南

### 6.1 向后兼容

现有项目无需任何更改：
- `baseId` 是可选字段
- 没有 `baseId` 的 Objects 继续正常工作
- Context 不设置 `baseId` 时，查询不受影响

### 6.2 迁移到 Base

如果要将现有数据迁移到 Base：

```typescript
// 1. Create a default base for the organization
const ctx = objectql.getContext({ isSystem: true });

const defaultBase = await ctx.object('base').insert({
  name: 'Default Base',
  slug: 'default',
  organizationId: orgId,
  createdBy: adminUserId
});

// 2. Update existing objects to belong to this base
await ctx.object('tasks').updateMany(
  { baseId: null },  // Find records without baseId
  { baseId: defaultBase._id }  // Set to default base
);

// 3. Add existing org members as base members
const orgMembers = await ctx.object('member').find({
  filters: [['organizationId', '=', orgId]]
});

for (const member of orgMembers) {
  await ctx.object('base_member').insert({
    baseId: defaultBase._id,
    userId: member.userId,
    role: member.role === 'owner' ? 'owner' : 'editor'
  });
}
```

---

## 七、测试

### 7.1 单元测试

```typescript
describe('Base Layer', () => {
  let objectql: ObjectQL;
  let ctx: ObjectQLContext;

  beforeAll(async () => {
    // Setup test database
    objectql = new ObjectQL({
      datasources: {
        default: new MongoDriver({ url: process.env.TEST_MONGO_URL })
      }
    });
    await objectql.init();
  });

  test('should create base', async () => {
    const systemCtx = objectql.getContext({ isSystem: true });
    
    const base = await systemCtx.object('base').insert({
      name: 'Test Base',
      slug: 'test-base',
      organizationId: 'org_123'
    });

    expect(base).toBeDefined();
    expect(base.name).toBe('Test Base');
  });

  test('should filter by baseId', async () => {
    const systemCtx = objectql.getContext({ isSystem: true });
    
    // Create base
    const base = await systemCtx.object('base').insert({
      name: 'Base 1',
      slug: 'base-1',
      organizationId: 'org_123'
    });

    // Create tasks in base
    const baseCtx = objectql.getContext({ baseId: base._id });
    
    await baseCtx.object('tasks').insert({ title: 'Task 1' });
    await baseCtx.object('tasks').insert({ title: 'Task 2' });

    // Query should only return tasks in this base
    const tasks = await baseCtx.object('tasks').find({});
    expect(tasks).toHaveLength(2);
  });

  test('should isolate between bases', async () => {
    const systemCtx = objectql.getContext({ isSystem: true });
    
    const base1 = await systemCtx.object('base').insert({
      name: 'Base 1',
      slug: 'base-1',
      organizationId: 'org_123'
    });

    const base2 = await systemCtx.object('base').insert({
      name: 'Base 2',
      slug: 'base-2',
      organizationId: 'org_123'
    });

    const ctx1 = objectql.getContext({ baseId: base1._id });
    const ctx2 = objectql.getContext({ baseId: base2._id });

    await ctx1.object('tasks').insert({ title: 'Task in Base 1' });
    await ctx2.object('tasks').insert({ title: 'Task in Base 2' });

    const tasks1 = await ctx1.object('tasks').find({});
    const tasks2 = await ctx2.object('tasks').find({});

    expect(tasks1).toHaveLength(1);
    expect(tasks2).toHaveLength(1);
    expect(tasks1[0].title).toBe('Task in Base 1');
    expect(tasks2[0].title).toBe('Task in Base 2');
  });
});
```

---

## 八、最佳实践

### 8.1 Base 命名规范

- **Descriptive Names**: 使用描述性名称 (e.g., "2024 Product Roadmap")
- **Consistent Slugs**: Slug 使用小写和连字符 (e.g., "2024-product-roadmap")
- **Meaningful Icons**: 选择与内容相关的图标

### 8.2 权限管理

- **最小权限原则**: 默认给予 viewer 权限
- **Owner 数量**: 每个 Base 至少 2 个 owner（防止单点故障）
- **定期审计**: 定期检查 Base 成员列表

### 8.3 性能优化

- **索引**: 在 `baseId` 字段上创建索引
- **缓存**: 缓存 Base 元数据（名称、图标等）
- **批量操作**: 使用批量 API 而非循环单条插入

---

## 九、常见问题 (FAQ)

### Q1: Base 和 App 有什么区别？

**A**: 
- **Base**: 数据层的逻辑容器，Objects 属于 Base
- **App**: 界面层的组织结构，提供导航和页面
- **关系**: 一个 Base 可以有多个 Apps（不同的界面视图）

### Q2: 现有项目是否必须使用 Base？

**A**: 不需要。Base 是可选功能，现有项目可以继续运行而无需任何更改。

### Q3: 如何在不同 Base 之间共享数据？

**A**: 
- **方案 1**: 使用 system context 进行跨 Base 查询
- **方案 2**: 创建全局 Objects（不设置 baseId 字段）
- **方案 3**: 使用 API 同步数据

### Q4: Base 删除后数据会怎样？

**A**: Base 删除是软删除（归档），数据不会丢失。可以通过设置 `isArchived: false` 恢复。

---

**文档版本**: 1.0  
**最后更新**: 2026-01-09
