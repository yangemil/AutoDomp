const { chromium } = require('playwright');
const path = require('path');

async function debugFetch() {
    console.log('=== 调试fetch拦截 ===\n');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        console.log('[步骤1] 访问首页（触发main.hbs的脚本）...');
        await page.goto('http://localhost:3000/');
        await page.waitForTimeout(1000);
        
        console.log('[步骤2] 检查window.fetch是否被拦截...');
        const fetchIntercepted = await page.evaluate(() => {
            // 检查fetch是否被重写
            const originalFetchStr = window.fetch.toString();
            
            console.log('  Fetch函数类型:', typeof window.fetch);
            console.log('  是否包含Bearer token逻辑:', 
                originalFetchStr.includes('Bearer') && 
                originalFetchStr.includes('Authorization'));
            
            return {
                isIntercepted: originalFetchStr.includes('Bearer'),
                isAuthLogic: originalFetchStr.includes('Authorization'),
                fetchSource: originalFetchStr.substring(0, 200)
            };
        });
        
        console.log(`\nFetch拦截检查:`);
        console.log(`  是否被拦截: ${fetchIntercepted.isIntercepted}`);
        console.log(`  包含Auth逻辑: ${fetchIntercepted.isAuthLogic}`);
        console.log(`\nFetch来源:\n${fetchIntercepted.fetchSource}`);
        
        if (!fetchIntercepted.isIntercepted) {
            console.log('\n❌ window.fetch未被正确拦截！');
            console.log('这可能是因为:');
            console.log('  1. main.hbs没有加载');
            console.log('  2. JavaScript加载顺序问题');
            console.log('  3. 浏览器缓存了旧版本');
        }
        
        console.log('\n[步骤3] 测试直接调用fetch...');
        const directTest = await page.evaluate(async () => {
            const token = localStorage.getItem('token');
            console.log(`  localStorage中的token: ${token ? token.substring(0, 30) + '...' : '不存在'}`);
            
            // 测试1: 不带token
            console.log('\n  测试1: 不带token的请求...');
            try {
                const response1 = await fetch('/auth/users', {
                    headers: { 'Content-Type': 'application/json' }
                });
                console.log(`    Response status: ${response1.status}`);
                console.log(`    Response headers:`, JSON.stringify([...response1.headers.entries()]));
            } catch (e) {
                console.log(`    Error: ${e.message}`);
            }
            
            // 测试2: 带token
            console.log('\n  测试2: 带token的请求...');
            try {
                const headers = {
                    'Content-Type': 'application/json'
                };
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                
                const response2 = await fetch('/auth/users', {
                    headers: headers
                });
                console.log(`    Response status: ${response2.status}`);
                console.log(`    Response headers:`, JSON.stringify([...response2.headers.entries()]));
            } catch (e) {
                console.log(`    Error: ${e.message}`);
            }
            
            return {
                test1Success: false,
                test2Success: false
            };
        });
        
        console.log('\n[步骤4] 访问user-management页面并测试...');
        await page.goto('http://localhost:3000/user-management');
        await page.waitForTimeout(2000);
        
        const pageTest = await page.evaluate(async () => {
            console.log('\n在user-management页面测试fetch...');
            
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            console.log(`  发送请求，headers:`, JSON.stringify(headers));
            
            try {
                const response = await fetch('/auth/users', {
                    headers: headers
                });
                console.log(`  Response status: ${response.status}`);
                
                if (response.ok) {
                    console.log(`  ✅ 请求成功！`);
                    return { success: true, status: response.status };
                } else {
                    console.log(`  ❌ 请求失败！`);
                    const text = await response.text();
                    console.log(`  Response text: ${text}`);
                    return { success: false, status: response.status };
                }
            } catch (e) {
                console.log(`  Error: ${e.message}`);
                return { success: false, error: e.message };
            }
        });
        
        console.log(`\n页面测试结果:`);
        console.log(`  Status: ${pageTest.status}`);
        console.log(`  Success: ${pageTest.success || 'false'}`);
        
        if (pageTest.success) {
            console.log('\n✅ user-management页面可以正常访问！');
        } else {
            console.log('\n❌ user-management页面请求失败！');
        }
        
    } catch (error) {
        console.error('\n❌ 测试过程中出错:');
        console.error(error);
    } finally {
        await browser.close();
    }
    
    console.log('\n=== 调试完成 ===');
    console.log('\n请查看浏览器控制台输出的详细信息');
}

debugFetch().catch(console.error);
