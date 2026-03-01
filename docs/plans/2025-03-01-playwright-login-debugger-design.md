# Playwright 登录页面调试程序设计

**日期:** 2025-03-01  
**作者:** opencode  
**状态:** 已批准

## 概述

使用 Playwright 自动化浏览器，完整诊断 AutoDOMP 登录页面循环刷新问题。程序将自动检测页面刷新行为、执行登录操作，并使用 AI 分析日志数据定位问题根因。

## 架构

**组件设计：**
1. **浏览器控制器** - 使用 Playwright 启动和管理 Chromium 浏览器
2. **日志收集器** - 捕获 Console 日志、网络请求、页面快照、localStorage 状态
3. **登录操作执行器** - 自动填写用户名密码并执行登录
4. **AI 分析器** - 分析日志模式，检测循环刷新原因
5. **报告生成器** - 生成终端输出和 HTML 详细报告

**数据流：**
```
Playwright → 浏览器 → 日志收集器 → AI 分析器 → 报告生成器
                                           ↓
                                    终端输出 + HTML 文件
```

## 组件设计

### 1. 浏览器控制器

**职责：**
- 启动 Chromium 浏览器（可选无头模式）
- 导航到 http://localhost:3000/login
- 监控页面加载事件
- 管理浏览器生命周期

**关键 API：**
```typescript
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
await page.goto('http://localhost:3000/login');
```

### 2. 日志收集器

**职责：**
- 捕获所有 Console 日志（log、error、warn）
- 记录所有网络请求（URL、状态码、响应）
- 定期截图保存页面状态
- 监控 localStorage 变化

**日志结构：**
```typescript
interface PageEvent {
  type: 'console' | 'network' | 'navigation' | 'screenshot';
  timestamp: number;
  data: any;
}
```

**监控指标：**
- 页面加载次数计数器
- URL 变化历史
- 页面停留时间
- localStorage 状态快照

### 3. 登录操作执行器

**职责：**
- 自动填写用户名：`admin`
- 自动填写密码：`admin123`
- 点击登录按钮
- 等待响应和跳转

**执行流程：**
1. 等待登录表单加载
2. 填写用户名和密码
3. 点击登录按钮
4. 监控网络响应
5. 等待页面跳转或错误消息

### 4. AI 分析器

**职责：**
- 分析日志模式
- 检测循环刷新特征
- 识别问题根因
- 生成修复建议

**检测模式：**
- 页面在 `/login` 和 `/` 之间频繁跳转
- load 事件触发次数异常
- 无用户操作导致的页面变化
- localStorage 状态不一致

### 5. 报告生成器

**职责：**
- 生成终端简要输出
- 生成 HTML 详细报告（含时间线、截图、日志、修复建议）

**报告内容：**
- 诊断摘要
- 页面加载时间线
- 关键事件日志
- 问题分析
- 修复建议

## 错误处理

**超时机制：**
- 监控最长持续时间：30 秒
- 页面加载超时：10 秒
- 网络请求超时：5 秒

**异常处理：**
- 捕获所有 Playwright 异常
- 记录浏览器崩溃
- 网络错误处理
- 页面加载失败处理

**循环检测：**
- 页面加载次数超过 10 次视为循环
- URL 在 `/login` 和 `/` 之间变化超过 5 次
- 自动终止循环并生成报告

## 测试策略

### 阶段 1：初始状态检查
1. 清除 localStorage
2. 访问登录页
3. 记录初始状态

### 阶段 2：循环检测
1. 监控页面加载（最多 10 秒）
2. 记录每次加载的 URL 和时间戳
3. 检测是否存在循环刷新

### 阶段 3：登录测试
1. 填写用户名和密码
2. 点击登录按钮
3. 监控登录响应

### 阶段 4：后登录验证
1. 检查是否成功跳转到首页
2. 验证 localStorage 中的 token
3. 检测是否再次回到登录页

### 阶段 5：失败场景测试
1. 测试无效密码
2. 测试网络错误
3. 测试服务器错误

## 技术栈

- **Playwright**: v1.40.0（已安装）
- **Node.js**: v20.x+
- **TypeScript**: 用于类型安全
- **HTML/CSS**: 用于报告生成

## 文件结构

```
debug-login/
├── src/
│   ├── debugger.ts          # 主调试程序入口
│   ├── logger.ts           # 日志收集器
│   ├── page-controller.ts  # 浏览器控制器
│   ├── login-executor.ts  # 登录操作执行器
│   └── analyzer.ts        # AI 分析器
├── reports/                 # 生成的报告目录
│   └── [timestamp]-report.html
├── package.json
└── tsconfig.json
```

## 成功标准

- ✅ 能够检测到登录页面的循环刷新问题
- ✅ 能够成功执行登录操作
- ✅ AI 分析能够准确定位问题根因
- ✅ 生成的报告包含清晰的修复建议
- ✅ 程序能够在 60 秒内完成诊断

## 约束条件

- AutoDOMP 服务必须在 http://localhost:3000 运行
- 浏览器能够访问本地服务器
- Playwright Chromium 已安装（执行 `npm run install-playwright`）
