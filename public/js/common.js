// Fetch拦截器 - 给所有API请求添加token
(function() {
    'use strict';
    
    console.log('[Fetch Interceptor] 加载...');
    
    const originalFetch = window.fetch;
    
    window.fetch = function(...args) {
        const token = localStorage.getItem('token');
        
        // 给 API 请求添加 token（支持 /api/ 和 /auth/ 路径）
        let url = args[0];
        if (typeof url === 'string' && (url.startsWith('/api/') || url.startsWith('/auth/')) && token) {
            if (args[1] && args[1].headers) {
                args[1].headers['Authorization'] = `Bearer ${token}`;
            } else if (args[1]) {
                args[1].headers = {
                    ...args[1].headers,
                    'Authorization': `Bearer ${token}`
                };
            } else {
                args[1] = {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                };
            }
        }
        
        return originalFetch.apply(this, args);
    };
    
    console.log('[Fetch Interceptor] 已加载并生效');
})();

// 全局函数 - 供所有页面使用
window.loadUserMenuPermissions = async function() {
    console.log('[loadUserMenuPermissions] 开始加载用户菜单权限...');
    try {
        const token = localStorage.getItem('token');
        const headers = {};
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/user/menu-permissions', {
            headers: headers
        });
        
        if (response.ok) {
            window.userMenuPermissions = await response.json();
            
            if (window.renderDynamicMenu) {
                window.renderDynamicMenu();
            } else {
                console.warn('[loadUserMenuPermissions] renderDynamicMenu函数不存在');
            }
        } else {
            console.error('[loadUserMenuPermissions] 加载失败:', response.status);
            
            if (window.renderDefaultMenu) {
                window.renderDefaultMenu();
            }
        }
    } catch (error) {
        console.error('[loadUserMenuPermissions] 错误:', error);
    }
};

window.checkPagePermission = function() {
    console.log('[checkPagePermission] 检查页面权限...');
    const currentPath = window.location.pathname;
    
    // 登录页面不需要检查
    if (currentPath === '/login') {
        return true;
    }
    
    if (!window.userMenuPermissions || !window.userMenuPermissions.menus) {
        return true;
    }
    
    function hasPathInMenus(menus, path) {
        for (const menu of menus) {
            if (menu.path && menu.path === path) {
                return true;
            }
            if (menu.items && hasPathInMenus(menu.items, path)) {
                return true;
            }
        }
        return false;
    }
    
    if (!hasPathInMenus(window.userMenuPermissions.menus, currentPath)) {
        alert('您没有权限访问该页面');
        window.location.href = '/';
        return false;
    }
    
    return true;
};

console.log('[Common.js] 全局函数已定义');
