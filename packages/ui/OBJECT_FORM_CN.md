# ObjectForm - 元数据驱动的表单组件

## 概述

`ObjectForm` 是一个强大的、元数据驱动的表单组件，它可以根据 ObjectQL 对象元数据 (`ObjectConfig`) 自动生成表单字段。这个组件消除了为每个属性手动创建表单字段的需要，并根据字段配置自动处理验证。

## 特性

- **自动字段生成**：表单字段从 `ObjectConfig.fields` 自动生成
- **类型感知验证**：每种字段类型都有适当的验证规则
- **内置验证**：
  - 必填字段
  - 数字的最小/最大值
  - 文本的最小/最大长度
  - 邮箱和URL格式验证
  - 自定义正则表达式模式
- **智能布局**：自动确定字段宽度（textarea、markdown等使用全宽）
- **React Hook Form 集成**：基于 react-hook-form 构建，实现强大的表单管理
- **TypeScript 支持**：与 ObjectQL 类型完全类型安全
- **灵活配置**：自定义列数、按钮文本等

## 安装

该组件是 `@objectos/ui` 包的一部分：

```bash
npm install @objectos/ui
```

## 基本用法

```tsx
import { ObjectForm } from '@objectos/ui';
import type { ObjectConfig } from '@objectql/types';

// 定义对象元数据
const userConfig: ObjectConfig = {
  name: 'user',
  label: '用户',
  fields: {
    name: {
      name: 'name',
      label: '姓名',
      type: 'text',
      required: true,
      max_length: 100,
    },
    email: {
      name: 'email',
      label: '邮箱',
      type: 'email',
      required: true,
    },
    bio: {
      name: 'bio',
      label: '个人简介',
      type: 'textarea',
      max_length: 500,
    },
    is_active: {
      name: 'is_active',
      label: '激活状态',
      type: 'boolean',
      defaultValue: true,
    },
  },
};

function UserForm() {
  const handleSubmit = async (data: Record<string, any>) => {
    // 提交到 API
    await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  return (
    <ObjectForm
      objectConfig={userConfig}
      onSubmit={handleSubmit}
      submitText="创建用户"
    />
  );
}
```

## 组件属性

### ObjectFormProps

| 属性 | 类型 | 默认值 | 描述 |
|------|------|---------|-------------|
| `objectConfig` | `ObjectConfig` | **必需** | 对象元数据配置 |
| `onSubmit` | `(data: Record<string, any>) => void \| Promise<void>` | **必需** | 表单提交时的回调 |
| `initialValues` | `Record<string, any>` | `{}` | 初始表单值（用于编辑） |
| `onCancel` | `() => void` | - | 取消按钮点击时的回调 |
| `isSubmitting` | `boolean` | `false` | 表单是否处于提交状态 |
| `submitText` | `string` | `'Save'` | 提交按钮文本 |
| `cancelText` | `string` | `'Cancel'` | 取消按钮文本 |
| `hideCancelButton` | `boolean` | `false` | 隐藏取消按钮 |
| `className` | `string` | - | 额外的 CSS 类 |
| `columns` | `1 \| 2` | `2` | 表单网格的列数 |
| `formRef` | `React.MutableRefObject<UseFormReturn \| null>` | - | 访问表单方法的引用 |

## 支持的字段类型

支持所有 ObjectQL 字段类型，并使用适当的输入组件：

### 文本字段

```tsx
{
  name: { type: 'text', label: '姓名', max_length: 100 },
  email: { type: 'email', label: '邮箱' },
  phone: { type: 'phone', label: '电话' },
  url: { type: 'url', label: '网站' },
  password: { type: 'password', label: '密码' },
}
```

### 文本域字段

```tsx
{
  description: { 
    type: 'textarea', 
    label: '描述',
    max_length: 500,
  },
}
```

### 布尔字段

```tsx
{
  is_active: { 
    type: 'boolean', 
    label: '激活',
    defaultValue: true,
  },
}
```

### 日期字段

```tsx
{
  birth_date: { type: 'date', label: '出生日期' },
  created_at: { type: 'datetime', label: '创建时间' },
}
```

### 数值字段

```tsx
{
  age: { 
    type: 'number', 
    label: '年龄',
    min: 0,
    max: 150,
  },
  salary: { 
    type: 'currency', 
    label: '薪资',
    min: 0,
  },
  completion: { 
    type: 'percent', 
    label: '完成度',
    min: 0,
    max: 100,
  },
}
```

### 选择字段

```tsx
{
  status: {
    type: 'select',
    label: '状态',
    required: true,
    options: [
      { label: '激活', value: 'active' },
      { label: '停用', value: 'inactive' },
    ],
  },
}
```

### 查找/关系字段

```tsx
{
  assignee: {
    type: 'lookup',
    label: '分配给',
    reference_to: 'user',
  },
}
```

## 自动验证

组件根据字段配置自动应用验证：

### 必填字段

```tsx
{
  email: {
    type: 'email',
    label: '邮箱',
    required: true,  // ← 验证是否存在
  },
}
```

### 最小/最大值

