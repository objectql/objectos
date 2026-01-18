# ObjectOS 开发计划 (Development Plan)

> **当前版本**: v0.2.0  
> **目标版本**: v0.3.0 (Q1 2026)  
> **最后更新**: 2026年1月

---

## 一、项目现状分析 (Current Status Analysis)

### 1.1 已完成的核心功能

✅ **基础架构**
- ObjectOS Kernel 核心引擎已实现
- 对象注册表 (Object Registry) 运行正常
- 基于 NestJS 的 HTTP 服务器
- 基础 CRUD 操作通过驱动层实现

✅ **数据层**
- PostgreSQL 驱动支持
- MongoDB 驱动支持
- YAML 元数据解析器

✅ **认证系统**
- Better-Auth 集成
- 基础身份验证流程

✅ **UI 组件**
- React UI 组件库 (Grid, Form)
- 基础文档结构

### 1.2 待改进的关键领域

🔴 **高优先级缺失功能**
- 权限系统不完整（缺少字段级和记录级权限）
- 关系字段解析不完整（Lookup, Master-Detail）
- 测试覆盖率不足（目标: 80%+）
- 生命周期钩子系统不完整

🟡 **中优先级缺失功能**
- 工作流引擎未实现
- GraphQL API 未实现
- 实时同步能力缺失
- 批量操作 API 不完整

🟢 **低优先级改进**
- UI 组件需要优化
- 文档需要扩展
- 开发工具 (CLI) 缺失

---

## 二、Q1 2026 开发目标 (Q1 2026 Development Goals)

### 2.1 核心目标

**目标 1: 实现生产级权限系统**
- 完成对象级权限 (CRUD)
- 实现字段级安全 (Field-Level Security)
- 实现记录级安全 (Record-Level Security / RLS)
- 集成到 Kernel 和 Server 层

**目标 2: 完善生命周期钩子系统**
- 实现所有标准钩子 (beforeFind, afterInsert 等)
- 支持异步钩子链
- 添加钩子优先级和排序
- 提供钩子调试工具

**目标 3: 关系字段完整实现**
- Lookup 字段 (多对一)
- Master-Detail 关系 (级联删除)
- 多对多关系
- 关系查询优化

**目标 4: 提升测试覆盖率**
- Kernel: 90%+ 单元测试覆盖率
- Server: 80%+ 集成测试覆盖率
- 关键流程 E2E 测试

---

## 三、详细实施计划 (Detailed Implementation Plan)

### 阶段 1: 权限系统实现 (2-3 周)

#### 3.1 对象级权限 (Object-Level Permissions)

**任务清单:**
1. 在 `@objectql/types` 中定义权限接口
   ```typescript
   interface PermissionSet {
     allowRead?: boolean | string[];
     allowCreate?: boolean | string[];
     allowEdit?: boolean | string[];
     allowDelete?: boolean | string[];
   }
   ```

2. 在 Kernel 中实现权限检查器
   ```typescript
   // packages/kernel/src/security/permission-checker.ts
   class PermissionChecker {
     canRead(object: string, user: User): boolean
     canCreate(object: string, user: User): boolean
     canUpdate(object: string, user: User): boolean
     canDelete(object: string, user: User): boolean
   }
   ```

3. 在 Server 层添加权限守卫
   ```typescript
   // packages/server/src/guards/permission.guard.ts
   @Injectable()
   export class PermissionGuard implements CanActivate {
     canActivate(context: ExecutionContext): boolean
   }
   ```

**验收标准:**
- [ ] 所有 CRUD 操作都经过权限检查
- [ ] 权限拒绝返回 403 错误
- [ ] 单元测试覆盖率 95%+
- [ ] 集成测试验证端到端流程

**预计工时:** 5-7 天

#### 3.2 字段级安全 (Field-Level Security)

**任务清单:**
1. 扩展字段定义支持可见性规则
   ```yaml
   fields:
     salary:
       type: currency
       label: 薪资
       visible_to: ['hr', 'admin']
       editable_by: ['hr']
   ```

2. 实现字段过滤器
   ```typescript
   // packages/kernel/src/security/field-filter.ts
   class FieldFilter {
     filterReadable(object: string, fields: string[], user: User): string[]
     filterEditable(object: string, fields: string[], user: User): string[]
   }
   ```

3. 在查询结果中自动过滤字段
   ```typescript
   // Kernel 在返回数据前过滤不可见字段
   const visibleFields = fieldFilter.filterReadable(objectName, fields, user);
   return records.map(r => pick(r, visibleFields));
   ```

**验收标准:**
- [ ] 用户只能看到有权限的字段
- [ ] 编辑操作自动忽略无权限字段
- [ ] API 响应不包含受限字段
- [ ] 测试覆盖所有边界情况

**预计工时:** 4-5 天

#### 3.3 记录级安全 (Record-Level Security)

**任务清单:**
1. 实现共享规则 (Sharing Rules)
   ```yaml
   sharing_rules:
     - name: owner_full_access
       criteria: { owner: $current_user }
       access: read_write
     - name: manager_read_access
       criteria: { manager: $current_user }
       access: read_only
   ```

2. 在查询时注入过滤器
   ```typescript
   // packages/kernel/src/security/rls-injector.ts
   class RLSInjector {
     injectFilters(
       objectName: string, 
       filters: FilterGroup, 
       user: User
     ): FilterGroup
   }
   ```

3. 在 beforeFind 钩子中自动应用
   ```typescript
   kernel.on('beforeFind', async (ctx) => {
     ctx.filters = rlsInjector.injectFilters(
       ctx.objectName,
       ctx.filters,
       ctx.user
     );
   });
   ```

**验收标准:**
- [ ] 用户只能查询到有权限的记录
- [ ] 共享规则正确应用
- [ ] 性能测试通过（查询时间增加 < 10%）
- [ ] 完整的安全测试套件

**预计工时:** 6-8 天

---

### 阶段 2: 生命周期钩子系统 (1-2 周)

#### 3.4 标准钩子实现

**任务清单:**
1. 定义完整的钩子类型
   ```typescript
   type HookType = 
     | 'beforeFind' | 'afterFind'
     | 'beforeInsert' | 'afterInsert'
     | 'beforeUpdate' | 'afterUpdate'
     | 'beforeDelete' | 'afterDelete'
     | 'beforeValidate' | 'afterValidate';
   
   interface HookContext<T = any> {
     objectName: string;
     operation: 'find' | 'insert' | 'update' | 'delete';
     user: User;
     data?: T;
     filters?: FilterGroup;
     result?: any;
   }
   ```

2. 实现钩子管理器
   ```typescript
   // packages/kernel/src/hooks/hook-manager.ts
   class HookManager {
     register(
       hookType: HookType, 
       handler: HookHandler, 
       priority?: number
     ): void
     
     async execute(
       hookType: HookType, 
       context: HookContext
     ): Promise<void>
     
     unregister(hookType: HookType, handler: HookHandler): void
   }
   ```

3. 在 Kernel 操作中插入钩子调用点
   ```typescript
   async insert(objectName: string, data: any): Promise<any> {
     const context = { objectName, operation: 'insert', data, user };
     
     // Before hooks
     await this.hooks.execute('beforeValidate', context);
     await this.hooks.execute('beforeInsert', context);
     
     // Actual insert
     const result = await this.driver.insert(objectName, context.data);
     
     // After hooks
     context.result = result;
     await this.hooks.execute('afterInsert', context);
     
     return context.result;
   }
   ```

**验收标准:**
- [ ] 所有 8 种钩子类型正常工作
- [ ] 钩子按优先级顺序执行
- [ ] 支持异步钩子处理
- [ ] 钩子错误不会导致系统崩溃
- [ ] 完整的钩子文档和示例

**预计工时:** 5-6 天

#### 3.5 钩子调试工具

**任务清单:**
1. 添加钩子执行日志
   ```typescript
   class HookManager {
     enableDebug(enabled: boolean): void
     
     async execute(hookType: HookType, context: HookContext) {
       if (this.debugEnabled) {
         console.log(`[Hook] ${hookType} started`, context);
       }
       // ...
       if (this.debugEnabled) {
         console.log(`[Hook] ${hookType} completed in ${duration}ms`);
       }
     }
   }
   ```

2. 实现钩子性能监控
   ```typescript
   interface HookMetrics {
     hookType: HookType;
     executionTime: number;
     timestamp: Date;
     success: boolean;
     error?: Error;
   }
   ```

3. 添加钩子测试工具
   ```typescript
   // packages/kernel/src/testing/hook-tester.ts
   class HookTester {
     testHook(
       hookType: HookType,
       context: HookContext
     ): Promise<HookTestResult>
   }
   ```

**验收标准:**
- [ ] 可以查看所有已注册的钩子
- [ ] 可以追踪钩子执行顺序
- [ ] 可以测量钩子性能
- [ ] 提供钩子调试文档

**预计工时:** 3-4 天

---

### 阶段 3: 关系字段实现 (2-3 周)

#### 3.6 Lookup 字段 (多对一)

**任务清单:**
1. 扩展字段定义
   ```yaml
   fields:
     account:
       type: lookup
       reference_to: accounts
       label: 所属客户
       relationship_name: contacts
   ```

2. 实现关系解析器
   ```typescript
   // packages/kernel/src/relations/lookup-resolver.ts
   class LookupResolver {
     async resolve(
       objectName: string,
       records: any[],
       lookupField: string
     ): Promise<any[]>
   }
   ```

