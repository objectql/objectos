# AI 元数据定义说明

本文档说明了新创建的 AI 相关元数据定义，参考了 Zapier 的 AI 功能设计。

## 概述

已为 ObjectQL 创建了完整的 AI 管理系统元数据定义，包括三个核心实体：

1. **AI 工具 (AI Tools)** - 可重用的 AI 功能和能力
2. **AI 聊天机器人 (AI Chatbots)** - 对话式 AI 接口
3. **AI 代理 (AI Agents)** - 自主执行复杂任务的 AI 实体

## 创建的文件

### 核心对象定义

#### 1. AI 工具 (`ai_tool.object.yml`)

定义可重用的 AI 功能，类似于 Zapier 的 AI Actions。

**主要字段**：
- 基本信息：名称、显示名称、描述、分类
- AI 配置：提供商（OpenAI、Anthropic、Google AI 等）、模型、版本
- 功能配置：输入/输出模式、系统提示词、温度参数、令牌限制
- 运营数据：使用次数、成本追踪、速率限制
- 状态管理：草稿、活跃、已弃用、已归档

**支持的分类**：
- 文本处理
- 数据分析
- 图像生成
- 代码生成
- 翻译
- 情感分析
- 摘要生成
- 问答系统

**自定义操作**：
- `execute`: 执行工具
- `validate`: 验证配置
- `test`: 测试工具

#### 2. AI 聊天机器人 (`ai_chatbot.object.yml`)

定义对话式 AI 界面，用于客户服务、支持和互动。

**主要字段**：
- 基本配置：名称、头像、欢迎消息、个性设置
- 语言支持：主要语言、支持的多语言列表
- AI 配置：提供商、模型、系统提示词
- 对话管理：上下文窗口、最大对话长度、回退消息
- 人工转接：启用人工转接、转接条件
- 部署渠道：网页、移动端、Slack、Teams、WhatsApp 等
- 分析数据：总对话数、总消息数、平均满意度

**个性选项**：
- 专业型 (Professional)
- 友好型 (Friendly)
- 休闲型 (Casual)
- 正式型 (Formal)
- 幽默型 (Humorous)
- 同理心型 (Empathetic)

**自定义操作**：
- `start_conversation`: 开始对话
- `deploy`: 部署聊天机器人
- `train`: 训练聊天机器人
- `test_conversation`: 测试对话

#### 3. AI 代理 (`ai_agent.object.yml`)

定义能够执行复杂任务和工作流的自主 AI 实体。

**主要字段**：
- 基本信息：名称、类型、目标、能力列表
- AI 配置：提供商、模型、系统提示词
- 推理策略：思维链、思维树、ReAct（推理+行动）、反思
- 记忆管理：短期记忆、长期记忆、混合模式
- 工具访问：关联的 AI 工具列表
- 触发方式：手动、定时、事件驱动、API 调用、持续运行
- 审批流程：自动审批、需要审批的操作列表
- 错误处理：重试、跳过、升级、中止
- 成本控制：每任务成本限制、每日成本限制
- 性能指标：执行任务数、成功率、平均执行时间

**代理类型**：
- 任务自动化
- 数据处理
- 工作流编排
- 研究助手
- 代码助手
- 客户服务
- 内容创作
- 分析报告

**自定义操作**：
- `execute_task`: 执行任务
- `pause`: 暂停代理
- `resume`: 恢复代理
- `reset_memory`: 重置记忆
- `validate_config`: 验证配置
- `simulate`: 模拟执行

### 应用和界面定义

#### AI 管理应用 (`ai.app.yml`)

完整的导航结构，包括：
- 概览：仪表板、快速开始
- AI 实体：工具、聊天机器人、代理
- 分析：使用情况、成本、性能指标
- 监控：活动任务、执行日志、错误报告
- 配置：API 密钥、提供商设置、速率限制

#### 仪表板页面 (`ai_dashboard.page.yml`)

综合仪表板，展示：
- 5 个可视化图表
- AI 工具、聊天机器人、代理的数据表格
- 实时状态和性能指标

### 图表定义

创建了 5 个图表用于数据可视化：

1. **ai_tools_by_category.chart.yml** - 按分类展示工具分布（饼图）
2. **ai_tools_by_status.chart.yml** - 按状态展示工具分布（柱状图）
3. **chatbot_conversations.chart.yml** - 聊天机器人对话趋势（面积图）
4. **agent_success_rate.chart.yml** - 代理成功率对比（柱状图）
5. **agent_tasks_by_status.chart.yml** - 按状态展示代理任务（饼图）

