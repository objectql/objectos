# Base Layer 评估总结 (Quick Reference)

## 一、核心结论

✅ **建议实现轻量级 Base 层**

## 二、什么是 Base？

Base 是 Airtable 中的核心概念，相当于一个**项目空间**或**迷你数据库**：

```
Organization (组织)
  └── Base (项目/数据库)
      ├── Tables (表)
      ├── Views (视图)
      └── Interfaces (界面)
```

## 三、为什么需要 Base？

### ObjectQL 当前缺口

| 场景 | 问题 |
|------|------|
| 多项目管理 | 所有数据混在一起，难以隔离 |
| 权限控制 | 只能在 Organization 级别设置权限，粒度太粗 |
| 模板复用 | 无法复制完整的业务场景 |
| 数据导出 | 无法导出完整项目 |

### 用户需求场景

1. **咨询公司**: 每个客户项目需要独立数据空间
2. **软件公司**: 每条产品线有独立的需求、任务、缺陷
3. **个人用户**: 管理多个独立项目（装修、旅行、投资等）

## 四、实现方案对比

| 维度 | 轻量级 Base (推荐) | 完整隔离 Base |
|------|-------------------|--------------|
| 实现复杂度 | ⭐ 低 | ⭐⭐⭐ 高 |
| 开发周期 | 2-3 周 | 6-8 周 |
| 数据隔离 | 逻辑隔离 (Filter) | 物理隔离 (Schema) |
| 向后兼容 | ✅ 完全兼容 | ⚠️ 需迁移 |

## 五、架构设计 (轻量级方案)

### 数据模型

```
Organization
  └── Base (元数据容器)
      ├── Objects (belongsTo: baseId)
      ├── Apps (belongsTo: baseId)
      └── Base Members (权限控制)
```

### 核心变化

1. **新增 2 个对象**:
   - `base.object.yml` - Base 定义
   - `base_member.object.yml` - Base 成员

2. **扩展现有类型**:
   ```typescript
   ObjectConfig { baseId?: string }
   AppConfig { baseId?: string }
   ObjectQLContext { baseId?: string }
   ```

3. **自动过滤**:
   - Repository 自动注入 `baseId` 过滤条件
   - 用户无需手动处理数据隔离

## 六、核心功能

### P0 (必须实现)
- [x] Base 作为数据命名空间
- [x] Base 级别权限控制
- [x] Base 列表与切换

### P1 (重要功能)
- [ ] Base 模板系统
- [ ] Base 设置与元数据
- [ ] Base 复制功能
- [ ] Base 归档与删除

### P2 (增强功能)
- [ ] Base 级别自动化
- [ ] Base 导入导出
- [ ] Base 分享链接

## 七、实施计划

| 阶段 | 周次 | 内容 |
|------|------|------|
| 阶段 1 | Week 1 | 核心数据模型 |
| 阶段 2 | Week 2 | Repository 层集成 |
| 阶段 3 | Week 2-3 | API 端点 |
| 阶段 4 | Week 3 | UI 集成 |
| 阶段 5 | Week 3 | 文档与测试 |

**总计**: 3 周

## 八、向后兼容

✅ **现有项目无需任何更改**

- `baseId` 是可选字段
- 未设置 `baseId` 的 Objects 继续正常工作
- 用户可选择是否使用 Base 功能

## 九、代码示例

### 创建 Base

```typescript
const base = await ctx.object('base').insert({
  name: 'Product Roadmap 2024',
  slug: 'product-roadmap-2024',
  organizationId: orgId
});
```

### 在 Base 中查询

```typescript
// 设置 Base 上下文
const ctx = objectql.getContext({ 
  userId, 
  baseId: 'base_123' 
});

// 自动只查询该 Base 的数据
const tasks = await ctx.object('tasks').find({
  filters: [['status', '=', 'open']]
});
```

### Object 定义

```yaml
# tasks.object.yml
name: tasks
fields:
  baseId:
    type: text
    required: true
    index: true
    hidden: true  # 自动管理，用户不可见
  
  title:
    type: text
    required: true
```

## 十、成本与风险

### 开发成本
- **人力**: 1 名全栈工程师 × 3 周
- **总计**: 3.5 人周

### 技术风险
- ✅ **低风险**: 仅增加元数据层，不改变核心逻辑
- ✅ **向后兼容**: 现有项目零影响
- ⚠️ **性能**: 需在 `baseId` 建索引（影响 < 5%）

## 十一、下一步

### 如果批准
1. ✅ 创建 Base 对象定义 (已完成)
2. ✅ 编写评估文档 (已完成)
3. ✅ 编写实施指南 (已完成)
4. ⏳ 团队评审
5. ⏳ 启动开发

### 如果不批准
- 保持现状
- 或考虑其他替代方案

## 十二、参考文档

1. **[完整评估报告](./BASE_LAYER_EVALUATION.md)** - 详细分析与方案对比
2. **[实施指南](./BASE_IMPLEMENTATION_GUIDE.md)** - 技术实现细节
3. **[Airtable 功能评估](./AIRTABLE_EVALUATION.md)** - Airtable 对标分析

---

**建议**: ⭐⭐⭐⭐⭐ 强烈推荐实施  
**优先级**: P1 (高优先级)  
**时机**: Q1 2026  
**风险**: 低  
**ROI**: 高