3. 在查询时自动加载关联对象
   ```typescript
   // Auto-populate lookup fields
   const contacts = await kernel.find('contacts', {
     fields: ['name', 'account.name', 'account.industry'],
     populate: ['account']
   });
   ```

**验收标准:**
- [ ] Lookup 字段正确保存引用 ID
- [ ] 查询时可选择性加载关联对象
- [ ] 支持级联查询（account.owner.name）
- [ ] 关系查询性能优化（避免 N+1 问题）

**预计工时:** 6-7 天

#### 3.7 Master-Detail 关系

**任务清单:**
1. 定义 Master-Detail 关系
   ```yaml
   fields:
     opportunity:
       type: master_detail
       reference_to: opportunities
       cascade_delete: true
       rollup_summary: true
   ```

2. 实现级联删除
   ```typescript
   // When deleting master, delete all detail records
   async delete(objectName: string, id: string) {
     const config = this.registry.get(objectName);
     
     // Find and delete detail records
     for (const field of config.fields) {
       if (field.type === 'master_detail' && field.cascade_delete) {
         await this.deleteDetailRecords(objectName, id, field);
       }
     }
     
     // Delete master record
     await this.driver.delete(objectName, id);
   }
   ```

3. 实现汇总字段 (Rollup Summary)
   ```yaml
   # On opportunity object
   fields:
     total_amount:
       type: rollup_summary
       summarized_object: line_items
       summarized_field: amount
       operation: SUM
   ```

**验收标准:**
- [ ] Master-Detail 关系正确建立
- [ ] 删除主记录时自动删除从记录
- [ ] 汇总字段自动计算
- [ ] 防止孤儿记录

**预计工时:** 7-8 天

#### 3.8 多对多关系

**任务清单:**
1. 定义多对多关系
   ```yaml
   # On project object
   fields:
     members:
       type: many_to_many
       reference_to: users
       junction_object: project_members
   ```

2. 自动创建连接表
   ```typescript
   // Auto-generate junction object
   const junctionObject = {
     name: 'project_members',
     fields: {
       project: { type: 'lookup', reference_to: 'projects' },
       user: { type: 'lookup', reference_to: 'users' }
     }
   };
   ```

3. 实现多对多操作 API
   ```typescript
   // Add members to project
   await kernel.addRelation('projects', projectId, 'members', [userId1, userId2]);
   
   // Remove member
   await kernel.removeRelation('projects', projectId, 'members', [userId1]);
   
   // Query with members
   const projects = await kernel.find('projects', {
     populate: ['members']
   });
   ```

**验收标准:**
- [ ] 多对多关系正确建立
- [ ] 连接表自动创建和管理
- [ ] 支持添加/删除关系
- [ ] 支持查询关联记录

**预计工时:** 5-6 天

---

### 阶段 4: 测试与文档 (持续进行)

#### 3.9 单元测试

**目标:**
- Kernel 包: 90%+ 覆盖率
- Server 包: 80%+ 覆盖率
- UI 包: 70%+ 覆盖率

**任务清单:**
1. 为所有新功能编写单元测试
2. 为现有代码补充测试
3. 设置代码覆盖率报告
4. 集成到 CI/CD 流程

**预计工时:** 持续进行，每个功能 30% 工时用于测试

#### 3.10 集成测试

**任务清单:**
1. 端到端 API 测试
   ```typescript
   describe('Permissions E2E', () => {
     it('should deny access to unpermitted field', async () => {
       const response = await request(app)
         .get('/api/data/employees/123')
         .set('Authorization', `Bearer ${salesUserToken}`)
         .expect(200);
       
       expect(response.body).not.toHaveProperty('salary');
     });
   });
   ```

2. 数据库集成测试
3. 权限系统端到端测试
4. 关系字段查询测试

**预计工时:** 每个阶段 2-3 天

#### 3.11 文档更新

**任务清单:**
1. API 文档 (OpenAPI/Swagger)
2. 权限系统使用指南
3. 钩子系统开发指南
4. 关系字段配置指南
5. 最佳实践文档

**预计工时:** 每个主要功能 1-2 天

---

## 四、时间线与里程碑 (Timeline & Milestones)

### Week 1-2: 权限系统基础
- [ ] 对象级权限实现 (Week 1)
- [ ] 字段级安全实现 (Week 2)
- [ ] 单元测试和文档 (Week 2)

### Week 3-4: 权限系统完善与钩子系统
- [ ] 记录级安全实现 (Week 3)
- [ ] 钩子系统实现 (Week 4)
- [ ] 钩子调试工具 (Week 4)

### Week 5-7: 关系字段实现
- [ ] Lookup 字段 (Week 5)
- [ ] Master-Detail 关系 (Week 6)
- [ ] 多对多关系 (Week 7)

