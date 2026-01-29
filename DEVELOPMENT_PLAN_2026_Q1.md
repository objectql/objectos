# ObjectOS 2026 Q1 详细开发计划

**计划周期**: 2026年1月 - 2026年3月  
**当前版本**: v0.2.0  
**目标版本**: v0.5.0  
**符合性目标**: 从 58% 提升到 70%+

---

## 📋 目录

1. [总体目标](#总体目标)
2. [团队组织](#团队组织)
3. [每周详细计划](#每周详细计划)
4. [技术规范](#技术规范)
5. [质量保证](#质量保证)
6. [风险管理](#风险管理)

---

## 🎯 总体目标

### 主要交付成果

1. **生产就绪的权限系统**
   - 对象级、字段级、记录级权限
   - 权限集和配置文件
   - 共享规则

2. **完整的审计日志系统**
   - 所有 CRUD 操作记录
   - 查询和报告 API
   - 归档策略

3. **全面的关系支持**
   - Lookup 字段（多对一）
   - Master-Detail 关系（级联删除）
   - Many-to-Many 关系
   - 关系查询优化

4. **NestJS 服务器完善**
   - 完整的 REST CRUD 端点
   - 中间件集成
   - E2E 测试覆盖

5. **测试覆盖率提升**
   - 内核: 90%+
   - 服务器: 80%+
   - 集成: 70%+

---

## 👥 团队组织

### 建议团队结构

| 角色 | 职责 | 所需人数 |
|------|------|----------|
| **技术负责人** | 架构设计、代码审查、技术决策 | 1 |
| **后端工程师** | 内核和服务器开发 | 2-3 |
| **测试工程师** | 测试开发、质量保证 | 1 |
| **文档工程师** | 文档编写、示例代码 | 1 |

---

## 📅 每周详细计划

### Week 1-2: 权限系统基础 (2周)

#### Week 1: 对象级和字段级权限

**目标**: 实现基础权限检查机制

##### 第1天: 设计和架构

**任务**:
- [ ] 设计权限数据模型
  ```yaml
  # permission_set.yml
  name: sales_permissions
  object: contacts
  permissions:
    allowRead: true
    allowCreate: true
    allowEdit: true
    allowDelete: false
  fieldPermissions:
    salary:
      visible: false
      editable: false
  ```

- [ ] 设计权限检查 API
  ```typescript
  interface PermissionChecker {
    canRead(user: User, object: string): boolean;
    canCreate(user: User, object: string): boolean;
    canEdit(user: User, object: string, recordId: string): boolean;
    canDelete(user: User, object: string, recordId: string): boolean;
    getVisibleFields(user: User, object: string): string[];
    getEditableFields(user: User, object: string): string[];
  }
  ```

- [ ] 创建实施计划文档

**交付物**:
- 权限系统设计文档
- API 接口定义
- 数据模型 YAML 示例

##### 第2-3天: 对象级权限实现

**位置**: `packages/kernel/src/permissions/object-permissions.ts`

**任务**:
- [ ] 实现 `ObjectPermissionChecker` 类
  ```typescript
  export class ObjectPermissionChecker {
    constructor(private objectQL: ObjectQL) {}
    
    async canRead(user: User, objectName: string): Promise<boolean> {
      const permissionSet = await this.getPermissionSet(user, objectName);
      return permissionSet.allowRead;
    }
    
    async canCreate(user: User, objectName: string): Promise<boolean> {
      const permissionSet = await this.getPermissionSet(user, objectName);
      return permissionSet.allowCreate;
    }
    
    // ... 其他方法
  }
  ```

- [ ] 实现权限集加载器
  ```typescript
  export class PermissionSetLoader {
    async loadPermissionSets(objectName: string): Promise<PermissionSet[]> {
      // 从 YAML 文件加载权限集
    }
  }
  ```

- [ ] 集成到 ObjectOS 内核
  ```typescript
  // packages/kernel/src/objectos.ts
  async find(objectName: string, options: FindOptions): Promise<any[]> {
    // 1. 检查权限
    if (!await this.permissions.canRead(this.currentUser, objectName)) {
      throw new ForbiddenError('No read permission');
    }
    
    // 2. 执行查询
    return super.find(objectName, options);
  }
  ```

**交付物**:
- `ObjectPermissionChecker` 实现
- `PermissionSetLoader` 实现
- 集成到 CRUD 操作

##### 第4-5天: 字段级权限实现

**位置**: `packages/kernel/src/permissions/field-permissions.ts`

**任务**:
- [ ] 实现 `FieldPermissionChecker` 类
  ```typescript
  export class FieldPermissionChecker {
    async getVisibleFields(
      user: User, 
      objectName: string
    ): Promise<string[]> {
      const metadata = await this.objectQL.getObject(objectName);
      const permissionSet = await this.getPermissionSet(user, objectName);
      
      return metadata.fields.filter(field => {
        const fieldPerm = permissionSet.fieldPermissions[field.name];
        return fieldPerm?.visible !== false;
      });
    }
    
    async getEditableFields(
      user: User, 
      objectName: string
    ): Promise<string[]> {
      // 类似实现
    }
  }
  ```

- [ ] 实现字段过滤器
  ```typescript
  export class FieldFilter {
    filterFields(
      data: any, 
      visibleFields: string[]
    ): any {
      const filtered: any = {};
      for (const field of visibleFields) {
        if (field in data) {
          filtered[field] = data[field];
        }
      }
      return filtered;
    }
  }
  ```

- [ ] 集成到查询和变更操作
  ```typescript
  async find(objectName: string, options: FindOptions): Promise<any[]> {
    // 1. 检查对象权限
    if (!await this.permissions.canRead(this.currentUser, objectName)) {
      throw new ForbiddenError();
    }
    
    // 2. 获取可见字段
    const visibleFields = await this.permissions.getVisibleFields(
      this.currentUser, 
      objectName
    );
    
    // 3. 限制字段选择
    const filteredFields = options.fields?.filter(f => 
      visibleFields.includes(f)
    ) || visibleFields;
    
    // 4. 执行查询
    const results = await super.find(objectName, {
      ...options,
      fields: filteredFields
    });
    
    // 5. 过滤结果字段
    return results.map(r => this.fieldFilter.filterFields(r, visibleFields));
  }
  ```

**交付物**:
- `FieldPermissionChecker` 实现
- `FieldFilter` 实现
- 集成到所有 CRUD 操作

#### Week 2: 记录级安全 (RLS)

##### 第1-2天: RLS 设计和实现

**位置**: `packages/kernel/src/permissions/record-permissions.ts`

**任务**:
- [ ] 设计 RLS 规则格式
  ```yaml
  # sharing_rules.yml
  object: contacts
  rules:
    - name: owner_only
      description: "Users can only see their own contacts"
      filter:
        owner: "${user.id}"
      roles: ["sales"]
    
    - name: team_members
      description: "Team members can see team contacts"
      filter:
        OR:
          - owner: "${user.id}"
          - team_id: "${user.team_id}"
      roles: ["manager"]
  ```

- [ ] 实现 `RecordLevelSecurityEngine` 类
  ```typescript
  export class RecordLevelSecurityEngine {
    async applyFilters(
      user: User,
      objectName: string,
      filters: FilterGroup
    ): Promise<FilterGroup> {
      const sharingRules = await this.getSharingRules(objectName);
      const userRoles = await this.getUserRoles(user);
      
      // 找到适用的规则
      const applicableRules = sharingRules.filter(rule =>
        rule.roles.some(role => userRoles.includes(role))
      );
      
      if (applicableRules.length === 0) {
        return filters;
      }
      
      // 构建 RLS 过滤器
      const rlsFilters = applicableRules.map(rule =>
        this.interpolateVariables(rule.filter, user)
      );
      
      // 合并到原始过滤器
      return {
        AND: [
          filters,
          { OR: rlsFilters }
        ]
      };
    }
    
    private interpolateVariables(filter: any, user: User): any {
      // 替换 ${user.id}, ${user.team_id} 等变量
      const json = JSON.stringify(filter);
      const interpolated = json.replace(
        /\$\{user\.(\w+)\}/g,
        (_, prop) => user[prop]
      );
      return JSON.parse(interpolated);
    }
  }
  ```

**交付物**:
- `RecordLevelSecurityEngine` 实现
- 共享规则 YAML 格式定义
- 变量插值逻辑

##### 第3-4天: RLS 集成

**任务**:
- [ ] 集成到所有查询操作
  ```typescript
  async find(objectName: string, options: FindOptions): Promise<any[]> {
    // 1. 对象级权限检查
    if (!await this.permissions.canRead(this.currentUser, objectName)) {
      throw new ForbiddenError();
    }
    
    // 2. 应用 RLS 过滤器
    const enhancedFilters = await this.rls.applyFilters(
      this.currentUser,
      objectName,
      options.filters
    );
    
    // 3. 字段级权限
    const visibleFields = await this.permissions.getVisibleFields(
      this.currentUser,
      objectName
    );
    
    // 4. 执行查询
    return super.find(objectName, {
      ...options,
      filters: enhancedFilters,
      fields: visibleFields
    });
  }
  ```

- [ ] 集成到更新和删除操作
  ```typescript
  async update(
    objectName: string,
    id: string,
    data: any
  ): Promise<any> {
    // 1. 检查记录是否存在且用户有权访问
    const record = await this.findOne(objectName, id);
    if (!record) {
      throw new NotFoundError();
    }
    
    // 2. 检查编辑权限
    if (!await this.permissions.canEdit(this.currentUser, objectName, id)) {
      throw new ForbiddenError();
    }
    
    // 3. 过滤可编辑字段
    const editableFields = await this.permissions.getEditableFields(
      this.currentUser,
      objectName
    );
    const filteredData = this.fieldFilter.filterFields(data, editableFields);
    
    // 4. 执行更新
    return super.update(objectName, id, filteredData);
  }
  ```

**交付物**:
- RLS 集成到所有 CRUD 操作
- 集成测试

##### 第5天: 权限系统测试

**位置**: `packages/kernel/test/permissions/`

**任务**:
- [ ] 对象级权限测试
  ```typescript
  describe('ObjectPermissionChecker', () => {
    it('should deny read access when no permission', async () => {
      const user = createTestUser({ roles: ['guest'] });
      const checker = new ObjectPermissionChecker(objectQL);
      
      expect(await checker.canRead(user, 'contacts')).toBe(false);
    });
    
    it('should allow read access when permission granted', async () => {
      const user = createTestUser({ roles: ['sales'] });
      expect(await checker.canRead(user, 'contacts')).toBe(true);
    });
  });
  ```

- [ ] 字段级权限测试
  ```typescript
  describe('FieldPermissionChecker', () => {
    it('should filter invisible fields', async () => {
      const user = createTestUser({ roles: ['sales'] });
      const fields = await checker.getVisibleFields(user, 'contacts');
      
      expect(fields).not.toContain('salary');
      expect(fields).toContain('name');
    });
  });
  ```

- [ ] RLS 测试
  ```typescript
  describe('RecordLevelSecurity', () => {
    it('should filter records by owner', async () => {
      const user = createTestUser({ id: 'user1', roles: ['sales'] });
      const results = await objectOS.find('contacts', {
        filters: {}
      });
      
      // 所有返回的记录应该属于 user1
      results.forEach(record => {
        expect(record.owner).toBe('user1');
      });
    });
  });
  ```

- [ ] 集成测试
  ```typescript
  describe('Permission Integration', () => {
    it('should enforce all permission layers', async () => {
      // 对象级: 拒绝访问
      // 字段级: 过滤字段
      // 记录级: 过滤记录
    });
  });
  ```

**交付物**:
- 40+ 权限系统单元测试
- 10+ 集成测试
- 测试覆盖率报告

---

### Week 3-4: 审计日志系统 (2周)

#### Week 3: 审计日志核心

##### 第1天: 审计日志设计

**任务**:
- [ ] 设计审计事件模式
  ```typescript
  interface AuditEvent {
    id: string;
    timestamp: Date;
    userId: string;
    userName: string;
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
    objectName: string;
    recordId?: string;
    changes?: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
    metadata: {
      ip?: string;
      userAgent?: string;
      requestId?: string;
    };
  }
  ```

- [ ] 设计存储策略
  - 主数据库表: `_audit_log`
  - 归档策略: 90天后归档到冷存储
  - 索引优化: 按时间、用户、对象建立索引

**交付物**:
- 审计事件数据模型
- 存储策略文档
- 数据库迁移脚本

##### 第2-3天: 审计日志记录器

**位置**: `packages/kernel/src/audit/audit-logger.ts`

**任务**:
- [ ] 实现 `AuditLogger` 类
  ```typescript
  export class AuditLogger {
    constructor(
      private objectQL: ObjectQL,
      private eventBus: EventBus
    ) {}
    
    async logCreate(
      user: User,
      objectName: string,
      recordId: string,
      data: any,
      metadata?: AuditMetadata
    ): Promise<void> {
      const event: AuditEvent = {
        id: generateId(),
        timestamp: new Date(),
        userId: user.id,
        userName: user.name,
        action: 'CREATE',
        objectName,
        recordId,
        changes: Object.keys(data).map(field => ({
          field,
          oldValue: null,
          newValue: data[field]
        })),
        metadata: metadata || {}
      };
      
      await this.objectQL.insert('_audit_log', event);
      this.eventBus.emit('audit.logged', event);
    }
    
    async logUpdate(
      user: User,
      objectName: string,
      recordId: string,
      oldData: any,
      newData: any,
      metadata?: AuditMetadata
    ): Promise<void> {
      const changes = this.calculateChanges(oldData, newData);
      
      if (changes.length === 0) {
        return; // 没有实际变更
      }
      
      const event: AuditEvent = {
        id: generateId(),
        timestamp: new Date(),
        userId: user.id,
        userName: user.name,
        action: 'UPDATE',
        objectName,
        recordId,
        changes,
        metadata: metadata || {}
      };
      
      await this.objectQL.insert('_audit_log', event);
      this.eventBus.emit('audit.logged', event);
    }
    
    private calculateChanges(oldData: any, newData: any): Change[] {
      const changes: Change[] = [];
      
      for (const field in newData) {
        if (oldData[field] !== newData[field]) {
          changes.push({
            field,
            oldValue: oldData[field],
            newValue: newData[field]
          });
        }
      }
      
      return changes;
    }
  }
  ```

**交付物**:
- `AuditLogger` 完整实现
- 变更计算逻辑
- 事件发布集成

##### 第4-5天: 集成到 CRUD 操作

**任务**:
- [ ] 在 ObjectOS 中集成审计日志
  ```typescript
  // packages/kernel/src/objectos.ts
  async insert(objectName: string, data: any): Promise<any> {
    // 1. 权限检查
    if (!await this.permissions.canCreate(this.currentUser, objectName)) {
      throw new ForbiddenError();
    }
    
    // 2. 执行插入
    const result = await super.insert(objectName, data);
    
    // 3. 记录审计日志
    await this.auditLogger.logCreate(
      this.currentUser,
      objectName,
      result.id,
      data,
      {
        ip: this.context.ip,
        userAgent: this.context.userAgent,
        requestId: this.context.requestId
      }
    );
    
    return result;
  }
  
  async update(
    objectName: string,
    id: string,
    data: any
  ): Promise<any> {
    // 1. 获取旧数据
    const oldData = await this.findOne(objectName, id);
    if (!oldData) {
      throw new NotFoundError();
    }
    
    // 2. 权限检查
    if (!await this.permissions.canEdit(this.currentUser, objectName, id)) {
      throw new ForbiddenError();
    }
    
    // 3. 执行更新
    const result = await super.update(objectName, id, data);
    
    // 4. 记录审计日志
    await this.auditLogger.logUpdate(
      this.currentUser,
      objectName,
      id,
      oldData,
      result,
      {
        ip: this.context.ip,
        userAgent: this.context.userAgent,
        requestId: this.context.requestId
      }
    );
    
    return result;
  }
  ```

**交付物**:
- 审计日志集成到所有 CRUD 操作
- 集成测试

#### Week 4: 审计查询和归档

##### 第1-2天: 审计日志查询 API

**位置**: `packages/kernel/src/audit/audit-query.ts`

**任务**:
- [ ] 实现审计日志查询服务
  ```typescript
  export class AuditQueryService {
    async queryAuditLogs(options: AuditQueryOptions): Promise<AuditEvent[]> {
      const filters: FilterGroup = {
        AND: []
      };
      
      if (options.userId) {
        filters.AND.push({ userId: options.userId });
      }
      
      if (options.objectName) {
        filters.AND.push({ objectName: options.objectName });
      }
      
      if (options.recordId) {
        filters.AND.push({ recordId: options.recordId });
      }
      
      if (options.action) {
        filters.AND.push({ action: options.action });
      }
      
      if (options.startDate) {
        filters.AND.push({ timestamp: { $gte: options.startDate } });
      }
      
      if (options.endDate) {
        filters.AND.push({ timestamp: { $lte: options.endDate } });
      }
      
      return this.objectQL.find('_audit_log', {
        filters,
        sort: [{ field: 'timestamp', order: 'DESC' }],
        limit: options.limit || 100,
        skip: options.skip || 0
      });
    }
    
    async getRecordHistory(
      objectName: string,
      recordId: string
    ): Promise<AuditEvent[]> {
      return this.queryAuditLogs({
        objectName,
        recordId,
        limit: 1000
      });
    }
    
    async getFieldHistory(
      objectName: string,
      recordId: string,
      fieldName: string
    ): Promise<Change[]> {
      const events = await this.getRecordHistory(objectName, recordId);
      
      const fieldChanges: Change[] = [];
      for (const event of events) {
        const change = event.changes?.find(c => c.field === fieldName);
        if (change) {
          fieldChanges.push({
            ...change,
            timestamp: event.timestamp,
            userName: event.userName
          });
        }
      }
      
      return fieldChanges;
    }
  }
  ```

- [ ] 添加 REST API 端点
  ```typescript
  // packages/server/src/audit/audit.controller.ts
  @Controller('api/audit')
  export class AuditController {
    @Get('logs')
    async queryLogs(@Query() query: AuditQueryDto) {
      return this.auditQueryService.queryAuditLogs(query);
    }
    
    @Get('records/:object/:id')
    async getRecordHistory(
      @Param('object') objectName: string,
      @Param('id') recordId: string
    ) {
      return this.auditQueryService.getRecordHistory(objectName, recordId);
    }
    
    @Get('fields/:object/:id/:field')
    async getFieldHistory(
      @Param('object') objectName: string,
      @Param('id') recordId: string,
      @Param('field') fieldName: string
    ) {
      return this.auditQueryService.getFieldHistory(
        objectName,
        recordId,
        fieldName
      );
    }
  }
  ```

**交付物**:
- `AuditQueryService` 实现
- REST API 端点
- API 文档

##### 第3-4天: 审计日志归档

**位置**: `packages/kernel/src/audit/audit-archiver.ts`

**任务**:
- [ ] 实现归档服务
  ```typescript
  export class AuditArchiver {
    async archiveOldLogs(daysToKeep: number = 90): Promise<number> {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      // 1. 查询需要归档的日志
      const logsToArchive = await this.objectQL.find('_audit_log', {
        filters: {
          timestamp: { $lt: cutoffDate }
        },
        limit: 10000 // 批量处理
      });
      
      if (logsToArchive.length === 0) {
        return 0;
      }
      
      // 2. 导出到归档存储
      await this.exportToArchive(logsToArchive);
      
      // 3. 删除已归档的日志
      const ids = logsToArchive.map(log => log.id);
      await this.objectQL.delete('_audit_log', {
        filters: { id: { $in: ids } }
      });
      
      return logsToArchive.length;
    }
    
    private async exportToArchive(logs: AuditEvent[]): Promise<void> {
      // 导出为 JSON Lines 格式
      const jsonl = logs.map(log => JSON.stringify(log)).join('\n');
      
      // 上传到 S3 或本地文件系统
      const filename = `audit_archive_${new Date().toISOString()}.jsonl`;
      await this.storage.upload(filename, jsonl);
    }
  }
  ```

- [ ] 添加定时任务
  ```typescript
  // packages/kernel/src/scheduler/jobs/audit-archiver-job.ts
  export class AuditArchiverJob {
    schedule = '0 2 * * *'; // 每天凌晨2点
    
    async execute(): Promise<void> {
      const archiver = new AuditArchiver();
      const count = await archiver.archiveOldLogs(90);
      logger.info(`Archived ${count} audit logs`);
    }
  }
  ```

**交付物**:
- `AuditArchiver` 实现
- 定时任务配置
- 归档策略文档

##### 第5天: 审计日志测试

**任务**:
- [ ] 审计日志记录测试
- [ ] 审计日志查询测试
- [ ] 审计日志归档测试
- [ ] 性能测试（100k+ 日志）

**交付物**:
- 30+ 审计系统单元测试
- 集成测试
- 性能测试报告

---

### Week 5-6: 关系支持 (2周)

#### Week 5: Lookup 和 Master-Detail

##### 第1-2天: Lookup 字段完善

**任务**:
- [ ] 完善 Lookup 字段定义
  ```yaml
  # objects/contact.yml
  fields:
    account:
      type: lookup
      reference_to: accounts
      label: Account
      required: false
      on_delete: SET_NULL  # 删除账户时，联系人的 account 字段设为 null
  ```

- [ ] 实现 Lookup 字段验证
  ```typescript
  export class LookupValidator {
    async validate(
      objectName: string,
      fieldName: string,
      value: string
    ): Promise<void> {
      const field = await this.getField(objectName, fieldName);
      
      if (field.type !== 'lookup') {
        throw new ValidationError('Not a lookup field');
      }
      
      // 检查引用记录是否存在
      const referencedObject = field.reference_to;
      const record = await this.objectQL.findOne(referencedObject, value);
      
      if (!record) {
        throw new ValidationError(
          `Referenced ${referencedObject} record not found: ${value}`
        );
      }
    }
  }
  ```

- [ ] 实现 Lookup 查询优化
  ```typescript
  async find(objectName: string, options: FindOptions): Promise<any[]> {
    // 检测是否需要 populate lookup 字段
    const fieldsToPopulate = this.detectLookupFields(
      objectName,
      options.fields
    );
    
    // 执行查询
    const results = await super.find(objectName, options);
    
    // Populate lookup 字段
    if (fieldsToPopulate.length > 0) {
      await this.populateLookupFields(results, fieldsToPopulate);
    }
    
    return results;
  }
  ```

**交付物**:
- Lookup 字段验证
- Lookup 字段 populate
- 单元测试

##### 第3-4天: Master-Detail 关系

**任务**:
- [ ] 定义 Master-Detail 字段类型
  ```yaml
  # objects/order_item.yml
  fields:
    order:
      type: master_detail
      reference_to: orders
      label: Order
      required: true
      cascade_delete: true  # 删除订单时，同时删除订单项
  ```

- [ ] 实现级联删除
  ```typescript
  export class CascadeDeleteHandler {
    async handleCascadeDelete(
      objectName: string,
      recordId: string
    ): Promise<void> {
      // 1. 找到所有引用此记录的 master-detail 字段
      const dependentObjects = await this.findDependentObjects(
        objectName,
        recordId
      );
      
      // 2. 递归删除依赖记录
      for (const { objectName: depObj, fieldName, records } of dependentObjects) {
        for (const record of records) {
          await this.objectQL.delete(depObj, record.id);
        }
      }
    }
    
    private async findDependentObjects(
      objectName: string,
      recordId: string
    ): Promise<DependentObject[]> {
      const allObjects = await this.objectQL.getAllObjects();
      const dependent: DependentObject[] = [];
      
      for (const obj of allObjects) {
        for (const field of obj.fields) {
          if (
            field.type === 'master_detail' &&
            field.reference_to === objectName &&
            field.cascade_delete
          ) {
            const records = await this.objectQL.find(obj.name, {
              filters: { [field.name]: recordId }
            });
            
            if (records.length > 0) {
              dependent.push({
                objectName: obj.name,
                fieldName: field.name,
                records
              });
            }
          }
        }
      }
      
      return dependent;
    }
  }
  ```

- [ ] 集成到删除操作
  ```typescript
  async delete(objectName: string, id: string): Promise<void> {
    // 1. 权限检查
    if (!await this.permissions.canDelete(this.currentUser, objectName, id)) {
      throw new ForbiddenError();
    }
    
    // 2. 处理级联删除
    await this.cascadeDeleteHandler.handleCascadeDelete(objectName, id);
    
    // 3. 删除记录
    await super.delete(objectName, id);
    
    // 4. 记录审计日志
    await this.auditLogger.logDelete(this.currentUser, objectName, id);
  }
  ```

**交付物**:
- Master-Detail 字段支持
- 级联删除实现
- 单元测试

##### 第5天: 关系查询优化

**任务**:
- [ ] 实现 N+1 查询优化
  ```typescript
  export class RelationshipQueryOptimizer {
    async optimizeQuery(
      objectName: string,
      options: FindOptions
    ): Promise<FindOptions> {
      const lookupFields = this.detectLookupFields(objectName, options.fields);
      
      if (lookupFields.length === 0) {
        return options;
      }
      
      // 构建 JOIN 查询（SQL）或 $lookup 聚合（MongoDB）
      const optimized = this.buildJoinQuery(objectName, lookupFields, options);
      
      return optimized;
    }
  }
  ```

**交付物**:
- 查询优化实现
- 性能基准测试

#### Week 6: Many-to-Many 关系

##### 第1-3天: Many-to-Many 实现

**任务**:
- [ ] 定义 Many-to-Many 字段
  ```yaml
  # objects/user.yml
  fields:
    groups:
      type: many_to_many
      reference_to: groups
      junction_object: user_group_junction
      label: Groups
  ```

- [ ] 自动生成连接表
  ```typescript
  export class JunctionTableGenerator {
    async generateJunctionTable(
      sourceObject: string,
      targetObject: string,
      fieldName: string
    ): Promise<ObjectConfig> {
      const junctionName = `${sourceObject}_${targetObject}_junction`;
      
      return {
        name: junctionName,
        label: `${sourceObject} - ${targetObject}`,
        fields: {
          id: { type: 'autonumber', label: 'ID' },
          [sourceObject]: {
            type: 'lookup',
            reference_to: sourceObject,
            required: true
          },
          [targetObject]: {
            type: 'lookup',
            reference_to: targetObject,
            required: true
          },
          created_at: { type: 'datetime', label: 'Created At' },
          created_by: { type: 'lookup', reference_to: 'users' }
        },
        indexes: [
          {
            fields: [sourceObject, targetObject],
            unique: true
          }
        ]
      };
    }
  }
  ```

- [ ] 实现 Many-to-Many 查询
  ```typescript
  export class ManyToManyQuery {
    async findRelated(
      sourceObject: string,
      sourceId: string,
      fieldName: string
    ): Promise<any[]> {
      const field = await this.getField(sourceObject, fieldName);
      const junctionObject = field.junction_object;
      const targetObject = field.reference_to;
      
      // 1. 查询连接表
      const junctionRecords = await this.objectQL.find(junctionObject, {
        filters: { [sourceObject]: sourceId }
      });
      
      // 2. 提取目标 ID
      const targetIds = junctionRecords.map(r => r[targetObject]);
      
      // 3. 查询目标记录
      if (targetIds.length === 0) {
        return [];
      }
      
      return this.objectQL.find(targetObject, {
        filters: { id: { $in: targetIds } }
      });
    }
    
    async addRelation(
      sourceObject: string,
      sourceId: string,
      fieldName: string,
      targetId: string
    ): Promise<void> {
      const field = await this.getField(sourceObject, fieldName);
      const junctionObject = field.junction_object;
      const targetObject = field.reference_to;
      
      // 检查关系是否已存在
      const existing = await this.objectQL.findOne(junctionObject, {
        filters: {
          [sourceObject]: sourceId,
          [targetObject]: targetId
        }
      });
      
      if (existing) {
        return; // 已存在
      }
      
      // 创建连接记录
      await this.objectQL.insert(junctionObject, {
        [sourceObject]: sourceId,
        [targetObject]: targetId,
        created_at: new Date(),
        created_by: this.currentUser.id
      });
    }
  }
  ```

**交付物**:
- Many-to-Many 字段支持
- 连接表自动生成
- 关系查询和管理

##### 第4-5天: 关系系统测试

**任务**:
- [ ] Lookup 字段测试
- [ ] Master-Detail 测试（包括级联删除）
- [ ] Many-to-Many 测试
- [ ] 关系查询性能测试

**交付物**:
- 50+ 关系系统单元测试
- 集成测试
- 性能测试报告

---

### Week 7-8: NestJS 服务器完善 (2周)

#### Week 7: REST CRUD 端点

##### 第1-3天: CRUD 端点实现

**位置**: `packages/server/src/data/data.controller.ts`

**任务**:
- [ ] 实现完整的 REST CRUD 端点
  ```typescript
  @Controller('api/data/:object')
  export class DataController {
    constructor(private objectOS: ObjectOS) {}
    
    @Post('query')
    @UseGuards(AuthGuard)
    async query(
      @Param('object') objectName: string,
      @Body() body: QueryDTO,
      @CurrentUser() user: User
    ) {
      this.objectOS.setCurrentUser(user);
      
      return this.objectOS.find(objectName, {
        filters: body.filters,
        fields: body.fields,
        sort: body.sort,
        limit: body.limit,
        skip: body.skip
      });
    }
    
    @Get(':id')
    @UseGuards(AuthGuard)
    async findOne(
      @Param('object') objectName: string,
      @Param('id') id: string,
      @CurrentUser() user: User
    ) {
      this.objectOS.setCurrentUser(user);
      return this.objectOS.findOne(objectName, id);
    }
    
    @Post()
    @UseGuards(AuthGuard)
    async create(
      @Param('object') objectName: string,
      @Body() data: any,
      @CurrentUser() user: User
    ) {
      this.objectOS.setCurrentUser(user);
      return this.objectOS.insert(objectName, data);
    }
    
    @Patch(':id')
    @UseGuards(AuthGuard)
    async update(
      @Param('object') objectName: string,
      @Param('id') id: string,
      @Body() data: any,
      @CurrentUser() user: User
    ) {
      this.objectOS.setCurrentUser(user);
      return this.objectOS.update(objectName, id, data);
    }
    
    @Delete(':id')
    @UseGuards(AuthGuard)
    async delete(
      @Param('object') objectName: string,
      @Param('id') id: string,
      @CurrentUser() user: User
    ) {
      this.objectOS.setCurrentUser(user);
      await this.objectOS.delete(objectName, id);
      return { success: true };
    }
  }
  ```

- [ ] 添加批量操作端点
  ```typescript
  @Post('batch')
  @UseGuards(AuthGuard)
  async batchCreate(
    @Param('object') objectName: string,
    @Body() body: { records: any[] },
    @CurrentUser() user: User
  ) {
    this.objectOS.setCurrentUser(user);
    
    const results = [];
    for (const record of body.records) {
      try {
        const result = await this.objectOS.insert(objectName, record);
        results.push({ success: true, id: result.id });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  }
  ```

**交付物**:
- 完整的 CRUD 端点
- 批量操作端点
- API 文档

##### 第4-5天: 中间件集成

**任务**:
- [ ] 集成 Kernel 中间件到 NestJS
  ```typescript
  // packages/server/src/middleware/kernel-middleware.adapter.ts
  export function adaptKernelMiddleware(
    kernelMiddleware: KernelMiddleware
  ): NestMiddleware {
    return {
      use(req: Request, res: Response, next: NextFunction) {
        const context = {
          request: {
            method: req.method,
            path: req.path,
            headers: req.headers,
            query: req.query,
            body: req.body
          },
          response: res,
          user: req.user
        };
        
        kernelMiddleware(context, next);
      }
    };
  }
  ```

- [ ] 应用中间件
  ```typescript
  // packages/server/src/app.module.ts
  export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
      consumer
        .apply(
          adaptKernelMiddleware(createLoggingMiddleware()),
          adaptKernelMiddleware(createCorsMiddleware()),
          adaptKernelMiddleware(createRateLimitMiddleware())
        )
        .forRoutes('*');
    }
  }
  ```

**交付物**:
- 中间件适配器
- 中间件集成
- 测试

#### Week 8: E2E 测试和文档

##### 第1-3天: E2E 测试

**位置**: `packages/server/test/e2e/`

**任务**:
- [ ] 实现 E2E 测试套件
  ```typescript
  describe('Data API (e2e)', () => {
    let app: INestApplication;
    let authToken: string;
    
    beforeAll(async () => {
      const moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      
      app = moduleFixture.createNestApplication();
      await app.init();
      
      // 登录获取 token
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password' });
      
      authToken = response.body.token;
    });
    
    it('POST /api/data/contacts - create contact', () => {
      return request(app.getHttpServer())
        .post('/api/data/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com'
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.first_name).toBe('John');
        });
    });
    
    it('POST /api/data/contacts/query - query contacts', () => {
      return request(app.getHttpServer())
        .post('/api/data/contacts/query')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          filters: {
            last_name: 'Doe'
          },
          fields: ['id', 'first_name', 'last_name'],
          limit: 10
        })
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
    
    // 更多测试...
  });
  ```

- [ ] 权限测试
  ```typescript
  describe('Permissions (e2e)', () => {
    it('should deny access without permission', () => {
      return request(app.getHttpServer())
        .delete('/api/data/contacts/123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
    
    it('should filter invisible fields', () => {
      return request(app.getHttpServer())
        .get('/api/data/contacts/123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body).not.toHaveProperty('salary');
        });
    });
  });
  ```

**交付物**:
- 50+ E2E 测试
- 权限系统 E2E 测试
- 审计日志 E2E 测试

##### 第4-5天: API 文档和示例

**任务**:
- [ ] 生成 OpenAPI 文档
  ```typescript
  // packages/server/src/main.ts
  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    const config = new DocumentBuilder()
      .setTitle('ObjectOS API')
      .setDescription('The ObjectOS API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    
    await app.listen(3000);
  }
  ```

- [ ] 编写 API 使用示例
  ```markdown
  # ObjectOS API Examples
  
  ## Authentication
  
  ​```bash
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@example.com", "password": "password"}'
  ​```
  
  ## Create a Contact
  
  ​```bash
  curl -X POST http://localhost:3000/api/data/contacts \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"first_name": "John", "last_name": "Doe"}'
  ​```
  
  ## Query Contacts
  
  ​```bash
  curl -X POST http://localhost:3000/api/data/contacts/query \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "filters": {"last_name": "Doe"},
      "fields": ["id", "first_name", "last_name"],
      "limit": 10
    }'
  ​```
  ```

**交付物**:
- OpenAPI 文档
- API 使用指南
- 示例代码

---

### Week 9-10: 测试覆盖率提升 (2周)

#### Week 9: 单元测试补充

##### 每天任务

**任务**:
- [ ] 审查现有测试覆盖率
  ```bash
  pnpm test --coverage
  ```

- [ ] 识别未覆盖的代码路径
- [ ] 补充单元测试
  - 内核核心逻辑
  - 权限系统
  - 审计日志
  - 关系支持
  - API 端点

**目标**:
- 内核测试覆盖率: 90%+
- 服务器测试覆盖率: 80%+

**交付物**:
- 100+ 新增单元测试
- 覆盖率报告

#### Week 10: 集成测试和性能测试

##### 第1-3天: 集成测试

**任务**:
- [ ] 权限系统集成测试
- [ ] 审计日志集成测试
- [ ] 关系查询集成测试
- [ ] 端到端流程测试

**交付物**:
- 30+ 集成测试

##### 第4-5天: 性能测试

**任务**:
- [ ] 设置性能基准
  ```typescript
  describe('Performance Benchmarks', () => {
    it('should handle 1000 queries per second', async () => {
      const startTime = Date.now();
      const promises = [];
      
      for (let i = 0; i < 1000; i++) {
        promises.push(objectOS.find('contacts', { limit: 10 }));
      }
      
      await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // < 1秒
    });
  });
  ```

- [ ] 查询性能测试
- [ ] 大数据量测试（100k+ 记录）
- [ ] 并发测试（1000+ 并发请求）

**交付物**:
- 性能测试套件
- 性能报告
- 优化建议

---

### Week 11-12: 文档和发布准备 (2周)

#### Week 11: 文档编写

##### 第1-5天: 完整文档

**任务**:
- [ ] **权限系统文档**
  - 对象级权限配置
  - 字段级权限配置
  - 记录级安全规则
  - 示例和最佳实践

- [ ] **审计日志文档**
  - 审计事件格式
  - 查询审计日志
  - 归档策略
  - 合规性指南

- [ ] **关系系统文档**
  - Lookup 字段配置
  - Master-Detail 关系
  - Many-to-Many 关系
  - 关系查询示例

- [ ] **API 参考文档**
  - 完整的 REST API 参考
  - 请求/响应示例
  - 错误代码
  - 认证和授权

- [ ] **开发者指南**
  - 快速开始
  - 核心概念
  - 高级主题
  - 故障排除

**交付物**:
- 50+ 页文档
- 20+ 代码示例
- API 参考

#### Week 12: 发布准备

##### 第1-3天: 代码审查和重构

**任务**:
- [ ] 代码审查
- [ ] 性能优化
- [ ] 代码质量改进
- [ ] 依赖更新

##### 第4-5天: 发布

**任务**:
- [ ] 版本号更新
  ```json
  {
    "version": "0.5.0"
  }
  ```

- [ ] 生成 CHANGELOG
  ```markdown
  # Changelog
  
  ## [0.5.0] - 2026-03-31
  
  ### Added
  - Complete permission system (object, field, record level)
  - Audit logging system
  - Full relationship support (Lookup, Master-Detail, Many-to-Many)
  - REST CRUD endpoints
  - E2E test suite
  
  ### Changed
  - Improved test coverage to 85%+
  - Performance optimizations
  
  ### Fixed
  - Various bug fixes
  ```

- [ ] 发布到 npm
  ```bash
  pnpm publish --access public
  ```

- [ ] 创建 GitHub Release
- [ ] 更新文档网站

**交付物**:
- v0.5.0 发布
- Release Notes
- 更新的文档

---

## 🛠️ 技术规范

### 代码标准

1. **TypeScript**
   - 使用严格模式
   - 100% 类型覆盖
   - ESLint 检查通过

2. **测试**
   - Jest 测试框架
   - 单元测试优先
   - 测试覆盖率 > 85%

3. **文档**
   - JSDoc 注释
   - Markdown 文档
   - 代码示例

### 依赖管理

- **包管理器**: pnpm
- **版本控制**: Semantic Versioning
- **依赖审计**: 定期运行 `pnpm audit`

### CI/CD

- **持续集成**: GitHub Actions
- **自动化测试**: 每次提交
- **代码覆盖率**: Codecov
- **发布**: Changesets

---

## 🔍 质量保证

### 代码审查检查清单

- [ ] 符合 TypeScript 标准
- [ ] 有完整的单元测试
- [ ] 测试覆盖率达标
- [ ] 有 JSDoc 注释
- [ ] 无 ESLint 错误
- [ ] 性能符合要求
- [ ] 安全性审查通过

### 测试策略

1. **单元测试** (90%+ 覆盖率)
   - 所有公共 API
   - 边界条件
   - 错误处理

2. **集成测试** (70%+ 覆盖率)
   - 组件间交互
   - 数据流
   - 事务处理

3. **E2E 测试**
   - 关键用户流程
   - API 端点
   - 权限检查

4. **性能测试**
   - 基准测试
   - 负载测试
   - 压力测试

---

## ⚠️ 风险管理

### 识别的风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| **权限系统复杂度** | 高 | 中 | 分阶段实现，充分测试 |
| **性能问题** | 高 | 中 | 早期性能测试，优化查询 |
| **数据库兼容性** | 中 | 低 | 通过 ObjectQL 抽象，多数据库测试 |
| **测试覆盖率不足** | 中 | 中 | TDD 方法，持续监控覆盖率 |
| **文档不完整** | 低 | 中 | 专人负责，持续更新 |

### 应急计划

- **延期风险**: 优先实现核心功能，次要功能推迟
- **人员不足**: 寻求社区贡献，外包非核心任务
- **技术难题**: 咨询专家，技术研究时间

---

## 📊 进度跟踪

### 每周报告

- 完成的任务
- 遇到的问题
- 解决方案
- 下周计划

### 里程碑

- **Week 2**: 权限系统基础完成
- **Week 4**: 审计日志完成
- **Week 6**: 关系支持完成
- **Week 8**: NestJS 服务器完成
- **Week 10**: 测试覆盖率达标
- **Week 12**: v0.5.0 发布

---

## 🎯 成功标准

### Q1 结束时的目标

1. **功能完整性**
   - ✅ 权限系统（对象、字段、记录级）
   - ✅ 审计日志系统
   - ✅ 关系支持（Lookup、Master-Detail、Many-to-Many）
   - ✅ REST CRUD API

2. **质量指标**
   - ✅ 测试覆盖率 > 85%
   - ✅ 所有 E2E 测试通过
   - ✅ 性能基准达标

3. **文档**
   - ✅ 完整的 API 参考
   - ✅ 开发者指南
   - ✅ 示例代码

4. **规范符合性**
   - ✅ ObjectStack spec 符合度 > 70%

---

## 📚 参考资源

- [ObjectStack Spec](https://github.com/objectstack-ai/spec)
- [ObjectQL](https://github.com/objectql/objectql)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Jest Documentation](https://jestjs.io/)

---

**计划版本**: 1.0  
**创建日期**: 2026-01-29  
**负责人**: ObjectOS 核心团队  
**审批人**: 技术负责人
