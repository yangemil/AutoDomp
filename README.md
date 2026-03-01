# AutoDOMP - Web自动化测试平台
- 后端技术: NestJS, TypeScript, Express
- 前端技术: Handlebars, CSS3
- 测试引擎: Playwright, Agent Browser
- 数据处理: axios, csv-parser, uuid
- 工具库: class-transformer, class-validator, rxjs

## 技术栈

### 后端

| 技术 | 版本 | 说明 |
|------|------|------|
| **NestJS** | ^10.0.0 | Node.js 企业级后端框架 |
| **TypeScript** | ^5.1.3 | 类型安全的 JavaScript 超集 |
| **Express** | ^4.18.x | NestJS 内置的 Web 框架 |

### 前端

| 技术 | 说明 |
|------|------|
| **Handlebars (hbs)** | 模板引擎，用于服务端渲染 |
| **CSS3** | 样式 |

### 测试引擎

| 技术 | 版本 | 说明 |
|------|------|------|
| **Playwright** | ^1.40.0 | 浏览器自动化测试框架 |
| **Agent Browser** | github:vercel-labs/agent-browser | AI 驱动的浏览器自动化工具 |

### 数据处理

| 技术 | 版本 | 说明 |
|------|------|------|
| **axios** | ^1.6.0 | HTTP 客户端 |
| **csv-parser** | ^3.2.0 | CSV 文件解析 |
| **uuid** | ^9.0.0 | UUID 生成 |

### 工具库

| 技术 | 版本 | 说明 |
|------|------|------|
| **class-transformer** | ^0.5.1 | 对象序列化/反序列化 |
| **class-validator** | ^0.14.0 | 数据验证 |
| **reflect-metadata** | ^0.1.13 | 装饰器元数据反射 |
| **rxjs** | ^7.8.1 | 响应式编程库 |

### 开发工具

| 技术 | 版本 | 说明 |
|------|------|------|
| **@nestjs/cli** | ^10.0.0 | NestJS 命令行工具 |
| **@nestjs/schematics** | ^10.0.0 | NestJS 代码生成器 |
| **@types/node** | ^20.3.1 | Node.js 类型定义 |

## 项目结构

```
autodomp/
├── src/
│   ├── modules/
│   │   ├── ai/              # AI 服务模块
│   │   ├── data/            # 数据服务模块
│   │   ├── notification/    # 通知服务模块 (飞书)
│   │   ├── report/          # 报告生成模块
│   │   ├── test-engine/     # 测试引擎模块
│   │   ├── timer/           # 定时任务模块
│   │   └── web/             # Web 控制器和视图
│   ├── common/              # 公共接口和类型
│   ├── utils/               # 工具函数
│   ├── app.module.ts        # 应用根模块
│   └── main.ts              # 应用入口
├── views/                   # Handlebars 模板
│   ├── layouts/            # 布局模板
│   └── *.hbs               # 页面模板
├── public/                  # 静态资源
│   └── css/                # 样式文件
├── package.json            # 项目依赖
├── nest-cli.json           # NestJS 配置
├── tsconfig.json           # TypeScript 配置
└── README.md               # 项目文档
```

## 核心模块说明

### 1. test-engine (测试引擎)
负责测试用例的执行，包括：
- 步骤执行
- 截图捕获
- 执行结果记录

### 2. ai (AI服务)
- AI 生成测试步骤
- AI 连接测试

### 3. report (报告生成)
- 生成 HTML 测试报告
- 统计数据展示

### 4. notification (通知服务)
- 飞书 Webhook 集成
- 执行结果通知

### 5. timer (定时任务)
- 定时执行测试场景
- 任务调度管理

### 6. web (Web层)
- API 接口
- 页面渲染

## 运行命令

```bash
# 安装依赖
npm install

# 开发模式运行
npm run start:dev

# 生产模式运行
npm run start:prod

# 构建
npm run build

# 安装 Playwright 浏览器
npm run install-playwright
```
