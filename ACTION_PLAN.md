# ObjectOS 即时行动计划 (Immediate Action Plan)

> **创建日期**: 2026-01-12  
> **时间范围**: 未来 2 周 (Week 1-2)  
> **目标**: 快速启动开发，建立稳固基础

---

## 🎯 本周目标 (Week 1: Jan 12-18)

### 核心原则
1. **先建立基础设施** - CI/CD 和测试环境优先
2. **并行开发** - 不同团队可以同时工作
3. **快速迭代** - 小步快跑，频繁集成
4. **质量优先** - 每个功能都有测试

---

## 🚀 第 1 天 (Jan 12, 周日)

### 任务 1: CI/CD 流程建立 (DevOps)
**优先级**: 🔴 最高  
**预计时间**: 4 小时

```bash
# 步骤 1: 创建 GitHub Actions 工作流文件
mkdir -p .github/workflows
```

**需要创建的文件**:

1. `.github/workflows/ci.yml` - 持续集成
```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm run build
      - run: pnpm run test
      - uses: codecov/codecov-action@v3
```

2. `.github/workflows/lint.yml` - 代码检查
3. `.github/workflows/release.yml` - 发布流程

**验收标准**:
- [ ] PR 自动触发 CI
- [ ] 所有测试通过
- [ ] 构建成功

---

### 任务 2: 测试工具函数创建 (QA)
**优先级**: 🔴 最高  
**预计时间**: 3 小时

**创建文件**:

1. `packages/kernel/test/helpers/mock-driver.ts`
```typescript
// Note: Verify this import path matches your actual project structure
import type { ObjectQLDriver } from '@objectql/types';

export function createMockDriver(): jest.Mocked<ObjectQLDriver> {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((obj, data) => ({ 
      id: 'mock-id',
      ...data 
    })),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue(undefined),
    syncSchema: jest.fn().mockResolvedValue(undefined),
    buildQuery: jest.fn(),
  } as any;
}
```

2. `packages/kernel/test/helpers/test-data.ts`
```typescript
import { ObjectConfig } from '@objectql/types';

export const mockContactObject: ObjectConfig = {
  name: 'contacts',
  label: 'Contact',
  fields: {
    first_name: { type: 'text', required: true },
    last_name: { type: 'text', required: true },
    email: { type: 'email', unique: true },
  }
};

export function createTestObject(
  overrides?: Partial<ObjectConfig>
): ObjectConfig {
  return {
    ...mockContactObject,
    ...overrides,
  };
}
```

**验收标准**:
- [ ] Mock 函数易用
- [ ] 测试数据覆盖常见场景
- [ ] 有使用示例

---

### 任务 3: 钩子系统类型定义 (Backend)
**优先级**: 🟡 高  
**预计时间**: 2 小时

**创建文件**: `packages/kernel/src/hooks/types.ts`

```typescript
/**
 * 钩子生命周期类型
 */
export type HookType = 
  | 'beforeFind' 
  | 'afterFind'
  | 'beforeInsert'
  | 'afterInsert'
  | 'beforeUpdate'
  | 'afterUpdate'
  | 'beforeDelete'
  | 'afterDelete';

/**
 * 钩子上下文 - 包含钩子执行所需的所有信息
 */
export interface HookContext {
  /** 对象名称 */
  objectName: string;
  
  /** 当前用户（如果有） */
  user?: {
    id: string;
    roles: string[];
  };
  
  /** 操作数据（insert/update 时） */
  data?: Record<string, any>;
  
  /** 记录 ID（update/delete 时） */
  id?: string;
  
  /** 查询选项（find 时） */
  filters?: any;
  
  /** 查询结果（after 钩子） */
  result?: any;
  
  /** 元数据 */
  metadata?: Record<string, any>;
}

/**
 * 钩子函数类型
 */
export type HookFunction = (
  context: HookContext
) => Promise<void> | void;

/**
 * 钩子配置
 */
export interface HookConfig {
  /** 钩子类型 */
  type: HookType;
  
  /** 钩子函数 */
  handler: HookFunction;
  
  /** 优先级（数字越小越优先，默认 100） */
  priority?: number;
  
  /** 钩子名称（用于调试） */
  name?: string;
}
```

**验收标准**:
- [ ] 类型定义完整
- [ ] 有 JSDoc 注释
- [ ] 导出所有类型

---

## 📅 第 2-3 天 (Jan 13-14, 周一-周二)

### 任务 4: HookManager 实现 (Backend)
**优先级**: 🔴 最高  
**预计时间**: 6 小时

**创建文件**: `packages/kernel/src/hooks/manager.ts`

```typescript
import { HookType, HookFunction, HookConfig, HookContext } from './types';

/**
 * 钩子管理器
 * 负责注册、管理和执行钩子
 */
export class HookManager {
  private hooks: Map<HookType, HookConfig[]> = new Map();

  /**
   * 注册钩子
   */
  register(config: HookConfig): void {
    const { type, priority = 100 } = config;
    
    if (!this.hooks.has(type)) {
      this.hooks.set(type, []);
    }
    
    const hooks = this.hooks.get(type)!;
    hooks.push({ ...config, priority });
    
    // 按优先级排序
    hooks.sort((a, b) => (a.priority || 100) - (b.priority || 100));
  }

  /**
   * 执行钩子
   */
  async execute(type: HookType, context: HookContext): Promise<void> {
    const hooks = this.hooks.get(type) || [];
    
    for (const hook of hooks) {
      try {
        await hook.handler(context);
      } catch (error) {
        console.error(`Hook ${hook.name || 'unknown'} failed:`, error);
        throw error;
      }
    }
  }

  /**
   * 移除所有钩子（用于测试）
   */
  clear(): void {
    this.hooks.clear();
  }
}
```

**验收标准**:
- [ ] 支持钩子注册
- [ ] 支持优先级排序
- [ ] 支持异步执行
- [ ] 错误处理完善

---

### 任务 5: HookManager 测试 (Backend + QA)
**优先级**: 🔴 最高  
**预计时间**: 4 小时

**创建文件**: `packages/kernel/test/hooks/manager.test.ts`

```typescript
import { HookManager } from '../../src/hooks/manager';
import { HookContext } from '../../src/hooks/types';

describe('HookManager', () => {
  let manager: HookManager;

  beforeEach(() => {
    manager = new HookManager();
  });

  describe('register', () => {
    it('should register a hook', () => {
      const handler = jest.fn();
      manager.register({
        type: 'beforeInsert',
        handler,
      });

      // Note: Consider adding a public method like getHookCount() instead of accessing private members
      // For now, we can verify by executing the hook
      const context = { objectName: 'test' };
      manager.execute('beforeInsert', context);
      expect(handler).toHaveBeenCalled();
    });

    it('should sort hooks by priority', async () => {
      const order: number[] = [];

      manager.register({ type: 'beforeInsert', handler: async () => { order.push(200); }, priority: 200 });
      manager.register({ type: 'beforeInsert', handler: async () => { order.push(50); }, priority: 50 });
      manager.register({ type: 'beforeInsert', handler: async () => { order.push(100); }, priority: 100 });

      const context = { objectName: 'test' };
      await manager.execute('beforeInsert', context);
      
      // Verify hooks executed in priority order (lowest priority number first)
      expect(order).toEqual([50, 100, 200]);
    });
  });

  describe('execute', () => {
    it('should execute registered hooks', async () => {
      const handler = jest.fn();
      manager.register({
        type: 'beforeInsert',
        handler,
      });

      const context: HookContext = {
        objectName: 'contacts',
        data: { name: 'John' },
      };

      await manager.execute('beforeInsert', context);
      expect(handler).toHaveBeenCalledWith(context);
    });

    it('should execute hooks in priority order', async () => {
      const order: number[] = [];
      
      manager.register({
        type: 'beforeInsert',
        handler: async () => { order.push(1); },
        priority: 100,
      });
      
      manager.register({
        type: 'beforeInsert',
        handler: async () => { order.push(2); },
        priority: 50,
      });

      await manager.execute('beforeInsert', { objectName: 'test' });
      expect(order).toEqual([2, 1]);
    });

    it('should propagate errors', async () => {
      manager.register({
        type: 'beforeInsert',
        handler: async () => {
          throw new Error('Hook failed');
        },
      });

      await expect(
        manager.execute('beforeInsert', { objectName: 'test' })
      ).rejects.toThrow('Hook failed');
    });
  });
});
```

