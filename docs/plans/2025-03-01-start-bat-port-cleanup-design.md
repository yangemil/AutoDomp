# start.bat 端口自动清理设计

**日期**: 2025-03-01  
**作者**: opencode  
**状态**: 已批准

## 概述

增强 start.bat 脚本，在启动服务前自动检测并清理占用3000端口的进程，确保服务能够正常启动。

## 功能流程

1. **端口检测**: 使用 `netstat -ano | findstr :3000` 检测3000端口是否被占用
2. **进程清理**: 如果发现占用：
   - 提取进程PID
   - 使用 `taskkill /F /PID <pid>` 强制终止进程
   - 显示操作反馈信息
3. **构建项目**: 执行 `npm run build`
4. **启动服务**: 执行 `npm run start:prod` 启动生产模式

## 技术方案

### 端口检测与清理

使用Windows批处理原生命令：

```batch
netstat -ano | findstr :3000
```

解析输出格式：
```
TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    12345
```

使用 `for /f` 循环提取PID（第5列）：

```batch
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /F /PID %%a
)
```

### 构建与启动

```batch
npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b 1
)
npm run start:prod
```

## 错误处理

1. **端口检测失败**: 继续执行启动流程
2. **进程终止失败**: 显示错误但继续执行
3. **构建失败**: 显示错误并退出脚本
4. **启动失败**: 显示错误信息

## 用户体验

- 显示清晰的步骤提示
- 显示每个操作的执行状态
- 保持简洁的输出信息

## 约束条件

- 端口号固定为3000
- 使用Windows批处理命令
- 无需用户确认，自动清理端口
- 构建后启动生产模式
