# ObjectOS AMIS Application

这是一个使用 [AMIS](https://aisuda.bce.baidu.com/amis) 低代码框架实现的 ObjectOS 前端应用。

## 特性

- 🚀 **低代码开发**: 使用 AMIS 框架，通过 JSON Schema 快速构建界面
- 📊 **自动表格**: 根据对象元数据自动生成 CRUD 表格
- 📝 **自动表单**: 根据字段定义自动生成创建/编辑表单
- 🔐 **身份认证**: 集成 Better-Auth 认证系统
- 🎨 **主题支持**: 支持 AMIS 多种主题配置

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

在项目根目录运行：

```bash
pnpm run dev:amis
```

这将同时启动：
- ObjectOS 服务器 (端口 3000)
- AMIS 前端应用 (端口 5174)

访问 http://localhost:5174 查看应用。

### 构建生产版本

```bash
pnpm run build
```

## 架构说明

### 目录结构

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
├── index.html          # HTML 入口
├── package.json        # 项目配置
├── tsconfig.json       # TypeScript 配置
├── vite.config.ts      # Vite 配置
└── README.md          # 项目说明
```

### 核心功能

#### 1. 元数据驱动

应用从 ObjectOS 服务器获取对象元数据，并自动转换为 AMIS Schema：

```typescript
// 获取对象元数据
const response = await apiClient.get(`/metadata/${objectName}`);

// 转换为 AMIS Schema
const amisSchema = buildAmisCRUDSchema(objectMeta, `/api/data/${objectName}`);
```

#### 2. AMIS Schema 构建

`schemaBuilder.ts` 提供了将 ObjectQL 字段类型转换为 AMIS 组件的功能：

- 表单字段映射 (objectqlTypeToAmisFormType)
- 表格列映射 (objectqlTypeToAmisColumnType)
- CRUD Schema 构建 (buildAmisCRUDSchema)

#### 3. 认证集成

使用 Better-Auth 进行身份认证，支持：
- 邮箱/密码登录
- Session 管理
- 自动跳转

## API 端点

应用依赖以下 ObjectOS API 端点：

- `GET /api/metadata/objects` - 获取所有对象列表
- `GET /api/metadata/:objectName` - 获取对象元数据
- `POST /api/data/:objectName/query` - 查询记录
- `POST /api/data/:objectName` - 创建记录
- `PATCH /api/data/:objectName/:id` - 更新记录
- `DELETE /api/data/:objectName/:id` - 删除记录

## 字段类型映射

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

### 表格列

| ObjectQL 类型 | AMIS 类型 |
|--------------|-----------|
| text | text |
| number | number |
| currency | number |
| date | date |
| datetime | datetime |
| checkbox | status |
| url | link |

## 自定义配置

### 修改主题

在 `AmisRenderer.tsx` 中修改 CSS 导入：

```typescript
// 使用 cxd 主题
import 'amis/lib/themes/cxd.css';

// 或使用其他主题
// import 'amis/lib/themes/antd.css';
// import 'amis/lib/themes/dark.css';
```

### 自定义 Schema

在 `schemaBuilder.ts` 中修改 `buildAmisCRUDSchema` 函数以自定义生成的 AMIS Schema。

## 开发说明

### 添加新页面

1. 在 `src/pages/` 创建新组件
2. 在 `App.tsx` 中添加路由
3. 根据需要创建对应的 AMIS Schema

### 扩展字段类型

在 `schemaBuilder.ts` 中的类型映射函数中添加新的字段类型支持。

## 相关链接

- [AMIS 官方文档](https://aisuda.bce.baidu.com/amis/zh-CN/docs/index)
- [ObjectOS 文档](https://github.com/objectql/objectos)
- [Better-Auth 文档](https://www.better-auth.com/)

## License

MIT