**验收标准**:
- [ ] 测试覆盖率 > 90%
- [ ] 所有测试通过
- [ ] 边界情况覆盖

---

### 任务 6: 集成钩子到 Kernel (Backend)
**优先级**: 🟡 高  
**预计时间**: 3 小时

**修改文件**: `packages/kernel/src/objectos.ts`

```typescript
import { HookManager } from './hooks/manager';
import { HookConfig, HookType, HookContext, HookFunction } from './hooks/types';

export class ObjectOS {
  private registry: Map<string, ObjectConfig> = new Map();
  private driver?: ObjectQLDriver;
  private hooks: HookManager = new HookManager();

  // ... 现有代码 ...

  /**
   * 注册钩子
   */
  on(type: HookType, handler: HookFunction, options?: { priority?: number; name?: string }): void {
    this.hooks.register({
      type,
      handler,
      priority: options?.priority,
      name: options?.name,
    });
  }

  /**
   * 查询记录（带钩子）
   */
  async find(objectName: string, options: FindOptions = {}): Promise<any[]> {
    const config = this.getObject(objectName);
    
    // beforeFind 钩子
    const context: HookContext = {
      objectName,
      filters: options.filters,
    };
    await this.hooks.execute('beforeFind', context);
    
    // 执行查询
    const result = await this.driver!.find(objectName, options);
    
    // afterFind 钩子
    context.result = result;
    await this.hooks.execute('afterFind', context);
    
    return context.result;
  }

  /**
   * 插入记录（带钩子）
   */
  async insert(objectName: string, data: any): Promise<any> {
    const config = this.getObject(objectName);
    
    // beforeInsert 钩子
    const context: HookContext = {
      objectName,
      data,
    };
    await this.hooks.execute('beforeInsert', context);
    
    // 执行插入
    const result = await this.driver!.insert(objectName, context.data);
    
    // afterInsert 钩子
    context.result = result;
    await this.hooks.execute('afterInsert', context);
    
    return context.result;
  }

  // TODO: 类似地实现 update 和 delete
}
```

**验收标准**:
- [ ] 所有 CRUD 操作集成钩子
- [ ] 钩子可以修改上下文
- [ ] 错误处理正确

---

## 📅 第 4-5 天 (Jan 15-16, 周三-周四)

### 任务 7: 集成测试 (Backend + QA)
**优先级**: 🟡 高  
**预计时间**: 4 小时

**创建文件**: `packages/kernel/test/integration/hooks.test.ts`

```typescript
import { ObjectOS } from '../../src/objectos';
import { createMockDriver } from '../helpers/mock-driver';
import { createTestObject } from '../helpers/test-data';

describe('Kernel with Hooks Integration', () => {
  let kernel: ObjectOS;
  let mockDriver: any;

  beforeEach(() => {
    kernel = new ObjectOS();
    mockDriver = createMockDriver();
    kernel.useDriver(mockDriver);
    kernel.load(createTestObject());
  });

  it('should execute beforeInsert hook and modify data', async () => {
    // 注册钩子：自动添加时间戳
    kernel.on('beforeInsert', (context) => {
      context.data!.created_at = new Date();
    });

    const data = { first_name: 'John', last_name: 'Doe' };
    await kernel.insert('contacts', data);

    expect(mockDriver.insert).toHaveBeenCalledWith(
      'contacts',
      expect.objectContaining({
        first_name: 'John',
        last_name: 'Doe',
        created_at: expect.any(Date),
      })
    );
  });

  it('should execute multiple hooks in priority order', async () => {
    const order: string[] = [];

    kernel.on('beforeInsert', () => {
      order.push('second');
    }, { priority: 100 });

    kernel.on('beforeInsert', () => {
      order.push('first');
    }, { priority: 50 });

    await kernel.insert('contacts', { first_name: 'John' });
    expect(order).toEqual(['first', 'second']);
  });

  it('should abort operation if hook throws error', async () => {
    kernel.on('beforeInsert', () => {
      throw new Error('Validation failed');
    });

    await expect(
      kernel.insert('contacts', { first_name: 'John' })
    ).rejects.toThrow('Validation failed');

    expect(mockDriver.insert).not.toHaveBeenCalled();
  });
});
```

