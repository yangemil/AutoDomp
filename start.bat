@echo off
setlocal enabledelayedexpansion
echo ========================================
echo AutoDOMP Web Automation Testing Platform
echo ========================================
echo.

REM 检测3000端口是否被占用
echo [Step 1/3] Checking port 3000...

set PORT_OCCUPIED=0
set KILL_FAILED=0

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    if "%%a" neq "" (
        set PORT_OCCUPIED=1
        echo   - Port 3000 is occupied by PID %%a
        echo   - Killing process...
        
        if %%a gtr 0 (
            taskkill /F /PID %%a >nul 2>&1
            if !errorlevel! equ 0 (
                echo   - Process killed successfully
            ) else (
                echo   - Warning: Failed to kill process
                set KILL_FAILED=1
            )
        ) else (
            echo   - Warning: Invalid PID: %%a
            set KILL_FAILED=1
        )
    )
)

if %KILL_FAILED% equ 1 (
    echo.
    echo ERROR: Failed to cleanup port 3000. Please check manually.
    exit /b 1
)

if %PORT_OCCUPIED% equ 0 (
    echo   - Port 3000 is free
)

echo.

REM 构建项目
echo [Step 2/3] Building project...
call npm run build
if !errorlevel! neq 0 (
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
