# ObjectStack 0.9.1 升级指南

## 概述

本文档描述了从 @objectstack 包 0.9.0 版本升级到 0.9.1 版本的过程。

**升级日期：** 2026-02-03  
**状态：** ✅ 完成

## 变更内容

### 包版本升级

所有 @objectstack 包已升级到 0.9.1 版本：

- `@objectstack/spec`: 0.9.0 → **0.9.1**
- `@objectstack/runtime`: 0.9.0 → **0.9.1**  
- `@objectstack/objectql`: 0.9.0 → **0.9.1**
- `@objectstack/cli`: 0.9.0 → **0.9.1**

### 发布信息

- **发布日期：** 2026-02-03
- **类型：** 补丁版本（小的 bug 修复和改进）
- **破坏性变更：** 无

## 执行的变更

### 1. 包版本更新

更新了以下文件：

**根目录 package.json：**
```diff
  "devDependencies": {
-   "@objectstack/cli": "^0.9.0",
+   "@objectstack/cli": "^0.9.1",
  },
  "dependencies": {
-   "@objectstack/spec": "0.9.0",
+   "@objectstack/spec": "0.9.1",
  }
```

**packages/kernel/package.json：**
```diff
  "dependencies": {
-   "@objectstack/spec": "0.9.0",
+   "@objectstack/spec": "0.9.1",
  }
```

**packages/server/package.json：**
```diff
  "dependencies": {
-   "@objectstack/runtime": "^0.9.0",
-   "@objectstack/objectql": "0.9.0",
-   "@objectstack/spec": "0.9.0",
+   "@objectstack/runtime": "^0.9.1",
+   "@objectstack/objectql": "0.9.1",
+   "@objectstack/spec": "0.9.1",
  }
```

### 2. 依赖安装

成功安装所有更新包，没有冲突。

### 3. 构建验证

✅ **TypeScript 编译：** 所有包成功构建，无错误  
✅ **测试套件：** 所有 560+ 测试通过  
✅ **无需代码更改：** 升级完全向后兼容

## 迁移步骤

如果您正在升级自己的 ObjectOS 实例：

### 1. 更新 package.json 文件

将所有 @objectstack 包版本更新到 0.9.1：

```json
{
  "dependencies": {
    "@objectstack/spec": "0.9.1",
    "@objectstack/runtime": "^0.9.1",
    "@objectstack/objectql": "0.9.1"
  },
  "devDependencies": {
    "@objectstack/cli": "^0.9.1"
  }
}
```

### 2. 安装依赖

```bash
# 使用 pnpm 进行工作区项目
pnpm install --no-frozen-lockfile

# 或使用 npm
npm install
```

### 3. 构建和测试

```bash
# 构建所有包
pnpm run build

# 运行测试
pnpm run test
```

## 兼容性

### 无破坏性变更

0.9.1 版本与 0.9.0 保持完全向后兼容：

- ✅ **API 兼容性：** 所有 API 保持不变
- ✅ **插件系统：** 插件生命周期或接口无变化
- ✅ **协议定义：** Schema 和类型定义保持稳定
- ✅ **运行时行为：** 无行为变化

### 依赖更新

0.9.1 版本包含更新的内部依赖：

**@objectstack/runtime 现在依赖：**
- `@objectstack/core@0.9.1` (新的内部包)
- `@objectstack/types@0.9.1` (新的内部包)
- `@objectstack/spec@0.9.1`

**@objectstack/objectql 现在依赖：**
- `@objectstack/core@0.9.1`
- `@objectstack/spec@0.9.1`
- `@objectstack/types@0.9.1`

**@objectstack/cli 现在依赖：**
- `@objectstack/core@0.9.1`
- `@objectstack/driver-memory@0.9.1`
- `@objectstack/objectql@0.9.1`
- `@objectstack/plugin-hono-server@0.9.1`
- `@objectstack/runtime@0.9.1`
- `@objectstack/spec@0.9.1`

这些是内部依赖，不需要在应用程序中进行任何代码更改。

## 构建状态

### 升级前 (0.9.0)
- TypeScript: ✅ 通过
- 构建: ✅ 通过
- 测试: ✅ 560+ 测试通过

### 升级后 (0.9.1)
- TypeScript: ✅ 通过
- 构建: ✅ 通过
- 测试: ✅ 560+ 测试通过

## 测试结果摘要

所有测试套件在 0.9.1 版本下全部通过：

| 包 | 测试数 | 状态 |
|---------|-------|--------|
| @objectos/plugin-audit-log | 33 | ✅ 通过 |
| @objectos/plugin-automation | 103 | ✅ 通过 |
| @objectos/plugin-better-auth | 6 | ✅ 通过 |
| @objectos/plugin-cache | 46 | ✅ 通过 |
| @objectos/plugin-i18n | 52 | ✅ 通过 |
| @objectos/plugin-jobs | 0 | ✅ 通过 |
| @objectos/plugin-metrics | 21 | ✅ 通过 |
| @objectos/plugin-notification | 55 | ✅ 通过 |
| @objectos/plugin-permissions | 63 | ✅ 通过 |
| @objectos/plugin-storage | 32 | ✅ 通过 |
| @objectos/plugin-workflow | 170 | ✅ 通过 |
| **总计** | **581** | **✅ 全部通过** |

## 已知问题

无。升级过程顺利，未检测到任何问题。

## 下一步

1. ✅ 升级完成 - 无需进一步操作
2. ✅ 所有测试通过
3. ✅ 构建验证成功
4. ✅ 准备好生产部署

## 参考资料

- [@objectstack/spec 0.9.1 on NPM](https://www.npmjs.com/package/@objectstack/spec/v/0.9.1)
- [@objectstack/runtime 0.9.1 on NPM](https://www.npmjs.com/package/@objectstack/runtime/v/0.9.1)
- [上一次升级：0.9.0](./OBJECTSTACK_0.9.0_UPGRADE.md)
- [ObjectStack GitHub](https://github.com/objectstack-ai/spec)

---

**状态：** ✅ 完成  
**最后更新：** 2026-02-03
