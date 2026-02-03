# ObjectOS 文档索引 | ObjectOS Documentation Index

> **最后更新 Last Updated**: 2026年2月3日 | February 3, 2026

欢迎来到 ObjectOS 文档中心！本文档体系提供了完整的开发、部署和运维指南。

Welcome to the ObjectOS Documentation Center! This documentation system provides complete development, deployment, and operations guides.

---

## 📚 文档导航 | Documentation Navigation

### 🎯 核心文档 | Core Documentation

#### 1. 总体规划 | Master Planning

**[ObjectOS 开发总体方案](./OBJECTOS_DEVELOPMENT_MASTER_PLAN.md)** 📋 **[推荐阅读]**
- **中文/English**: 完整的开发计划和时间线
- **包含**: 22周详细实施路线图
- **适合**: 项目经理、架构师、全栈开发者

**主要内容**:
- ✅ 项目愿景与产品定位
- ✅ 微内核架构设计
- ✅ 六个开发阶段详细规划
- ✅ 质量保证策略
- ✅ 部署架构设计

---

#### 2. 架构设计 | Architecture Design

**[ObjectOS 架构设计文档](./OBJECTOS_ARCHITECTURE_DESIGN.md)** 🏗️ **[技术必读]**
- **中文/English**: 深度技术架构解析
- **包含**: 系统架构图、数据流设计、安全架构
- **适合**: 系统架构师、后端开发者

**主要内容**:
- ✅ 整体架构总览 (四层架构)
- ✅ 微内核设计原理
- ✅ 插件系统架构
- ✅ 数据流与事件驱动
- ✅ 安全架构 (认证/授权/审计)
- ✅ 性能优化策略 (缓存/查询/连接池)

---

#### 3. 插件系统 | Plugin System

**[ObjectOS 插件系统规范](./OBJECTOS_PLUGIN_SPECIFICATION.md)** 🔌 **[开发必读]**
- **中文/English**: 完整的插件开发指南
- **包含**: 插件清单、生命周期、最佳实践
- **适合**: 插件开发者、扩展开发者

**主要内容**:
- ✅ 插件系统概述 (设计原则)
- ✅ 插件开发指南 (从0到1)
- ✅ 标准插件清单 (核心/系统/扩展)
- ✅ 插件最佳实践 (版本管理/错误处理/安全)
- ✅ 插件开发检查清单

**标准插件目录**:
- **核心插件**: plugin-objectql, plugin-server
- **系统插件**: plugin-better-auth, plugin-audit-log, plugin-workflow
- **扩展插件**: plugin-notification, plugin-storage, plugin-jobs, plugin-cache

---

#### 4. 集成指南 | Integration Guide

**[ObjectOS 集成指南](./OBJECTOS_INTEGRATION_GUIDE.md)** 🔗 **[集成必读]**
- **中文/English**: ObjectQL和ObjectUI集成方案
- **包含**: 数据层、视图层、全栈集成
- **适合**: 全栈开发者、集成工程师

**主要内容**:
- ✅ ObjectQL集成 (数据层)
  - 安装与配置
  - 元数据定义示例
  - ObjectOS增强功能
- ✅ ObjectUI集成 (视图层)
  - 元数据API设计
  - React组件使用
  - 实时同步 (WebSocket)
- ✅ 完整技术栈集成
  - 开发环境搭建
  - 前后端配置
- ✅ 常见集成场景
  - CRM系统
  - 审批流程
  - 多租户SaaS

---

#### 5. 部署运维 | Deployment & Operations

**[ObjectOS 部署运维指南](./OBJECTOS_DEPLOYMENT_GUIDE.md)** 🚀 **[运维必读]**
- **中文/English**: 生产环境部署与运维
- **包含**: Docker、Kubernetes、云平台部署
- **适合**: DevOps工程师、系统管理员

**主要内容**:
- ✅ 部署架构演进 (单机→负载均衡→云原生)
- ✅ 生产环境部署
  - PM2进程管理
  - NGINX反向代理
  - SSL证书配置
- ✅ 容器化部署
  - Dockerfile
  - docker-compose
- ✅ Kubernetes部署
  - Deployment/Service/HPA
- ✅ 云平台部署 (AWS ECS/RDS)
- ✅ 运维管理
  - 日志管理 (ELK Stack)
  - 监控指标 (Prometheus/Grafana)
  - 备份策略
  - 安全加固

