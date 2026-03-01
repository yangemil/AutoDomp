const { chromium } = require('playwright');
const path = require('path');

async function debugAuth() {
    console.log('=== 开始调试认证问题 ===');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 监听所有请求
    const requests = [];
    page.on('request', request => {
        const url = request.url();
        const method = request.method();
        const headers = request.headers();
        
        requests.push({
            url,
            method,
            hasAuth: !!headers['authorization'],
            authHeader: headers['authorization']
        });
        
        console.log(`[REQUEST] ${method} ${url}`);
        console.log(`  Headers: ${JSON.stringify(headers, null, 2)}`);
    });
    
    // 监听所有响应
    const responses = [];
    page.on('response', response => {
        const status = response.status();
        const url = response.url();
        
        responses.push({
            url,
            status,
            ok: status >= 200 && status < 300
        });
        
        console.log(`[RESPONSE] ${status} ${url}`);
        
        if (status === 401) {
            console.log(`  ⚠️  401 Unauthorized`);
        }
    });
    
    try {
        // 步骤1: 访问登录页
        console.log('\n[步骤1] 访问登录页...');
        await page.goto('http://localhost:3000/login');
        await page.waitForLoadState('networkidle');
        
        // 截图
        await page.screenshot({ path: 'debug/01-login-page.png' });
        console.log('  ✓ 登录页加载完成');
        
        // 步骤2: 填写表单并登录
        console.log('\n[步骤2] 填写登录表单...');
        
        await page.fill('#username', 'admin');
        await page.fill('#password', 'admin123');
        
        // 截图
        await page.screenshot({ path: 'debug/02-form-filled.png' });
        console.log('  ✓ 表单已填写');
        
        // 点击登录按钮
        const loginBtn = await page.locator('#loginForm button[type="submit"]');
        await loginBtn.click();
        
        // 等待响应
        await page.waitForTimeout(2000);
        
        // 截图
        await page.screenshot({ path: 'debug/03-after-login.png' });
        console.log('  ✓ 已点击登录按钮');
        
        // 步骤3: 等待跳转并检查localStorage
        console.log('\n[步骤3] 检查登录状态...');
        await page.waitForTimeout(1000);
        
        const token = await page.evaluate(() => localStorage.getItem('token'));
        const user = await page.evaluate(() => localStorage.getItem('user'));
        
        console.log(`  Token: ${token ? '✓ 存在' : '✗ 不存在'}`);
        console.log(`  User: ${user ? '✓ 存在' : '✗ 不存在'}`);
        
        if (user) {
            console.log(`  User数据: ${user}`);
        }
        
        // 截图
        await page.screenshot({ path: 'debug/04-after-check.png' });
        
        if (!token || !user) {
            console.log('\n❌ 登录失败！');
            await browser.close();
            return;
        }
        
        // 步骤4: 访问首页
        console.log('\n[步骤4] 访问首页...');
        await page.goto('http://localhost:3000/');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'debug/05-homepage.png' });
        console.log('  ✓ 首页加载完成');
        
        // 步骤5: 访问user-management页面
        console.log('\n[步骤5] 访问user-management页面...');
        await page.goto('http://localhost:3000/user-management');
        await page.waitForTimeout(2000);
        
        // 截图
        await page.screenshot({ path: 'debug/06-user-management.png' });
        console.log('  ✓ user-management页面加载完成');
        
        // 检查页面内容
        const pageContent = await page.content();
        
        // 检查是否有错误提示
        if (pageContent.includes('加载用户失败')) {
            console.log('  ⚠️ 页面显示"加载用户失败"错误');
        }
        
        // 检查是否有token相关错误
        const consoleErrors = await page.evaluate(() => {
            const errors = [];
            const originalError = console.error;
            console.error = (...args) => {
                errors.push(args);
                originalError.apply(console, args);
            };
            return errors;
        });
        
        if (consoleErrors.length > 0) {
            console.log('\n  ⚠️ 控制台错误:');
            consoleErrors.forEach(err => console.log(`    ${JSON.stringify(err)}`));
        }
        
        // 步骤6: 访问role-menu-permissions页面
        console.log('\n[步骤6] 访问role-menu-permissions页面...');
        await page.goto('http://localhost:3000/role-menu-permissions');
        await page.waitForTimeout(2000);
        
        // 截图
        await page.screenshot({ path: 'debug/07-role-menu-permissions.png' });
        console.log('  ✓ role-menu-permissions页面加载完成');
        
        // 步骤7: 直接测试API端点
        console.log('\n[步骤7] 测试API端点...');
        
        // 测试 /api/auth/users (使用fetch from页面上下文)
        const apiTest = await page.evaluate(async () => {
            try {
                const token = localStorage.getItem('token');
                
                const response = await fetch('/auth/users', {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                return {
                    status: response.status,
                    ok: response.ok,
                    hasAuth: !!response.headers.get('authorization'),
                    url: '/auth/users'
                };
            } catch (error) {
                return {
                    error: error.message
                };
            }
        });
        
        console.log(`  API测试结果: ${JSON.stringify(apiTest)}`);
        
        // 输出请求和响应摘要
        console.log('\n=== 请求摘要 ===');
        console.log(`总请求数: ${requests.length}`);
        console.log(`总响应数: ${responses.length}`);
        
        const authRequests = requests.filter(r => r.hasAuth);
        console.log(`带认证的请求数: ${authRequests.length}`);
        
        const failedResponses = responses.filter(r => r.status === 401);
        console.log(`401响应数: ${failedResponses.length}`);
        
        if (failedResponses.length > 0) {
            console.log('\n=== 401错误详情 ===');
            failedResponses.forEach(r => {
                console.log(`  ${r.status} ${r.url}`);
                
                // 找到对应的请求
                const req = requests.find(rq => rq.url === r.url);
                if (req) {
                    console.log(`    请求方法: ${req.method}`);
                    console.log(`    是否有Auth: ${req.hasAuth}`);
                    if (req.authHeader) {
                        console.log(`    Auth Header: ${req.authHeader.substring(0, 50)}...`);
                    }
                }
            });
        }
        
    } catch (error) {
        console.error('\n❌ 测试过程中出错:');
        console.error(error);
    } finally {
        await browser.close();
    }
    
    console.log('\n=== 调试结束 ===');
    console.log('\n截图已保存到 debug/ 目录');
}

// 运行测试
debugAuth().catch(console.error);
