@echo off
setlocal enabledelayedexpansion
echo ========================================
echo AutoDOMP Web Automation Testing Platform
echo ========================================
echo.

REM 检测3000端口是否被占用
echo Checking port 3000...

set KILL_FAILED=0

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Port 3000 is occupied by PID %%a
    
    if "%%a" neq "" if %%a gtr 0 (
        echo Killing process...
        taskkill /F /PID %%a >nul 2>&1
        if !errorlevel! equ 0 (
            echo Process killed successfully
        ) else (
            echo Failed to kill process
            set KILL_FAILED=1
        )
    ) else (
        echo Invalid PID: %%a
        set KILL_FAILED=1
    )
)

if %KILL_FAILED% equ 1 (
    echo.
    echo ERROR: Failed to cleanup port 3000. Please check manually.
    exit /b 1
)

echo Port 3000 is free
echo.

REM 启动服务
echo Starting service...
echo.
npm run start:dev