```tsx
{
  age: {
    type: 'number',
    label: '年龄',
    min: 18,    // ← 验证最小值
    max: 100,   // ← 验证最大值
  },
}
```

### 长度验证

```tsx
{
  username: {
    type: 'text',
    label: '用户名',
    min_length: 3,     // ← 最少3个字符
    max_length: 20,    // ← 最多20个字符
  },
}
```

### 模式验证

```tsx
{
  phone: {
    type: 'text',
    label: '电话',
    regex: '^\\d{3}-\\d{3}-\\d{4}$',  // ← 自定义正则
  },
}
```

### 内置格式验证

邮箱和URL字段具有自动格式验证：

```tsx
{
  email: {
    type: 'email',  // ← 自动验证邮箱格式
    label: '邮箱',
  },
  website: {
    type: 'url',    // ← 自动验证URL格式（必须以http/https开头）
    label: '网站',
  },
}
```

## 高级用法

### 编辑模式（使用初始值）

```tsx
function EditUserForm({ userId }: { userId: string }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(setUser);
  }, [userId]);

  if (!user) return <div>加载中...</div>;

  return (
    <ObjectForm
      objectConfig={userConfig}
      initialValues={user}
      onSubmit={async (data) => {
        await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      }}
      submitText="更新用户"
    />
  );
}
```

### 带加载状态

```tsx
function UserFormWithLoading() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast.success('用户创建成功！');
    } catch (error) {
      toast.error('创建用户失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ObjectForm
      objectConfig={userConfig}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
```

### 访问表单方法

```tsx
import { useObjectForm } from '@objectos/ui';

function AdvancedUserForm() {
  const { formRef, getValues, setValue, reset } = useObjectForm(userConfig);

  const handleCustomAction = () => {
    const currentValues = getValues();
    console.log('当前表单值:', currentValues);
    
    // 编程方式设置值
    setValue('status', 'active');
  };

  return (
    <>
      <button onClick={handleCustomAction}>
        获取当前值
      </button>
      
      <ObjectForm
        objectConfig={userConfig}
        formRef={formRef}
        onSubmit={async (data) => {
          await saveUser(data);
          reset(); // 成功提交后重置表单
        }}
      />
    </>
  );
}
```

### 单列布局

```tsx
<ObjectForm
  objectConfig={userConfig}
  onSubmit={handleSubmit}
  columns={1}  // 单列布局
/>
```

## 与 ObjectOS 集成

该组件设计用于与 ObjectOS 架构无缝协作：

```tsx
import { ObjectForm } from '@objectos/ui';
import type { ObjectConfig } from '@objectql/types';

function ObjectEditView({ objectName, recordId }: { objectName: string; recordId: string }) {
  const [config, setConfig] = useState<ObjectConfig | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // 获取元数据
    fetch(`/api/metadata/object/${objectName}`)
      .then(res => res.json())
      .then(setConfig);

    // 获取数据
    fetch(`/api/data/${objectName}/${recordId}`)
      .then(res => res.json())
      .then(setData);
  }, [objectName, recordId]);

  if (!config || !data) return <div>加载中...</div>;

  return (
    <ObjectForm
      objectConfig={config}
      initialValues={data}
      onSubmit={async (formData) => {
        await fetch(`/api/data/${objectName}/${recordId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }}
    />
  );
}
```

## 字段布局规则

组件自动确定字段布局：

### 全宽字段

以下字段自动占据全宽（在2列布局中）：
- `textarea`
- `markdown`
- `html`
- `grid`
- `object`

### 常规字段

其他字段类型在2列布局中使用正常列宽。

## 隐藏字段

以下字段自动隐藏：
- 系统字段：`_id`, `id`, `created_at`, `updated_at`, `created_by`, `updated_by`
- 标记为 `hidden: true` 的字段
- 只读自动生成字段：`auto_number`, `formula`, `summary`

## 最佳实践

1. **始终提供对象元数据**：组件依赖 `ObjectConfig` 来生成字段和验证
2. **处理异步提交**：使用 `isSubmitting` 状态防止重复提交
3. **编辑模式提供初始值**：通过 `initialValues` 传递现有数据
4. **使用验证规则**：在字段元数据中配置 `required`, `min`, `max` 等
5. **优雅处理错误**：在 try-catch 块中包装提交逻辑
6. **成功后重置表单**：使用 `reset()` 方法在成功提交后清除表单

## 与手动表单的比较

| 功能 | ObjectForm | 手动表单 |
|---------|-----------|-------------|
| 字段生成 | 从元数据自动生成 | 每个字段手动创建 |
| 验证 | 基于字段配置自动验证 | 手动验证逻辑 |
| 类型特定输入 | 自动 | 手动选择组件 |
| 布局 | 智能自动布局 | 手动网格设置 |
| 使用场景 | 基于对象的CRUD | 具有特定逻辑的自定义表单 |

## 示例

查看 `packages/ui/src/components/examples/ObjectFormExample.tsx` 获取包含所有字段类型的完整工作示例。

## 许可证

ObjectOS 项目的一部分。查看仓库许可证了解详情。