**验收标准**:
- [ ] 集成测试通过
- [ ] 覆盖真实使用场景
- [ ] 与 mock driver 协作正常

---

### 任务 8: 文档编写 (Tech Writer)
**优先级**: 🟢 中  
**预计时间**: 3 小时

**创建文件**: `docs/guide/hooks.md`

```markdown
# 钩子系统 (Hooks)

## 概述

钩子允许您在对象的生命周期中执行自定义逻辑。

## 钩子类型

### beforeFind / afterFind
查询记录前后执行。

### beforeInsert / afterInsert
插入记录前后执行。

### beforeUpdate / afterUpdate
更新记录前后执行。

### beforeDelete / afterDelete
删除记录前后执行。

## 使用示例

### 自动添加时间戳

```typescript
kernel.on('beforeInsert', (context) => {
  context.data.created_at = new Date();
  context.data.created_by = context.user?.id;
});

kernel.on('beforeUpdate', (context) => {
  context.data.updated_at = new Date();
  context.data.updated_by = context.user?.id;
});
```

### 记录级安全

```typescript
kernel.on('beforeFind', (context) => {
  if (!context.user?.isAdmin) {
    // 只能看到自己创建的记录
    context.filters = {
      ...context.filters,
      owner: context.user.id
    };
  }
});
```

### 数据验证

```typescript
kernel.on('beforeInsert', (context) => {
  if (context.objectName === 'contacts') {
    const email = context.data.email;
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }
  }
});
```

## API 参考

### kernel.on()

注册钩子。

**参数**:
- `type`: 钩子类型
- `handler`: 钩子函数
- `options`: 可选配置
  - `priority`: 优先级（默认 100）
  - `name`: 钩子名称（用于调试）

**示例**:
```typescript
kernel.on('beforeInsert', async (context) => {
  // 您的逻辑
}, { priority: 50, name: 'timestamp-hook' });
```
```

**验收标准**:
- [ ] 文档清晰易懂
- [ ] 示例可运行
- [ ] 覆盖常见场景

---

## 📅 下周计划 (Week 2: Jan 19-25)

### 主要任务
1. **验证引擎启动** - 设计和原型
2. **Grid 组件优化** - 性能分析
3. **API 文档生成** - Swagger 配置
4. **性能基准测试** - 建立基线

### 里程碑
- [ ] 钩子系统完全可用
- [ ] CI/CD 流程稳定
- [ ] 测试覆盖率 > 60%
- [ ] API 文档 50% 完成

---

## ✅ 完成检查清单

### 每日检查
- [ ] 所有测试通过
- [ ] 代码已提交
- [ ] PR 已创建或更新
- [ ] 更新进度到 TASKS.md

### 每周检查
- [ ] 完成周目标
- [ ] 更新项目仪表板
- [ ] 团队回顾会议
- [ ] 计划下周任务

---

## 🎓 学习资源

### 钩子系统
- [AOP (面向切面编程) 介绍](https://en.wikipedia.org/wiki/Aspect-oriented_programming)
- [Middleware Pattern](https://www.patterns.dev/posts/middleware-pattern)

### 测试
- [Jest 官方文档](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Effective TypeScript](https://effectivetypescript.com/)

---

**维护**: 每日更新  
**负责人**: 项目经理
