# Playwright 登录页面调试程序实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 使用 Playwright 自动化浏览器诊断 AutoDOMP 登录页面循环刷新问题

**Architecture:** 基于事件驱动的日志收集器，监控浏览器行为并使用 AI 分析模式

**Tech Stack:** Playwright 1.40.0, TypeScript, Node.js 20.x+

---

### Task 1: 创建项目结构和配置文件

**Files:**
- Create: `debug-login/package.json`
- Create: `debug-login/tsconfig.json`
- Create: `debug-login/src/tsconfig.json`

**Step 1: 创建 package.json**

```json
{
  "name": "login-debugger",
  "version": "1.0.0",
  "description": "Playwright-based login page debugger",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "debug": "node dist/index.js",
    "install-playwright": "npx playwright install chromium"
  },
  "dependencies": {
    "playwright": "^1.40.0",
    "@playwright/test": "^1.40.0"
  },
  "devDependencies": {
    "@types/node": "^20.3.1",
    "typescript": "^5.1.3"
  }
}
```

**Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: 提交配置文件**

```bash
cd debug-login
git init
git add .
git commit -m "feat: 初始化项目结构和配置"
```

---

### Task 2: 实现日志收集器

**Files:**
- Create: `debug-login/src/logger.ts`

**Step 1: 编写日志收集器接口和实现**

```typescript
export interface LogEntry {
  type: 'console' | 'network' | 'navigation' | 'screenshot' | 'storage' | 'redirect';
  timestamp: number;
  data: any;
}

export class Logger {
  private logs: LogEntry[] = [];
  private pageLoadCount = 0;
  private redirectChain: string[] = [];

  add(entry: LogEntry) {
    this.logs.push(entry);
    
    if (entry.type === 'navigation') {
      this.pageLoadCount++;
      if (entry.data.url) {
        this.redirectChain.push(entry.data.url);
      }
    }
  }

  isLoopDetected(): boolean {
    // 检测循环：页面加载次数 > 10
    if (this.pageLoadCount > 10) {
      return true;
    }
    
    // 检测循环：URL 在 /login 和 / 之间变化
    const lastFive = this.redirectChain.slice(-5);
    const loginToHomePattern = lastFive.filter(
      url => url === '/login' || url === '/'
    );
    
    if (loginToHomePattern.length >= 5) {
      return true;
    }
    
    return false;
  }

  getSummary(): object {
    return {
      pageLoadCount: this.pageLoadCount,
      redirectChain: this.redirectChain,
      logCount: this.logs.length,
      detectedLoop: this.isLoopDetected()
    };
  }

  export(): LogEntry[] {
    return this.logs;
  }
}
```

**Step 2: 提交日志收集器**

```bash
cd debug-login
git add src/logger.ts
git commit -m "feat: 实现日志收集器"
```

---

### Task 3: 实现浏览器控制器

**Files:**
- Create: `debug-login/src/page-controller.ts`

**Step 1: 编写浏览器控制器**

```typescript
import { chromium, Page, Browser } from 'playwright';
import { Logger } from './logger';

export class PageController {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async initialize(headless: boolean = false) {
    this.browser = await chromium.launch({ 
      headless,
      slowMo: 50 // 减慢操作，便于观察
    });
    this.page = await this.browser.newPage();

    this.setupConsoleListener();
    this.setupNetworkListener();
    this.setupNavigationListener();
  }

  private setupConsoleListener() {
    if (!this.page) return;

    this.page.on('console', msg => {
      this.logger.add({
        type: 'console',
        timestamp: Date.now(),
        data: {
          type: msg.type(),
          text: msg.text(),
          location: msg.location()
        }
      });
    });
  }

  private setupNetworkListener() {
    if (!this.page) return;

    this.page.on('request', request => {
      this.logger.add({
        type: 'network',
        timestamp: Date.now(),
        data: {
          method: request.method(),
          url: request.url(),
          type: 'request'
        }
      });
    });

    this.page.on('response', response => {
      this.logger.add({
        type: 'network',
        timestamp: Date.now(),
        data: {
          status: response.status(),
          url: response.url(),
          type: 'response'
        }
      });
    });
  }

  private setupNavigationListener() {
    if (!this.page) return;

    this.page.on('load', () => {
      if (this.page) {
        this.logger.add({
          type: 'navigation',
          timestamp: Date.now(),
          data: {
            url: this.page.url(),
            eventType: 'load'
          }
        });
      }
    });

    this.page.on('domcontentloaded', () => {
      if (this.page) {
        this.logger.add({
          type: 'navigation',
          timestamp: Date.now(),
          data: {
            url: this.page.url(),
            eventType: 'domcontentloaded'
          }
        });
      }
    });
  }

  async navigateTo(url: string) {
    if (!this.page) throw new Error('Page not initialized');
    
    this.logger.add({
      type: 'navigation',
      timestamp: Date.now(),
      data: { url, action: 'navigating' }
    });

    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  async captureScreenshot(path: string) {
    if (!this.page) throw new Error('Page not initialized');
    await this.page.screenshot({ path, fullPage: true });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
```

