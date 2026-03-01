# AutoDOMP 新增功能说明文档

## 版本
v2.1.0

## 更新日期
2026-02-28

---

## 一、新增功能概述

本次更新新增了以下功能：

1. **结构化日志** - 多级别、可搜索的日志系统
2. **性能指标** - 自动收集测试执行性能数据
3. **环境信息** - 记录测试执行时的环境配置
4. **增强报告** - 支持导出 JSON/CSV 格式

---

## 二、功能详细说明

### 2.1 结构化日志

#### 什么是结构化日志？
与原有的纯文本日志不同，结构化日志将每条日志转换为带有明确字段的对象，便于搜索、过滤和分析。

#### 日志级别
| 级别 | 说明 | 使用场景 |
|------|------|----------|
| `DEBUG` | 调试信息 | 详细的内部状态、步骤执行详情 |
| `INFO` | 一般信息 | 测试开始、完成、页面加载 |
| `WARN` | 警告 | 非致命问题、重试等 |
| `ERROR` | 错误 | 步骤失败、断言失败 |
| `CRITICAL` | 严重错误 | 系统崩溃、无法恢复 |

#### 日志字段
```json
{
  "id": "日志唯一ID",
  "timestamp": "2026-02-28T12:00:00.000Z",
  "level": "info",
  "message": "开始执行测试用例: 登录",
  "executionId": "执行ID",
  "stepOrder": 1,
  "context": {
    "traceId": "追踪ID",
    "projectId": "项目ID",
    "testCaseId": "测试用例ID",
    "environment": "development"
  },
  "metadata": {
    "duration": 1500,
    "selector": "#username",
    "action": "fill",
    "url": "http://example.com/login"
  }
}
```

---

### 2.2 性能指标

#### 什么是性能指标？
自动收集测试执行过程中的性能数据，帮助分析测试效率。

#### 包含的数据
```json
{
  "performanceMetrics": {
    "totalDuration": 5000,
    "averageStepDuration": 1250,
    "slowestStep": {
      "order": 3,
      "action": "click",
      "description": "点击登录按钮",
      "duration": 3000
    },
    "pageLoadTimes": [1500, 2000],
    "elementInteractions": 5
  }
}
```

| 字段 | 说明 |
|------|------|
| `totalDuration` | 总耗时（毫秒） |
| `averageStepDuration` | 平均步骤耗时 |
| `slowestStep` | 最慢步骤详情 |
| `pageLoadTimes` | 页面加载时间列表 |
| `elementInteractions` | 元素交互次数 |

---

### 2.3 环境信息

#### 什么是环境信息？
记录测试执行时的系统环境信息，便于问题排查和复现。

#### 包含的数据
```json
{
  "environmentInfo": {
    "os": "Windows_NT",
    "osVersion": "10.0.19045",
    "nodeVersion": "v18.16.0",
    "platform": "win32",
    "browserVersion": "Chromium 120.0.6099.109",
    "resolution": "1920x1080",
    "timezone": "Asia/Shanghai",
    "locale": "zh-CN",
    "memoryUsage": {
      "used": 8589934592,
      "total": 17179869184,
      "percentage": 50.0
    },
    "testPlatform": "AutoDOMP",
    "testPlatformVersion": "2.0.0"
  }
}
```

---

### 2.4 增强报告导出

支持将执行日志导出为以下格式：
- **JSON** - 完整的结构化数据
- **CSV** - 表格数据，便于 Excel 分析

---

## 三、如何验证新功能

### 3.1 通过 Web 界面查看（推荐）

#### 步骤：
1. 启动服务：`npm run start:dev`
2. 访问：`http://localhost:3000`
3. 执行一个测试用例
4. 进入"执行记录"页面：`http://localhost:3000/executions`
5. 点击任意执行记录查看详情

#### 增强版详情页面包含：
- 性能指标面板（📊）
- 环境信息面板（🖥️）
- 结构化日志面板（📝）
- 日志级别过滤按钮
- 导出 JSON/CSV 按钮

---

### 3.2 通过 API 接口查看

#### 启动服务
```bash
cd D:\测试小工具\autodomp
npm run start:dev
```

#### API 端点

| 接口 | 说明 |
|------|------|
| `GET /api/executions/{id}` | 获取完整执行记录 |
| `GET /api/executions/{id}/structured-logs` | 获取结构化日志 |
| `GET /api/executions/{id}/structured-logs?level=error` | 只获取错误日志 |
| `GET /api/executions/{id}/performance` | 获取性能指标 |
| `GET /api/executions/{id}/environment` | 获取环境信息 |
| `GET /api/executions/{id}/logs-summary` | 获取日志统计 |
| `GET /api/executions/{id}/export-logs/json` | 导出 JSON |
| `GET /api/executions/{id}/export-logs/csv` | 导出 CSV |

#### 使用示例

