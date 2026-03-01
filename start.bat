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