**Step 2: 提交浏览器控制器**

```bash
cd debug-login
git add src/page-controller.ts
git commit -m "feat: 实现浏览器控制器"
```

---

### Task 4: 实现登录操作执行器

**Files:**
- Create: `debug-login/src/login-executor.ts`

**Step 1: 编写登录操作执行器**

```typescript
import { Page } from 'playwright';

export class LoginExecutor {
  async executeLogin(page: Page, username: string, password: string): Promise<boolean> {
    try {
      // 等待登录表单加载
      await page.waitForSelector('#username, #loginForm', { timeout: 5000 });
      
      // 填写用户名
      await page.fill('#username', username);
      console.log(`[LoginExecutor] 填写用户名: ${username}`);
      
      // 填写密码
      await page.fill('#password', password);
      console.log(`[LoginExecutor] 填写密码: ****`);
      
      // 点击登录按钮
      await page.click('#loginBtn');
      console.log('[LoginExecutor] 点击登录按钮');
      
      // 等待响应（跳转或错误消息）
      await Promise.race([
        page.waitForURL(/\/(login|\/|$)/, { timeout: 5000 }),
        page.waitForSelector('#errorMessage', { timeout: 3000 }).catch(() => null)
      ]);
      
      const currentUrl = page.url();
      console.log(`[LoginExecutor] 当前URL: ${currentUrl}`);
      
      // 检查是否跳转到首页
      if (currentUrl.endsWith('/') || currentUrl.endsWith('/login')) {
        console.log('[LoginExecutor] 登录操作完成');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[LoginExecutor] 登录失败:', error);
      return false;
    }
  }
}
```

**Step 2: 提交登录操作执行器**

```bash
cd debug-login
git add src/login-executor.ts
git commit -m "feat: 实现登录操作执行器"
```

---

### Task 5: 实现主调试程序

**Files:**
- Create: `debug-login/src/index.ts`

**Step 1: 编写主调试程序**

```typescript
import { Logger } from './logger';
import { PageController } from './page-controller';
import { LoginExecutor } from './login-executor';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const LOGIN_URL = 'http://localhost:3000/login';
const MAX_DURATION = 30000; // 30 秒
const SCREENSHOT_INTERVAL = 3000; // 每 3 秒截图

async function main() {
  console.log('='.repeat(60));
  console.log('Playwright 登录页面调试程序');
  console.log('='.repeat(60));
  
  // 初始化组件
  const logger = new Logger();
  const pageController = new PageController(logger);
  const loginExecutor = new LoginExecutor();
  
  // 创建报告目录
  const reportDir = join(process.cwd(), 'reports');
  if (!existsSync(reportDir)) {
    mkdirSync(reportDir, { recursive: true });
  }
  
  try {
    // 初始化浏览器
    console.log('[Main] 初始化浏览器...');
    await pageController.initialize(false); // 使用有头模式
    
    // 清除 localStorage
    console.log('[Main] 清除 localStorage...');
    await pageController.executeInBrowser(() => {
      localStorage.clear();
    });
    
    // 导航到登录页
    console.log('[Main] 导航到登录页...');
    await pageController.navigateTo(LOGIN_URL);
    
    // 开始监控
    console.log('[Main] 开始监控（30 秒）...');
    const startTime = Date.now();
    let screenshotCount = 0;
    
    const monitorInterval = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed > MAX_DURATION) {
        clearInterval(monitorInterval);
        console.log('[Main] 监控结束');
        return;
      }
      
      // 定期截图
      screenshotCount++;
      const screenshotPath = join(reportDir, `screenshot-${screenshotCount}.png`);
      await pageController.captureScreenshot(screenshotPath);
      console.log(`[Main] 已保存截图 ${screenshotCount}`);
      
      // 检测循环
      if (logger.isLoopDetected()) {
        clearInterval(monitorInterval);
        console.log('[Main] 检测到循环刷新！');
        return;
      }
    }, SCREENSHOT_INTERVAL);
    
    // 等待监控完成
    await new Promise(resolve => setTimeout(resolve, MAX_DURATION));
    
    // 生成报告
    console.log('[Main] 生成报告...');
    const summary = logger.getSummary();
    const reportPath = join(reportDir, `report-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(logger.export(), null, 2));
    
    console.log('[Main] 调试完成');
    console.log('[Main] 页面加载次数:', summary.pageLoadCount);
    console.log('[Main] 检测到循环:', summary.detectedLoop);
    console.log('[Main] 重定向链:', summary.redirectChain);
    console.log('[Main] 日志数量:', summary.logCount);
    console.log('[Main] 报告已保存到:', reportPath);
    
  } catch (error) {
    console.error('[Main] 发生错误:', error);
  } finally {
    // 关闭浏览器
    await pageController.close();
  }
}

