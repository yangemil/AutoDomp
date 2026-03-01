# start.bat 端口自动清理实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 增强start.bat脚本，在启动服务前自动检测并清理占用3000端口的进程

**Architecture:** 使用Windows批处理原生命令（netstat和taskkill）检测并终止占用3000端口的进程，然后构建并启动生产模式服务

**Tech Stack:** Windows Batch Scripting, Node.js/NestJS CLI

---

### Task 1: 备份现有的 start.bat

**Files:**
- Modify: `start.bat`

**Step 1: 备份当前文件**

创建备份文件：
```batch
copy start.bat start.bat.backup
```

**Step 2: 验证备份文件存在**

Run: `dir start.bat*`
Expected: 显示 start.bat 和 start.bat.backup 两个文件

**Step 3: 提交备份**

```bash
git add start.bat.backup
git commit -m "chore: 备份原始start.bat文件"
```

---

### Task 2: 实现端口检测功能

**Files:**
- Modify: `start.bat`

**Step 1: 重写 start.bat，添加端口检测逻辑**

```batch
@echo off
echo ========================================
echo AutoDOMP Web Automation Testing Platform
echo ========================================
echo.

REM 检测3000端口是否被占用
echo Checking port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Port 3000 is occupied by PID %%a
    echo Killing process...
    taskkill /F /PID %%a >nul 2>&1
    if %errorlevel% equ 0 (
        echo Process killed successfully
    ) else (
        echo Failed to kill process
    )
)

echo Port 3000 is free
echo.

REM 启动服务
echo Starting service...
echo.
npm run start:dev
```

**Step 2: 测试端口检测功能**

Run: `start.bat`
Expected:
- 如果3000端口被占用，显示PID并杀掉进程
- 显示 "Port 3000 is free"
- 继续执行 npm run start:dev

**Step 3: 提交端口检测功能**

```bash
git add start.bat
git commit -m "feat: 添加3000端口自动检测和清理功能"
```

---

### Task 3: 添加项目构建步骤

**Files:**
- Modify: `start.bat`

**Step 1: 修改启动流程，添加构建步骤**

```batch
@echo off
echo ========================================
echo AutoDOMP Web Automation Testing Platform
echo ========================================
echo.

REM 检测3000端口是否被占用
echo Checking port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Port 3000 is occupied by PID %%a
    echo Killing process...
    taskkill /F /PID %%a >nul 2>&1
    if %errorlevel% equ 0 (
        echo Process killed successfully
    ) else (
        echo Failed to kill process
    )
)

echo Port 3000 is free
echo.

REM 构建项目
echo Building project...
npm run build
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo Build completed successfully
echo.

REM 启动服务
echo Starting service in production mode...
echo.
npm run start:prod
```

**Step 2: 测试构建功能**

Run: `start.bat`
Expected:
- 检测并清理端口
- 执行 npm run build
- 构建成功后显示 "Build completed successfully"
- 执行 npm run start:prod

**Step 3: 提交构建功能**

```bash
git add start.bat
git commit -m "feat: 添加项目构建步骤"
```

---

### Task 4: 添加错误处理和用户反馈

**Files:**
- Modify: `start.bat`

**Step 1: 完善错误处理和用户提示**

```batch
@echo off
echo ========================================
echo AutoDOMP Web Automation Testing Platform
echo ========================================
echo.

REM 检测3000端口是否被占用
echo [Step 1/3] Checking port 3000...
set PORT_OCCUPIED=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    if "%%a" neq "" (
        set PORT_OCCUPIED=1
        echo   - Port 3000 is occupied by PID %%a
        echo   - Killing process...
        taskkill /F /PID %%a >nul 2>&1
        if %errorlevel% equ 0 (
            echo   - Process killed successfully
        ) else (
            echo   - Warning: Failed to kill process
        )
    )
)

if %PORT_OCCUPIED% equ 0 (
    echo   - Port 3000 is free
)

echo.

REM 构建项目
echo [Step 2/3] Building project...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo ERROR: Build failed!
    echo ========================================
    pause
    exit /b 1
)

echo   - Build completed successfully
echo.

REM 启动服务
echo [Step 3/3] Starting service in production mode...
echo.
echo ========================================
echo.
call npm run start:prod
```

**Step 2: 测试完整流程**

Run: `start.bat`
Expected:
- 显示清晰的步骤标记 [Step 1/3], [Step 2/3], [Step 3/3]
- 每个操作都有明确的反馈信息
- 如果构建失败，显示错误信息并暂停
- 成功启动服务

**Step 3: 提交错误处理改进**

```bash
git add start.bat
git commit -m "feat: 完善错误处理和用户反馈"
```

---

### Task 5: 验证和测试

**Files:**
- Modify: `start.bat`

**Step 1: 模拟端口占用场景**

先启动一个占用3000端口的进程：
```batch
node -e "require('http').createServer().listen(3000)"
```

然后在另一个终端运行 `start.bat`
Expected:
- 检测到端口占用
- 杀掉进程
- 构建并启动服务

**Step 2: 测试构建失败场景**

在 package.json 中临时修改 build 命令为错误命令：
```json
"build": "exit 1"
```

运行 `start.bat`
Expected:
- 显示构建失败错误信息
- 脚本暂停等待用户确认
- 退出码为1

**Step 3: 恢复正常构建命令**

恢复 package.json 中的 build 命令

**Step 4: 最终测试**

Run: `start.bat`
Expected:
- 正常完成所有步骤
- 服务成功启动
- 可以访问 http://localhost:3000

**Step 5: 提交最终版本**

```bash
git add start.bat package.json
git commit -m "feat: 完成start.bat端口自动清理功能"
```

---

### Task 6: 清理备份文件（可选）

**Files:**
- Delete: `start.bat.backup`

**Step 1: 删除备份文件**

```bash
del start.bat.backup
```

**Step 2: 提交清理**

```bash
git add start.bat.backup
git commit -m "chore: 删除临时备份文件"
```

---

## 验收标准

✅ start.bat 能够检测3000端口占用
✅ 自动杀掉占用3000端口的进程
✅ 执行 npm run build 构建项目
✅ 构建失败时显示错误并退出
✅ 构建成功后启动 npm run start:prod
✅ 提供清晰的用户反馈信息