---

### 📖 原有文档 | Existing Documentation

#### 协议与标准 | Protocols & Standards

| 文档 | 描述 | 语言 |
|-----|------|------|
| [SPEC_SYSTEM_DEVELOPMENT_PLAN.md](./SPEC_SYSTEM_DEVELOPMENT_PLAN.md) | @objectstack/spec 协议实施计划 | EN |
| [SPEC_SYSTEM_INDEX.md](./SPEC_SYSTEM_INDEX.md) | Spec 系统文档索引 | EN |
| [SPEC_SYSTEM_QUICK_REFERENCE.md](./SPEC_SYSTEM_QUICK_REFERENCE.md) | Spec 快速参考 | EN |

#### 架构与迁移 | Architecture & Migration

| 文档 | 描述 | 语言 |
|-----|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 架构文档 (原版) | EN |
| [ARCHITECTURE_COMPARISON.md](./ARCHITECTURE_COMPARISON.md) | Kernel vs Runtime 对比 | EN |
| [MICROKERNEL_MIGRATION_SUMMARY.md](./MICROKERNEL_MIGRATION_SUMMARY.md) | 微内核迁移总结 | EN |
| [KERNEL_REFACTORING_SUMMARY.md](./KERNEL_REFACTORING_SUMMARY.md) | Kernel 重构总结 | EN |

#### 实施进度 | Implementation Progress

| 文档 | 描述 | 语言 |
|-----|------|------|
| [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) | 实施路线图 | 中英双语 |
| [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) | 实施状态 | EN |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | 实施总结 | EN |
| [PHASE_3_IMPLEMENTATION_SUMMARY.md](./PHASE_3_IMPLEMENTATION_SUMMARY.md) | 阶段3总结 | EN |

#### 升级指南 | Upgrade Guides

| 文档 | 版本 | 语言 |
|-----|------|------|
| [OBJECTSTACK_0.9.1_UPGRADE_CN.md](./OBJECTSTACK_0.9.1_UPGRADE_CN.md) | 0.9.1 | 中文 |
| [OBJECTSTACK_0.9.1_UPGRADE.md](./OBJECTSTACK_0.9.1_UPGRADE.md) | 0.9.1 | EN |
| [OBJECTSTACK_0.9.0_UPGRADE.md](./OBJECTSTACK_0.9.0_UPGRADE.md) | 0.9.0 | EN |
| [OBJECTSTACK_0.8.0_UPGRADE.md](./OBJECTSTACK_0.8.0_UPGRADE.md) | 0.8.0 | EN |

#### 集成计划 | Integration Plans

| 文档 | 描述 | 语言 |
|-----|------|------|
| [BETTER_AUTH_INTEGRATION_PLAN.md](./BETTER_AUTH_INTEGRATION_PLAN.md) | Better-Auth 集成计划 | EN |
| [API_PROTOCOL_IMPLEMENTATION_PLAN.md](./API_PROTOCOL_IMPLEMENTATION_PLAN.md) | API协议实施计划 | EN |
| [SYSTEM_PLUGINS_INTEGRATION_GUIDE.md](./SYSTEM_PLUGINS_INTEGRATION_GUIDE.md) | 系统插件集成指南 | EN |

#### 其他文档 | Other Documentation

| 文档 | 描述 | 语言 |
|-----|------|------|
| [ROADMAP.md](./ROADMAP.md) | 发展路线图 | EN |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 贡献指南 | EN |
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | 快速参考 | EN |

---

## 🎓 学习路径 | Learning Path

### 新手入门 | For Beginners

1. 📖 阅读 [README.md](./README.md) - 了解项目概况
2. 📋 阅读 [开发总体方案](./OBJECTOS_DEVELOPMENT_MASTER_PLAN.md) - 理解项目愿景
3. 🏗️ 阅读 [架构设计文档](./OBJECTOS_ARCHITECTURE_DESIGN.md) - 掌握核心架构
4. ⚡ 阅读 [快速参考](./QUICK_REFERENCE.md) - 快速上手

### 开发者路径 | For Developers