main().catch(console.error);
```

**Step 2: 修复 executeInBrowser 方法**

实际上 Playwright Page 没有 executeInBrowser 方法，需要修改：

```typescript
// 在 PageController 中添加
async clearLocalStorage() {
  if (!this.page) throw new Error('Page not initialized');
  await this.page.evaluate(() => {
    localStorage.clear();
  });
}

async getLocalStorage(): Promise<Record<string, string>> {
  if (!this.page) throw new Error('Page not initialized');
  return await this.page.evaluate(() => {
    const storage: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        storage[key] = localStorage.getItem(key) || '';
      }
    }
    return storage;
  });
}
```

**Step 3: 更新主程序使用正确的方法**

```typescript
// 清除 localStorage
console.log('[Main] 清除 localStorage...');
await pageController.clearLocalStorage();
```

**Step 4: 提交主调试程序**

```bash
cd debug-login
git add src/index.ts src/page-controller.ts
git commit -m "feat: 实现主调试程序"
```

---

### Task 6: 实现 AI 分析器

**Files:**
- Create: `debug-login/src/analyzer.ts`

**Step 1: 编写 AI 分析器**

```typescript
import { Logger, LogEntry } from './logger';

export class Analyzer {
  analyze(logger: Logger): AnalysisResult {
    const logs = logger.export();
    const summary = logger.getSummary();
    
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // 分析循环模式
    if (summary.detectedLoop) {
      issues.push('检测到页面循环刷新');
      
      // 分析循环类型
      if (this.isLoginHomeLoop(summary.redirectChain)) {
        issues.push('登录页与首页之间的循环');
        suggestions.push('建议：检查 login.hbs 和 main.hbs 中的自动跳转逻辑');
      }
      
      // 分析循环速度
      const loadTimes = this.calculateLoadIntervals(logs);
      if (loadTimes.length > 0) {
        const avgInterval = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
        if (avgInterval < 1000) {
          issues.push(`循环速度过快（平均 ${Math.round(avgInterval)}ms）`);
          suggestions.push('建议：检查是否有多个页面加载事件监听器同时触发');
        }
      }
    }
    
    // 分析网络请求
    const networkIssues = this.analyzeNetworkRequests(logs);
    issues.push(...networkIssues);
    
    // 分析 console 错误
    const consoleErrors = this.analyzeConsoleErrors(logs);
    issues.push(...consoleErrors);
    
    // 生成修复建议
    suggestions.push(...this.generateFixSuggestions(issues));
    
    return {
      issues,
      suggestions,
      summary,
      timestamp: Date.now()
    };
  }
  
  private isLoginHomeLoop(chain: string[]): boolean {
    const pattern = chain.slice(-10);
    const loginCount = pattern.filter(url => url === '/login').length;
    const homeCount = pattern.filter(url => url === '/').length;
    
    return loginCount === homeCount && loginCount >= 3;
  }
  
  private calculateLoadIntervals(logs: LogEntry[]): number[] {
    const navigations = logs.filter(log => log.type === 'navigation');
    const intervals: number[] = [];
    
    for (let i = 1; i < navigations.length; i++) {
      const prev = navigations[i - 1].timestamp;
      const curr = navigations[i].timestamp;
      intervals.push(curr - prev);
    }
    
    return intervals;
  }
  
  private analyzeNetworkRequests(logs: LogEntry[]): string[] {
    const requests = logs.filter(log => log.type === 'network');
    const failedRequests = requests.filter(log => log.data.status >= 400);
    
    const issues: string[] = [];
    
    if (failedRequests.length > 0) {
      issues.push(`${failedRequests.length} 个网络请求失败`);
      failedRequests.forEach(req => {
        issues.push(`  - ${req.data.method} ${req.data.url}: ${req.data.status}`);
      });
    }
    
    return issues;
  }
  
