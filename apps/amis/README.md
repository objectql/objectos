# ObjectOS AMIS Application

这是一个使用 [AMIS](https://aisuda.bce.baidu.com/amis) 低代码框架实现的 ObjectOS 前端应用。

## 🚀 快速开始

### 运行开发服务器

在项目根目录运行：

```bash
pnpm run dev:amis
```

这将同时启动：
- **ObjectOS 服务器**: http://localhost:3000 (后端 API)
- **AMIS 前端应用**: http://localhost:5174 (开发界面)

访问 http://localhost:5174 即可使用应用。

### 默认登录

使用以下凭据登录（需要先在 ObjectOS 中创建用户）：

```
Email: your@email.com
Password: yourpassword
```

## ✨ 特性

- 🎨 **低代码开发**: 使用 AMIS 框架，通过 JSON Schema 快速构建界面
- 📊 **自动表格生成**: 根据对象元数据自动生成 CRUD 表格
- 📝 **自动表单生成**: 根据字段定义自动生成创建/编辑表单
- 🔐 **身份认证**: 集成 Better-Auth 认证系统
- 🎯 **元数据驱动**: 从 ObjectOS 服务器动态获取对象元数据
- 🌍 **国际化**: 支持中文界面（可扩展其他语言）
- 📱 **响应式设计**: 支持桌面和移动设备

## 📖 功能说明

### 主页 - 对象列表

应用启动后显示系统中所有可用的对象：

- 对象名称和标签
- 对象图标
- 对象描述
- 点击进入对象的 CRUD 界面

### 对象 CRUD 页面

每个对象都有自动生成的完整 CRUD 功能：

**表格视图:**
- ✓ 数据列表展示
- ✓ 分页（10/20/50/100 条/页）
- ✓ 排序
- ✓ 筛选器
- ✓ 批量选择和操作
- ✓ 导出功能
- ✓ Lookup 字段显示关联对象名称

**表单功能:**
- ✓ 新建记录（模态对话框）
- ✓ 编辑记录（模态对话框）
- ✓ 字段验证
- ✓ 必填字段提示
- ✓ 关联对象选择器（增强的 Lookup 组件）

**Lookup 组件特性:**
- ✓ 可搜索的下拉选择
- ✓ 支持创建新关联记录
- ✓ 多选支持（多对多关系）
- ✓ 过滤选项
- ✓ 自定义显示字段
- ✓ Master-Detail 关系支持

详见 [LOOKUP_GUIDE.md](./LOOKUP_GUIDE.md)

**操作:**
- ✓ 创建 - "新建" 按钮
- ✓ 编辑 - 行操作 "编辑"
- ✓ 删除 - 行操作 "删除"（带确认）
- ✓ 批量删除

## 🏗️ 架构

```
apps/amis/
├── src/
│   ├── components/       # React 组件
│   │   └── AmisRenderer.tsx   # AMIS 渲染器组件
│   ├── context/         # React Context
│   │   └── AuthContext.tsx    # 认证上下文
│   ├── lib/            # 工具库
│   │   └── auth.ts            # 认证客户端
│   ├── pages/          # 页面组件
│   │   ├── Home.tsx           # 首页 - 对象列表
│   │   ├── Login.tsx          # 登录页
│   │   └── ObjectPage.tsx     # 对象详情页 - CRUD 操作
│   ├── types/          # TypeScript 类型定义
│   ├── utils/          # 工具函数
│   │   ├── api.ts             # API 客户端
│   │   └── schemaBuilder.ts   # AMIS Schema 构建器
│   ├── App.tsx         # 应用主组件
│   ├── main.tsx        # 应用入口
│   └── index.css       # 全局样式
├── IMPLEMENTATION.md   # 详细实现文档
└── README.md          # 本文件
```

## 🔧 构建生产版本

```bash
cd apps/amis
pnpm run build
```

构建输出在 `dist/` 目录。

## 🧪 测试

运行测试套件：

```bash
cd apps/amis
pnpm test              # 运行所有测试
pnpm test:ui          # 使用 UI 界面运行测试
pnpm test:coverage    # 运行测试并生成覆盖率报告
```

测试包括：
- ✅ 30+ 单元测试 (schemaBuilder, API client, components)
- ✅ 5 组件测试 (AmisRenderer, ObjectPage)
- ✅ 6 集成测试 (完整页面流程)

详细信息请参考 [TESTING.md](./TESTING.md)

## 📚 API 集成

应用依赖以下 ObjectOS API 端点：

### 元数据端点
```
GET /api/metadata/objects          # 获取所有对象列表
GET /api/metadata/:objectName      # 获取对象元数据
```

### 数据端点
```
POST /api/data/:objectName/query   # 查询记录
POST /api/data/:objectName         # 创建记录
PATCH /api/data/:objectName/:id    # 更新记录
DELETE /api/data/:objectName/:id   # 删除记录
```

## 🎨 字段类型映射

### 表单字段

| ObjectQL 类型 | AMIS 类型 |
|--------------|-----------|
| text | input-text |
| textarea | textarea |
| email | input-email |
| number | input-number |
| currency | input-number |
| select | select |
| multiselect | multi-select |
| date | input-date |
| datetime | input-datetime |
| checkbox | checkbox |
| lookup | select |

详细说明请参考 [IMPLEMENTATION.md](./IMPLEMENTATION.md)

## 🛠️ 自定义配置

### 修改主题

在 `src/components/AmisRenderer.tsx` 中修改 CSS 导入：

```typescript
// 使用 cxd 主题（默认）
import 'amis/lib/themes/cxd.css';

// 或使用其他主题
// import 'amis/lib/themes/antd.css';
// import 'amis/lib/themes/dark.css';
```

可用主题: `cxd`, `antd`, `dark`

### 扩展字段类型

在 `src/utils/schemaBuilder.ts` 中的类型映射函数中添加新的字段类型支持。

## 📖 文档

- [详细实现文档](./IMPLEMENTATION.md) - 架构、工作原理、自定义指南
- [Lookup 组件指南](./LOOKUP_GUIDE.md) - 关联字段完整使用指南
- [AMIS 官方文档](https://aisuda.bce.baidu.com/amis/zh-CN/docs/index)
- [ObjectOS 文档](https://github.com/objectql/objectos)

## 🆚 对比 apps/web

| 特性 | apps/web | apps/amis |
|------|----------|-----------|
| UI 框架 | React + AG Grid | React + AMIS |
| 开发方式 | 组件化编程 | Schema 配置 |
| 代码量 | ~5000 行 | ~1500 行 |
| 定制性 | 高 | 中-高 |
| 打包大小 | ~500KB | ~2.5MB |
| 移动端支持 | 有限 | 良好 |
| 学习曲线 | React 专业知识 | AMIS Schema 知识 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT

