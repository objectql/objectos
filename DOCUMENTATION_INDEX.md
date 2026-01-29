# ObjectOS 文档索引

**最后更新**: 2026-01-29

---

## 📊 规范评估与开发计划

### 🆕 最新交付 (2026-01-29)

#### 中文文档
- **[执行总结 (中文)](./EVALUATION_EXECUTIVE_SUMMARY_CN.md)** - 完整的任务执行总结和关键发现
- **[快速参考指南](./SPECIFICATION_COMPLIANCE_SUMMARY.md)** - 一页纸概览，快速了解符合性状态

#### 英文文档
- **[ObjectStack Spec 评估报告](./OBJECTSTACK_SPEC_EVALUATION.md)** - 详细的协议符合性分析
- **[2026 Q1 开发计划](./DEVELOPMENT_PLAN_2026_Q1.md)** - 12周详细实施路线图

---

## 📖 核心文档

### 项目概述
- **[README](./README.md)** - 项目介绍、快速开始、特性说明
- **[架构设计](./ARCHITECTURE.md)** - 系统架构、设计原则、组件交互
- **[产品路线图](./ROADMAP.md)** - 长期战略愿景 (Q1-Q4 2026 及以后)

### 技术文档
- **[API 实现总结](./IMPLEMENTATION_SUMMARY.md)** - API 协议 Phases 1-4 实现详情
- **[API 实施计划](./API_PROTOCOL_IMPLEMENTATION_PLAN.md)** - API 协议原始实施计划
- **[内核重构总结](./KERNEL_REFACTORING_SUMMARY.md)** - 内核重构记录
- **[快速参考](./QUICK_REFERENCE.md)** - 开发者快速查询手册

### 贡献指南
- **[贡献指南](./CONTRIBUTING.md)** - 如何参与 ObjectOS 开发

---

## 📦 包文档

### @objectstack/runtime
- **[README](./packages/runtime/README.md)** - 微内核运行时说明
- **[实现指南](./packages/runtime/IMPLEMENTATION.md)** - 实现细节
- **[使用示例](./packages/runtime/USAGE_EXAMPLE.md)** - 代码示例

### @objectos/kernel
- **[README](./packages/kernel/README.md)** - 内核包说明
- **[内核指南](./packages/kernel/KERNEL_GUIDE.md)** - 内核使用指南
- **[变更日志](./packages/kernel/CHANGELOG.md)** - 版本历史

### @objectos/plugin-better-auth
- **[README](./packages/plugins/better-auth/README.md)** - 认证插件说明
- **[集成指南](./packages/plugins/better-auth/INTEGRATION.md)** - 集成步骤
- **[实现总结](./packages/plugins/better-auth/SUMMARY.md)** - 实现细节
- **[变更日志](./packages/plugins/better-auth/CHANGELOG.md)** - 版本历史

### @objectos/preset-base
- **[README](./packages/presets/base/README.md)** - 基础预设说明

---

## 📝 规范文档

### ObjectStack Protocol Specifications
位于 `docs/spec/` 目录:

- **[规范索引](./docs/spec/index.md)** - 协议规范概述
- **[元数据格式](./docs/spec/metadata-format.md)** - YAML 对象定义规范
- **[查询语言](./docs/spec/query-language.md)** - 过滤和查询语法
- **[HTTP 协议](./docs/spec/http-protocol.md)** - REST API 端点规范

---

## 🎯 按任务类型查找

### 我想了解 ObjectOS 是什么
1. 阅读 [README](./README.md)
2. 查看 [架构设计](./ARCHITECTURE.md)
3. 浏览 [产品路线图](./ROADMAP.md)

### 我想评估 ObjectOS 的完成度
1. 阅读 **[执行总结 (中文)](./EVALUATION_EXECUTIVE_SUMMARY_CN.md)** ⭐
2. 查看 **[快速参考](./SPECIFICATION_COMPLIANCE_SUMMARY.md)**
3. 深入了解 **[完整评估报告](./OBJECTSTACK_SPEC_EVALUATION.md)**