  private analyzeConsoleErrors(logs: LogEntry[]): string[] {
    const consoleLogs = logs.filter(log => log.type === 'console');
    const errors = consoleLogs.filter(log => log.data.type === 'error');
    
    return errors.map(log => `Console错误: ${log.data.text}`);
  }
  
  private generateFixSuggestions(issues: string[]): string[] {
    const suggestions: string[] = [];
    
    if (issues.some(issue => issue.includes('循环'))) {
      suggestions.push('1. 移除或协调页面间的自动跳转逻辑');
      suggestions.push('2. 添加防重复跳转标志（如 isRedirecting）');
      suggestions.push('3. 使用单一入口点处理认证检查');
    }
    
    if (issues.some(issue => issue.includes('网络'))) {
      suggestions.push('检查服务器是否正常运行');
      suggestions.push('验证网络连接和防火墙设置');
    }
    
    if (issues.some(issue => issue.includes('速度过快'))) {
      suggestions.push('检查是否有多个事件监听器同时触发');
      suggestions.push('使用防抖或节流控制事件处理');
    }
    
    return suggestions;
  }
}

interface AnalysisResult {
  issues: string[];
  suggestions: string[];
  summary: any;
  timestamp: number;
}
```

**Step 2: 集成 AI 分析器到主程序**

在 `debug-login/src/index.ts` 中添加：

```typescript
import { Analyzer } from './analyzer';

// 在监控完成后
const analyzer = new Analyzer();
const analysis = analyzer.analyze(logger);

console.log('[Main] ========== 分析结果 ==========');
console.log('[Main] 发现的问题:');
analysis.issues.forEach(issue => console.log(`  - ${issue}`));
console.log('[Main] 修复建议:');
analysis.suggestions.forEach(suggestion => console.log(`  ${suggestion}`));
console.log('[Main] ===============================');