1. 🔌 阅读 [插件系统规范](./OBJECTOS_PLUGIN_SPECIFICATION.md) - 学习插件开发
2. 🔗 阅读 [集成指南](./OBJECTOS_INTEGRATION_GUIDE.md) - 集成ObjectQL/ObjectUI
3. 📚 参考 [SPEC文档](./SPEC_SYSTEM_INDEX.md) - 了解协议标准
4. 🧪 查看示例代码 - packages/plugins/*/

### 运维路径 | For DevOps

1. 🚀 阅读 [部署运维指南](./OBJECTOS_DEPLOYMENT_GUIDE.md) - 掌握部署流程
2. 📊 配置监控系统 - Prometheus + Grafana
3. 🔒 实施安全加固 - 防火墙、SSL、备份
4. 📈 性能调优 - 数据库、缓存、负载均衡

### 架构师路径 | For Architects

1. 🏛️ 深入学习 [架构设计文档](./OBJECTOS_ARCHITECTURE_DESIGN.md)
2. 🔄 研究 [微内核迁移](./MICROKERNEL_MIGRATION_SUMMARY.md)
3. 📊 分析 [架构对比](./ARCHITECTURE_COMPARISON.md)
4. 🎯 规划 [实施路线图](./IMPLEMENTATION_ROADMAP.md)

---

## 🔍 文档搜索 | Document Search

### 按主题查找 | Find by Topic

| 主题 Topic | 相关文档 Related Docs |
|-----------|---------------------|
| **架构设计** | ARCHITECTURE*.md, MICROKERNEL*.md |
| **插件开发** | PLUGIN_SPECIFICATION.md, SYSTEM_PLUGINS*.md |
| **协议标准** | SPEC_SYSTEM*.md, API_PROTOCOL*.md |
| **部署运维** | DEPLOYMENT_GUIDE.md, docker-compose*.yml |
| **集成方案** | INTEGRATION_GUIDE.md, BETTER_AUTH*.md |
| **升级指南** | OBJECTSTACK_*_UPGRADE*.md |

### 按语言查找 | Find by Language

- 🇨🇳 **中文文档**: *_CN.md, DEVELOPMENT_MASTER_PLAN.md (双语)
- 🇬🇧 **English Docs**: All other .md files
- 🌐 **双语文档**: DEVELOPMENT_MASTER_PLAN.md, IMPLEMENTATION_ROADMAP.md

---

## 📞 获取帮助 | Get Help

### 社区支持 | Community Support

- **GitHub Issues**: https://github.com/objectstack-ai/objectos/issues
- **GitHub Discussions**: https://github.com/objectstack-ai/objectos/discussions
- **官方文档站**: (即将推出)

### 商业支持 | Commercial Support

- **企业咨询**: support@objectstack.ai
- **定制开发**: enterprise@objectstack.ai
- **培训服务**: training@objectstack.ai

---

## 🤝 贡献文档 | Contribute to Docs

我们欢迎文档贡献！请参考：
- [CONTRIBUTING.md](./CONTRIBUTING.md) - 贡献指南
- 文档PR要求：
  - 中文文档请同时提供英文翻译
  - 代码示例需要测试通过
  - 保持格式一致性

---

## 📋 文档更新日志 | Documentation Changelog

### 2026-02-03
- ✅ 新增：[ObjectOS 开发总体方案](./OBJECTOS_DEVELOPMENT_MASTER_PLAN.md)
- ✅ 新增：[ObjectOS 架构设计文档](./OBJECTOS_ARCHITECTURE_DESIGN.md)
- ✅ 新增：[ObjectOS 插件系统规范](./OBJECTOS_PLUGIN_SPECIFICATION.md)
- ✅ 新增：[ObjectOS 集成指南](./OBJECTOS_INTEGRATION_GUIDE.md)
- ✅ 新增：[ObjectOS 部署运维指南](./OBJECTOS_DEPLOYMENT_GUIDE.md)
- ✅ 新增：[ObjectOS 文档索引](./OBJECTOS_DOCUMENTATION_INDEX.md) (本文档)

---

<div align="center">

**ObjectOS 文档中心**

打造全球最受欢迎的企业管理软件平台

Building the World's Most Popular Enterprise Management Platform

---

[GitHub](https://github.com/objectstack-ai/objectos) • 
[官网](https://objectstack.ai) • 
[文档](./OBJECTOS_DOCUMENTATION_INDEX.md)

</div>