### 示例数据

#### AI 工具示例数据 (`ai_tool.data.yml`)

包含 4 个预配置的工具：
- 文本摘要器 (Text Summarizer)
- 情感分析器 (Sentiment Analyzer)
- 代码生成器 (Code Generator)
- 多语言翻译器 (Multi-language Translator)

#### 聊天机器人示例数据 (`ai_chatbot.data.yml`)

包含 3 个预配置的聊天机器人：
- 客户支持助手 (Customer Support Assistant)
- 销售助手机器人 (Sales Assistant Bot)
- HR 入职助手 (HR Onboarding Assistant)

#### AI 代理示例数据 (`ai_agent.data.yml`)

包含 4 个预配置的代理：
- 数据分析代理 (Data Analysis Agent)
- 内容创作代理 (Content Creation Agent)
- 工作流自动化代理 (Workflow Automation Agent)
- 代码审查代理 (Code Review Agent)

### 支持文件

- **README.md** - 完整的英文文档，包括使用指南和最佳实践
- **index.ts** - TypeScript 导出和枚举定义
- **package.json** - 包配置文件

## 设计特点

### 参考 Zapier 的优势

1. **统一的元数据格式** - 所有 AI 实体使用相同的定义规范
2. **多提供商支持** - 支持 OpenAI、Anthropic、Google AI、AWS、Azure 等
3. **灵活的配置** - 可自定义输入/输出模式、系统提示词等
4. **成本追踪** - 内置使用量和成本监控
5. **工作流集成** - 代理可以组合使用多个工具

### ObjectQL 的优势

1. **类型安全** - 通过模式进行强类型验证
2. **数据库无关** - 同时支持 MongoDB 和 PostgreSQL
3. **自动 API** - 从元数据自动生成 RESTful API
4. **UI 生成** - 自动生成管理界面
5. **可扩展性** - 易于添加自定义字段和行为

## 使用场景

### AI 工具
- 文本摘要和处理
- 情感分析
- 代码生成和审查
- 语言翻译
- 数据提取和转换

### AI 聊天机器人
- 24/7 客户支持
- 销售咨询和引导
- HR 员工入职
- FAQ 自动回答
- 潜在客户资格认证

### AI 代理
- 自动化数据分析和报告
- 内容创作工作流
- 业务流程自动化
- 代码质量保证
- 研究和信息收集

## 技术规范

所有定义遵循 ObjectQL 元数据规范：
- 标准字段类型（text、select、number、currency 等）
- 关系字段（lookup 到 user 和 organization）
- 自定义操作用于工具执行和代理任务
- 支持 MongoDB 和 PostgreSQL 后端
- 自动 API 生成
- 从元数据生成 UI 组件

## 下一步

1. 根据具体需求扩展元数据
2. 为指标创建额外的图表可视化
3. 为特定工作流构建自定义页面
4. 集成外部 AI 提供商
5. 添加事件驱动代理的 webhook 支持
6. 实现成本追踪和优化

## 验证状态

✅ 所有 YAML 文件语法正确  
✅ 字段类型符合 ObjectQL 规范  
✅ 项目构建成功  
✅ 示例数据结构完整

## 文件位置

所有文件位于：`examples/ai-management/`

```
examples/ai-management/
├── README.md                           # 英文文档
├── README_CN.md                        # 中文文档（本文件）
├── package.json                        # 包配置
└── src/
    ├── ai_tool.object.yml              # AI 工具对象定义
    ├── ai_chatbot.object.yml           # 聊天机器人对象定义
    ├── ai_agent.object.yml             # AI 代理对象定义
    ├── ai.app.yml                      # AI 管理应用
    ├── ai_dashboard.page.yml           # 仪表板页面
    ├── ai_tool.data.yml                # AI 工具示例数据
    ├── ai_chatbot.data.yml             # 聊天机器人示例数据
    ├── ai_agent.data.yml               # AI 代理示例数据
    ├── ai_tools_by_category.chart.yml  # 工具分类图表
    ├── ai_tools_by_status.chart.yml    # 工具状态图表
    ├── chatbot_conversations.chart.yml # 聊天机器人对话图表
    ├── agent_success_rate.chart.yml    # 代理成功率图表
    ├── agent_tasks_by_status.chart.yml # 代理任务状态图表
    └── index.ts                        # TypeScript 导出
```