// 保存分析结果
const analysisPath = join(reportDir, `analysis-${Date.now()}.json`);
writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
```

**Step 3: 提交 AI 分析器**

```bash
cd debug-login
git add src/analyzer.ts src/index.ts
git commit -m "feat: 实现 AI 分析器"
```

---

### Task 7: 实现报告生成器

**Files:**
- Create: `debug-login/src/report-generator.ts`

**Step 1: 编写报告生成器**

```typescript
import { Logger, LogEntry } from './logger';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export class ReportGenerator {
  generateHTML(logger: Logger, analysis: any): string {
    const logs = logger.export();
    const summary = logger.getSummary();
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Playwright 调试报告</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        h2 {
            color: #555;
            margin-top: 30px;
        }
        .summary {
            background: #f0f8ff;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .issue {
            background: #fee;
            padding: 15px;
            border-radius: 6px;
            margin: 10px 0;
            border-left: 4px solid #ff3838;
        }
        .suggestion {
            background: #efe;
            padding: 15px;
            border-radius: 6px;
            margin: 10px 0;
            border-left: 4px solid #10b981;
        }
        .timeline {
            margin: 30px 0;
            padding: 20px;
            background: #fafafa;
            border-radius: 6px;
        }
        .timeline-item {
            padding: 10px;
            border-left: 3px solid #ddd;
            margin-left: 10px;
            position: relative;
        }
        .timeline-item::before {
            content: '';
            position: absolute;
            left: -8px;
            top: 15px;
            width: 13px;
            height: 13px;
            background: #667eea;
            border-radius: 50%;
        }
        .console-error {
            color: #c33;
        }
        .console-warn {
            color: #f93;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Playwright 登录页面调试报告</h1>
        
        <div class="summary">
            <h2>摘要</h2>
            <p><strong>生成时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
            <p><strong>页面加载次数:</strong> ${summary.pageLoadCount}</p>
            <p><strong>日志数量:</strong> ${summary.logCount}</p>
            <p><strong>检测到循环:</strong> ${summary.detectedLoop ? '是' : '否'}</p>
            <p><strong>重定向链:</strong></p>
            <pre>${summary.redirectChain.join(' → ')}</pre>
        </div>
        
        <h2>发现的问题</h2>
        ${analysis.issues.map(issue => `
            <div class="issue">
                <strong>⚠️ ${issue}</strong>
            </div>
        `).join('')}
        
        <h2>修复建议</h2>
        ${analysis.suggestions.map(suggestion => `
            <div class="suggestion">
                <strong>✅ ${suggestion}</strong>
            </div>
        `).join('')}
        
        <h2>事件时间线</h2>
        <div class="timeline">
            ${this.generateTimeline(logs)}
        </div>
    </div>
</body>
</html>
    `;
  }
  
  private generateTimeline(logs: LogEntry[]): string {
    return logs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString('zh-CN');
      
      let content = '';
      let cssClass = '';
      
      switch (log.type) {
        case 'console':
          cssClass = log.data.type === 'error' ? 'console-error' : log.data.type === 'warn' ? 'console-warn' : '';
          content = `
            <strong>${log.data.type.toUpperCase()}</strong>
            <code>${log.data.text}</code>
          `;
          break;
        case 'network':
          content = `
            <strong>${log.data.method}</strong> ${log.data.url}
            <br>Status: <strong>${log.data.status}</strong>
          `;
          break;
        case 'navigation':
          content = `
            <strong>页面加载</strong>
            <br>URL: ${log.data.url}
            <br>事件: ${log.data.eventType}
          `;
          break;
        case 'screenshot':
          content = `<strong>截图已保存</strong>`;
          break;
      }
      
      return `
        <div class="timeline-item">
          <span style="color: #999; font-size: 12px;">${time}</span>
          <div class="${cssClass}">${content}</div>
        </div>
      `;
    }).join('');
  }
  
  generateTerminalSummary(logger: Logger, analysis: any): string {
    const summary = logger.getSummary();
    
    return `
========================================
Playwright 调试报告 - 终端摘要
========================================

诊断时间: ${new Date().toLocaleString('zh-CN')}
========================================

摘要:
- 页面加载次数: ${summary.pageLoadCount}
- 日志数量: ${summary.logCount}
- 检测到循环: ${summary.detectedLoop ? '是' : '否'}

发现的问题 (${analysis.issues.length}):
${analysis.issues.map(issue => `  ❌ ${issue}`).join('\n')}

修复建议 (${analysis.suggestions.length}):
${analysis.suggestions.map(suggestion => `  ✅ ${suggestion}`).join('\n')}

========================================
详细报告已生成到 HTML 文件
========================================
    `;
  }
}
```

**Step 2: 集成报告生成器到主程序**

在 `debug-login/src/index.ts` 中添加：

```typescript
import { ReportGenerator } from './report-generator';

// 生成报告
const reportGenerator = new ReportGenerator();
const htmlReport = reportGenerator.generateHTML(logger, analysis);
const terminalReport = reportGenerator.generateTerminalSummary(logger, analysis);

// 保存 HTML 报告
const htmlPath = join(reportDir, `report-${Date.now()}.html`);
writeFileSync(htmlPath, htmlReport);

// 输出终端报告
console.log(terminalReport);
console.log(`[Main] HTML 报告已保存到: ${htmlPath}`);
```

**Step 3: 提交报告生成器**

```bash
cd debug-login
git add src/report-generator.ts src/index.ts
git commit -m "feat: 实现报告生成器"
```

---

### Task 8: 测试和验证

**Files:**
- Test: 运行调试程序

**Step 1: 安装依赖**

```bash
cd debug-login
npm install
npm run install-playwright
```

**Step 2: 编译程序**

```bash
npm run build
```

**Step 3: 运行调试程序**

```bash
npm run debug
```

**Expected Output:**
- 浏览器自动打开
- 导航到登录页
- 监控 30 秒
- 捕获日志和截图
- 检测循环刷新
- 生成报告

**Step 4: 查看报告**

打开生成的 HTML 报告文件，查看详细的诊断结果。

**Step 5: 提交最终版本**

```bash
cd debug-login
git add .
git commit -m "feat: 完成 Playwright 登录页面调试程序"
```

---

## 验收标准

✅ 调试程序能够启动浏览器并访问登录页
✅ 能够捕获所有 Console 日志（log、error、warn）
✅ 能够记录所有网络请求和响应
✅ 能够定期截图保存页面状态
✅ 能够监控 localStorage 变化
✅ 能够检测到页面循环刷新
✅ AI 分析能够定位问题根因
✅ 能够生成终端输出和 HTML 详细报告
✅ 程序能够在 60 秒内完成诊断

## 注意事项

1. **服务运行**: 确保 AutoDOMP 服务在 http://localhost:3000 运行
2. **端口占用**: 如果 3000 端口被占用，先运行 `D:\测试小工具\autodomp>start.bat`
3. **浏览器安装**: 确保已运行 `npm run install-playwright`
4. **无头模式**: 默认使用有头模式，便于观察。可以修改为 true 进行后台运行
5. **调试日志**: 所有日志都会在终端输出，方便实时查看