```bash
# 获取执行记录列表
curl http://localhost:3000/api/executions

# 查看完整执行记录
curl http://localhost:3000/api/executions/{执行ID}

# 只查看性能指标
curl http://localhost:3000/api/executions/{执行ID}/performance

# 只查看错误日志
curl http://localhost:3000/api/executions/{执行ID}/structured-logs?level=error

# 查看日志统计
curl http://localhost:3000/api/executions/{执行ID}/logs-summary

# 导出为 CSV
curl http://localhost:3000/api/executions/{执行ID}/export-logs/csv -o logs.csv
```

---

### 3.3 通过数据文件查看

执行记录保存在：`data/projects/{项目ID}/executions/{执行ID}.json`

用文本编辑器打开文件，查看以下字段：
- `structuredLogs` - 结构化日志数组
- `performanceMetrics` - 性能指标对象
- `environmentInfo` - 环境信息对象

---

### 3.4 通过浏览器开发者工具查看

1. 打开浏览器，访问 `http://localhost:3000`
2. 按 F12 打开开发者工具
3. 切换到 Network 标签
4. 执行一个测试用例
5. 查看 `/api/executions/{执行ID}` 请求的响应

---

## 四、验证清单

执行一个测试用例后，检查以下内容：

| 功能 | 验证位置 | 预期结果 |
|------|----------|----------|
| 结构化日志 | 执行详情页面 | 看到"📝 执行日志"面板 |
| 日志级别 | structuredLogs | 每条日志有 `level` 字段 |
| 性能指标 | 执行详情页面 | 看到"📊 性能指标"面板 |
| 最慢步骤 | performanceMetrics.slowestStep | 显示最慢的步骤信息 |
| 环境信息 | 执行详情页面 | 看到"🖥️ 环境信息"面板 |
| 日志过滤 | 点击过滤按钮 | 只显示对应级别的日志 |
| 导出功能 | 点击导出按钮 | 下载对应格式的文件 |

---

## 五、向后兼容性

### 5.1 原有功能不受影响

- ✅ `logs` 数组仍然存在并正常工作
- ✅ 所有原有 API 接口保持不变
- ✅ Web 界面仍然正常显示

### 5.2 新增字段都是可选的

```typescript
structuredLogs?: LogEntry[];           // 结构化日志
performanceMetrics?: PerformanceMetrics; // 性能指标
environmentInfo?: EnvironmentInfo;    // 环境信息
```

### 5.3 旧记录不受影响

- 升级前创建的执行记录不会有新字段
- 只有升级后执行的测试才会有新字段

---

## 六、常见问题

### Q1: 为什么我看不到结构化日志？
A: 结构化日志只会在升级后执行的测试中生成。旧执行记录不会有这个字段。请执行一个新的测试来验证。

### Q2: 为什么性能指标是空的？
A: 性能指标需要在测试执行结束后才会计算。请查看已完成的测试执行记录。

### Q3: 导出的 CSV 文件打开是乱码？
A: 请使用 Excel 打开 CSV 文件时选择 UTF-8 编码，或者使用 WPS/Numbers 打开。

### Q4: 日志级别过滤不生效？
A: 请确保点击过滤按钮后页面上有对应级别的日志。不同测试的日志级别可能不同。

---

## 七、技术细节

### 7.1 新增的文件

```
src/modules/logging/
├── interfaces.ts       # 日志相关接口定义
├── logging.service.ts # 核心日志服务
├── logging.module.ts  # 日志模块定义
└── index.ts          # 导出文件
```

### 7.2 修改的文件

- `src/common/interfaces.ts` - 添加新的数据类型
- `src/modules/test-engine/test-engine.service.ts` - 集成日志服务
- `src/modules/test-engine/test-engine.module.ts` - 导入日志模块
- `src/modules/web/api.controller.ts` - 添加新的 API 端点
- `src/modules/web/view.controller.ts` - 使用增强版页面
- `src/app.module.ts` - 导入日志模块
- `src/main.ts` - 添加模板辅助函数
- `views/execution-detail-enhanced.hbs` - 增强版详情页面

---

## 八、后续计划

### 阶段二：增强报告服务（开发中）
- 多格式导出（JSON/CSV/PDF）
- 趋势分析图表
- 历史对比功能

### 阶段三：日志搜索引擎（计划中）
- 全文搜索
- 高级过滤
- 聚合统计

### 阶段四：实时监控（计划中）
- WebSocket 实时日志推送
- 执行进度追踪

### 阶段五：Jenkins 集成（计划中）
- CLI 命令行工具
- JUnit 格式输出
- 自动化集成

---

## 九、反馈与支持

如果遇到问题或有任何建议，请提交 Issue 或联系开发团队。

---

## 十、版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v2.0.0 | 2026-02-23 | 初始版本 |
| v2.1.0 | 2026-02-28 | 新增结构化日志、性能指标、环境信息 |

---

*文档最后更新：2026-02-28*
