const { chromium } = require('playwright');
const path = require('path');

async function simpleTest() {
    console.log('=== 简单测试 ===\n');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // 直接访问user-management页面
        console.log('[1] 访问 user-management...');
        await page.goto('http://localhost:3000/user-management');
        
        // 等待页面加载
        await page.waitForTimeout(2000);
        
        // 截图
        await page.screenshot({ path: 'test-01-user-management.png' });
        console.log('  ✓ 页面已加载，截图保存');
        
        // 检查页面内容
        const content = await page.content();
        const hasError = content.includes('加载用户失败');
        const hasUsers = content.includes('user-card');
        
        console.log(`\n页面分析:`);
        console.log(`  是否有错误提示: ${hasError ? '是' : '否'}`);
        console.log(`  是否有用户卡片: ${hasUsers ? '是' : '否'}`);
        
        // 测试API调用
        console.log(`\n[2] 测试 /auth/users API...`);
        const apiTest = await page.evaluate(async () => {
            const token = localStorage.getItem('token');
            console.log(`  Token in localStorage: ${token ? '存在' : '不存在'}`);
            
            const response = await fetch('/auth/users', {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`  Response status: ${response.status}`);
            console.log(`  Response OK: ${response.ok}`);
            
            try {
                const data = await response.json();
                console.log(`  Data: ${JSON.stringify(data)}`);
                return {
                    status: response.status,
                    hasData: Array.isArray(data),
                    dataLength: Array.isArray(data) ? data.length : 0
                };
            } catch (e) {
                console.log(`  JSON parse error: ${e.message}`);
                return {
                    status: response.status,
                    error: e.message
                };
            }
        });
        
        console.log(`\nAPI测试结果:`);
        console.log(`  Status: ${apiTest.status}`);
        console.log(`  Has data: ${apiTest.hasData || 'false'}`);
        console.log(`  Data length: ${apiTest.dataLength || 0}`);
        
        if (apiTest.status === 200 && apiTest.hasData) {
            console.log(`\n✅ 成功！API返回用户数据`);
        } else if (apiTest.status === 401) {
            console.log(`\n❌ 失败！API返回401未授权`);
        } else {
            console.log(`\n⚠️ 异常状态码: ${apiTest.status}`);
        }
        
    } catch (error) {
        console.error('\n❌ 测试出错:');
        console.error(error);
    } finally {
        await browser.close();
    }
    
    console.log('\n=== 测试完成 ===');
}

simpleTest().catch(console.error);