### Week 8-9: 集成测试与优化
- [ ] 集成测试编写 (Week 8)
- [ ] 性能优化 (Week 8)
- [ ] Bug 修复 (Week 9)
- [ ] 文档完善 (Week 9)

### Week 10: 发布准备
- [ ] 代码审查
- [ ] 安全审计
- [ ] 发布 v0.3.0
- [ ] 发布公告和迁移指南

---

## 五、技术债务清理 (Technical Debt)

### 5.1 高优先级技术债务

1. **Kernel 依赖注入重构**
   - 问题: 某些地方仍有硬编码依赖
   - 解决: 完全使用 DI 模式
   - 工时: 2-3 天

2. **错误处理标准化**
   - 问题: 错误类型不统一
   - 解决: 创建统一的错误类和错误码
   - 工时: 2 天

3. **类型定义完善**
   - 问题: 部分接口使用 `any`
   - 解决: 补充严格类型定义
   - 工时: 3-4 天

### 5.2 代码质量改进

1. 添加 ESLint 规则
2. 配置 Prettier
3. 添加 Pre-commit hooks
4. 代码审查 Checklist

---

## 六、风险评估与应对 (Risk Assessment)

### 6.1 技术风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| 权限系统性能问题 | 高 | 中 | 提前进行性能测试，使用缓存优化 |
| 关系查询 N+1 问题 | 高 | 高 | 实现 DataLoader 模式，批量查询 |
| 钩子系统复杂度 | 中 | 中 | 提供清晰文档，限制钩子嵌套深度 |
| 数据库兼容性 | 中 | 低 | 在多种数据库上进行集成测试 |

### 6.2 进度风险

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 需求变更 | 高 | 冻结 Q1 需求，新需求放入 Q2 |
| 人力不足 | 高 | 招募贡献者，简化某些功能范围 |
| 测试时间不足 | 中 | 测试与开发并行，TDD 模式 |
| 文档延迟 | 低 | 文档与代码同步编写 |

---

## 七、成功标准 (Success Criteria)

### 7.1 功能完整性

- [x] 所有计划功能实现
- [x] 所有测试通过
- [x] 文档齐全

### 7.2 质量指标

- **测试覆盖率**
  - Kernel: ≥ 90%
  - Server: ≥ 80%
  - UI: ≥ 70%

- **性能指标**
  - API 响应时间 (P95): < 100ms
  - 权限检查开销: < 10ms
  - 关系查询优化: 避免 N+1

- **代码质量**
  - 0 TypeScript 错误
  - 0 ESLint 错误
  - 代码审查通过率: 100%

### 7.3 用户反馈

- 至少 3 个实际项目试用
- 收集反馈并改进
- GitHub Stars 增长 20%+

---

## 八、后续规划 (Future Plans)

### Q2 2026 预览

1. **工作流引擎**
   - 可视化流程设计器
   - 审批流程
   - 定时任务

2. **GraphQL API**
   - 自动生成 GraphQL Schema
   - 查询优化
   - 实时订阅

3. **高级数据功能**
   - 数据导入/导出
   - 批量操作
   - 数据去重

4. **开发者工具**
   - CLI 工具
   - VS Code 扩展
   - 调试工具

---

## 九、资源需求 (Resource Requirements)

### 9.1 人力资源

- **核心开发**: 2-3 全职开发者
- **贡献者**: 5-10 兼职贡献者
- **测试**: 1 专职测试工程师
- **文档**: 1 技术写手

### 9.2 基础设施

- CI/CD 服务器（GitHub Actions）
- 测试数据库（PostgreSQL, MongoDB）
- 文档托管（VitePress + Vercel）
- NPM 包发布

### 9.3 社区建设

- Discord 服务器设置
- 定期直播 / 技术分享
- 文档翻译（中英文）
- 示例项目库

---

## 十、总结 (Summary)

ObjectOS Q1 2026 的核心目标是**实现生产级的权限系统、完善的生命周期钩子和完整的关系字段支持**。通过 10 周的系统开发，我们将：

✅ **提升安全性**: 多层权限保护，达到企业级安全标准  
✅ **增强灵活性**: 完整的钩子系统，支持业务逻辑定制  
✅ **扩展数据能力**: 关系字段支持，满足复杂业务需求  
✅ **保证质量**: 80%+ 测试覆盖率，全面的文档  

**让 ObjectOS 成为真正可用于生产环境的企业级低代码平台！**

---

**下一步行动:**
1. 团队评审此计划
2. 分配任务给开发者
3. 设置项目看板（GitHub Projects）
4. 开始 Sprint 1 开发

**联系方式:**
- GitHub Issues: https://github.com/objectstack-ai/objectos/issues
- 项目讨论: GitHub Discussions
