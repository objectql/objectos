# ObjectOS 微内核快速参考指南

> 快速上手 ObjectOS 插件开发

---

## 🚀 快速开始

### 安装

```bash
pnpm add @objectstack/runtime
```

### 创建插件

```typescript
import { PluginManifest, PluginContext } from '@objectstack/runtime';

// 1. 定义清单
export const manifest: PluginManifest = {
  id: 'my-plugin',
  name: '我的插件',
  version: '1.0.0'
};

// 2. 实现插件
export class MyPlugin {
  async onLoad(ctx: PluginContext) {
    ctx.logger.info('插件已加载');
  }
}
```

### 启动运行时

```typescript
import { ObjectStackRuntime } from '@objectstack/runtime';

const runtime = new ObjectStackRuntime({
  plugins: [
    { id: 'my-plugin', name: '我的插件', version: '1.0.0' }
  ]
});

await runtime.start();
```

---

## 📦 核心概念

### 插件生命周期

```
安装 → 加载 → 启用 → (运行中) → 禁用 → 卸载
         ↓
       出错
```

### 生命周期钩子

| 钩子 | 触发时机 | 用途 |
|------|---------|------|
| `onInstall` | 首次安装 | 初始化数据库、创建默认配置 |
| `onLoad` | 加载清单 | 注册服务、订阅事件 |
| `onEnable` | 启用插件 | 启动后台任务、连接外部服务 |
| `onDisable` | 禁用插件 | 停止任务、断开连接 |
| `onUninstall` | 卸载插件 | 清理资源、删除数据 |

---

## 🔧 服务注册表

### 注册服务

```typescript
ctx.services.register('calculator', {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b
});
```

### 使用服务

```typescript
const calc = ctx.services.get('calculator');
const result = calc.add(5, 3); // 8
```

---

## 📡 事件总线

### 订阅事件

```typescript
ctx.events.on('user.created', async (data) => {
  console.log('新用户:', data.name);
});
```

### 发布事件

```typescript
ctx.events.emit('user.created', {
  id: '123',
  name: '张三',
  email: 'zhangsan@example.com'
});
```

---

## 💾 存储

### 基本操作

```typescript
// 保存
await ctx.storage.set('counter', 42);

// 读取
const counter = await ctx.storage.get('counter');

// 删除
await ctx.storage.delete('counter');

// 清空
await ctx.storage.clear();
```

---

## 📝 日志

```typescript
ctx.logger.debug('调试信息');
ctx.logger.info('一般信息');
ctx.logger.warn('警告信息');
ctx.logger.error('错误信息', error);
```

---

## 🔗 依赖管理

### 声明依赖

```typescript
export const manifest: PluginManifest = {
  id: 'my-plugin',
  name: '我的插件',
  version: '1.0.0',
  dependencies: {
    '@objectos/plugin-auth': '^1.0.0',
    '@objectos/plugin-database': '^1.0.0'
  }
};
```

### 检查依赖

```typescript
async onLoad(ctx: PluginContext) {
  const auth = ctx.services.get('auth');
  if (!auth) {
    throw new Error('需要认证服务');
  }
}
```

---

## 🎯 常用模式

### 注册服务并订阅事件

```typescript
export class MyPlugin {
  async onLoad(ctx: PluginContext) {
    // 注册服务
    ctx.services.register('my-service', {
      doSomething: () => 'done'
    });
    
    // 订阅事件
    ctx.events.on('user.created', async (data) => {
      await this.handleUserCreated(data);
    });
  }
}
```

### 使用配置

```typescript
export const manifest: PluginManifest = {
  id: 'my-plugin',
  // ...
  config: {
    apiKey: process.env.MY_PLUGIN_API_KEY || '',
    timeout: 5000
  }
};

async onLoad(ctx: PluginContext) {
  const apiKey = ctx.config.apiKey;
  if (!apiKey) {
    throw new Error('需要配置 API Key');
  }
}
```

### 缓存数据