### 我想参与开发
1. 阅读 **[2026 Q1 开发计划](./DEVELOPMENT_PLAN_2026_Q1.md)** ⭐
2. 查看 [贡献指南](./CONTRIBUTING.md)
3. 浏览 [快速参考](./QUICK_REFERENCE.md)

### 我想使用 ObjectOS
1. 查看 [README 快速开始](./README.md#getting-started)
2. 阅读包文档 (runtime, kernel, 插件)
3. 参考 [使用示例](./packages/runtime/USAGE_EXAMPLE.md)

### 我想了解技术细节
1. 阅读 [架构设计](./ARCHITECTURE.md)
2. 查看 [API 实现总结](./IMPLEMENTATION_SUMMARY.md)
3. 浏览协议规范文档

---

## 🔍 按主题查找

### 插件系统
- [架构设计 - 插件架构](./ARCHITECTURE.md#layer-5-extension-points)
- [Runtime 包文档](./packages/runtime/README.md)
- [Kernel 指南](./packages/kernel/KERNEL_GUIDE.md)

### 权限和安全
- [评估报告 - Data Protocol](./OBJECTSTACK_SPEC_EVALUATION.md#data-protocol-评估)
- [开发计划 - Week 1-2](./DEVELOPMENT_PLAN_2026_Q1.md#week-1-2-权限系统基础)
- [Better-Auth 插件](./packages/plugins/better-auth/README.md)

### API 和端点
- [API 实现总结](./IMPLEMENTATION_SUMMARY.md)
- [HTTP 协议规范](./docs/spec/http-protocol.md)
- [开发计划 - Week 7-8](./DEVELOPMENT_PLAN_2026_Q1.md#week-7-8-nestjs-服务器完善)

### 数据模型和查询
- [元数据格式规范](./docs/spec/metadata-format.md)
- [查询语言规范](./docs/spec/query-language.md)
- [开发计划 - Week 5-6](./DEVELOPMENT_PLAN_2026_Q1.md#week-5-6-关系支持)

### 审计和日志
- [评估报告 - System Protocol](./OBJECTSTACK_SPEC_EVALUATION.md#system-protocol-评估)
- [开发计划 - Week 3-4](./DEVELOPMENT_PLAN_2026_Q1.md#week-3-4-审计日志系统)

---

## 📊 状态仪表板

### 当前版本: v0.2.0

| 组件 | 版本 | 状态 | 符合性 |
|------|------|------|--------|
| @objectstack/runtime | 0.1.0 | ✅ 稳定 | 85% |
| @objectos/kernel | 0.2.0 | 🚧 开发中 | 60% |
| @objectos/server | 0.2.0 | 🚧 开发中 | 50% |
| @objectos/plugin-better-auth | 0.1.0 | ✅ 稳定 | 80% |
| @objectos/preset-base | 0.1.0 | ✅ 稳定 | 70% |

### 总体符合性: 58%

### 下一个版本: v0.5.0 (2026年3月)

---

## 🔗 外部资源

### ObjectStack 生态系统
- **[@objectstack/spec](https://github.com/objectstack-ai/spec)** - 协议定义仓库
- **[ObjectQL](https://github.com/objectql/objectql)** - 数据层实现
- **[ObjectUI](https://github.com/objectql/objectui)** - UI 层实现

### 技术栈
- **[NestJS](https://docs.nestjs.com/)** - 服务器框架
- **[TypeScript](https://www.typescriptlang.org/)** - 编程语言
- **[Better-Auth](https://www.better-auth.com/)** - 认证库

---

## 📞 获取帮助

### 社区
- GitHub Issues: https://github.com/objectstack-ai/objectos/issues
- Discord: https://discord.gg/objectos (即将推出)

### 文档问题
如发现文档问题，请：
1. 在 GitHub 开 Issue
2. 提交 PR 修正
3. 标记 `documentation` 标签

---

**维护者**: ObjectOS 核心团队  
**许可证**: AGPL-3.0  
**最后更新**: 2026-01-29