```typescript
async function getCached<T>(
  ctx: PluginContext,
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // 检查缓存
  const cached = await ctx.storage.get<T>(key);
  if (cached) return cached;
  
  // 获取新数据
  const data = await fetcher();
  
  // 存入缓存
  await ctx.storage.set(key, data);
  
  return data;
}
```

---

## ⚠️ 最佳实践

### 1. 错误处理

```typescript
async onLoad(ctx: PluginContext) {
  try {
    await this.initialize();
  } catch (error) {
    ctx.logger.error('初始化失败', error as Error);
    throw error; // 重新抛出，标记插件为错误状态
  }
}
```

### 2. 优雅关闭

```typescript
async onDisable(ctx: PluginContext) {
  // 停止定时器
  if (this.intervalId) {
    clearInterval(this.intervalId);
  }
  
  // 关闭连接
  if (this.connection) {
    await this.connection.close();
  }
  
  ctx.logger.info('清理完成');
}
```

### 3. 类型安全

```typescript
interface MyService {
  doSomething(): string;
}

// 注册时指定类型
ctx.services.register<MyService>('my-service', {
  doSomething: () => 'done'
});

// 使用时指定类型
const service = ctx.services.get<MyService>('my-service');
```

---

## 📚 示例插件

### 简单插件

```typescript
import { PluginManifest, PluginContext } from '@objectstack/runtime';

export const manifest: PluginManifest = {
  id: 'hello-world',
  name: 'Hello World',
  version: '1.0.0'
};

export class HelloWorldPlugin {
  async onLoad(ctx: PluginContext) {
    ctx.logger.info('你好，世界！');
  }
}
```

### 带依赖的插件

```typescript
export const manifest: PluginManifest = {
  id: 'data-plugin',
  name: '数据插件',
  version: '1.0.0',
  dependencies: {
    '@objectos/plugin-auth': '^1.0.0'
  }
};

export class DataPlugin {
  async onLoad(ctx: PluginContext) {
    const auth = ctx.services.get('auth');
    
    ctx.services.register('data', {
      query: async (query) => {
        if (!auth.isAuthenticated()) {
          throw new Error('未认证');
        }
        return [];
      }
    });
  }
}
```

---

## 🧪 测试

```typescript
import { ObjectStackRuntime } from '@objectstack/runtime';
import { manifest, MyPlugin } from '../src';

describe('MyPlugin', () => {
  let runtime: ObjectStackRuntime;
  
  beforeEach(async () => {
    runtime = new ObjectStackRuntime({
      plugins: [manifest]
    });
    await runtime.start();
  });
  
  afterEach(async () => {
    await runtime.stop();
  });
  
  it('应该注册服务', () => {
    const service = runtime.services.get('my-service');
    expect(service).toBeDefined();
  });
});
```

---

## 🔍 调试

### 启用调试模式

```typescript
const runtime = new ObjectStackRuntime({
  mode: 'development',
  debug: true  // 启用详细日志
});
```

### 查看插件状态

```typescript
const plugin = runtime.getPlugin('my-plugin');
console.log(plugin?.state); // 'loaded', 'enabled', 'disabled', 'error'
```

---

## 📖 相关资源

- [完整开发指南](./PLUGIN_DEVELOPMENT_GUIDE.md)
- [架构文档](./ARCHITECTURE.md)
- [API 参考](./packages/runtime/README.md)
- [示例代码](./examples/)

---

## ❓ 常见问题

### Q: 如何在插件间通信？

A: 使用服务注册表或事件总线：

```typescript
// 方法1: 服务注册表
const otherService = ctx.services.get('other-service');

// 方法2: 事件总线
ctx.events.emit('my-event', { data: 'value' });
```

### Q: 如何持久化数据？

A: 使用插件存储：

```typescript
await ctx.storage.set('key', value);
const value = await ctx.storage.get('key');
```

### Q: 如何处理插件错误？

A: 在生命周期钩子中捕获并记录错误：

```typescript
async onLoad(ctx: PluginContext) {
  try {
    // 初始化逻辑
  } catch (error) {
    ctx.logger.error('加载失败', error as Error);
    throw error; // 让运行时知道插件失败
  }
}
```

---

*快速参考指南版本: 1.0.0*
