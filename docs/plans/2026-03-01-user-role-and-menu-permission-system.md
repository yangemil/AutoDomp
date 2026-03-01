# 用户角色和菜单权限管理系统实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 为AutoDOMP添加用户管理页面和角色菜单权限管理页面，实现基于角色的动态菜单渲染

**架构:** 使用配置文件驱动角色菜单权限，通过NestJS API提供CRUD操作，前端页面独立管理，main.hbs动态渲染菜单

**技术栈:** NestJS, JWT, bcrypt, Handlebars, HTML/CSS/JS

---

## 前置条件

- 确保项目已启动并可访问
- 确认已存在 `data/users.json` 文件
- 确认认证系统已正常工作（JWT）

---

## 任务概览

1. 创建角色菜单权限配置文件
2. 实现用户管理API
3. 实现角色菜单权限API
4. 创建用户管理页面
5. 创建角色菜单权限管理页面
6. 实现动态菜单渲染
7. 更新权限系统使用说明

---

## 任务1: 创建角色菜单权限配置文件

**Files:**
- Create: `data/role-menu-permissions.json`

**Step 1: 创建配置文件**

创建 `data/role-menu-permissions.json` 文件，包含所有角色和菜单权限配置：

```json
{
  "admin": {
    "name": "系统管理员",
    "description": "拥有所有权限",
    "menus": [
      {
        "id": "home",
        "name": "首页",
        "path": "/"
      },
      {
        "id": "test-management",
        "name": "测试管理",
        "items": [
          { "id": "test-cases", "name": "测试用例", "path": "/test-cases" },
          { "id": "scenarios", "name": "测试场景", "path": "/scenarios" }
        ]
      },
      {
        "id": "schedule",
        "name": "定时",
        "items": [
          { "id": "schedules", "name": "待执行", "path": "/schedules" },
          { "id": "schedule-executions", "name": "已执行", "path": "/schedule-executions" }
        ]
      },
      {
        "id": "execution",
        "name": "执行",
        "items": [
          { "id": "executions", "name": "执行记录", "path": "/executions" },
          { "id": "reports", "name": "测试报告", "path": "/reports" }
        ]
      },
      {
        "id": "log",
        "name": "日志",
        "items": [
          { "id": "log-explorer", "name": "日志查询", "path": "/log-explorer" },
          { "id": "log-management", "name": "日志管理", "path": "/log-management" }
        ]
      },
      {
        "id": "resource",
        "name": "资源",
        "items": [
          { "id": "templates", "name": "步骤模板", "path": "/templates" },
          { "id": "selector-tool", "name": "选择器工具", "path": "/selector-tool" }
        ]
      },
      {
        "id": "project",
        "name": "项目",
        "items": [
          { "id": "projects", "name": "项目管理", "path": "/projects" },
          { "id": "project-members", "name": "项目成员", "path": "/project-members" }
        ]
      },
      {
        "id": "settings",
        "name": "设置",
        "path": "/settings"
      },
      {
        "id": "user-management",
        "name": "用户管理",
        "path": "/user-management"
      },
      {
        "id": "role-menu-permissions",
        "name": "角色菜单权限",
        "path": "/role-menu-permissions"
      }
    ]
  },
  "project_manager": {
    "name": "项目管理员",
    "description": "可以管理分配的项目",
    "menus": [
      { "id": "home", "name": "首页", "path": "/" },
      {
        "id": "test-management",
        "name": "测试管理",
        "items": [
          { "id": "test-cases", "name": "测试用例", "path": "/test-cases" },
          { "id": "scenarios", "name": "测试场景", "path": "/scenarios" }
        ]
      },
      {
        "id": "schedule",
        "name": "定时",
        "items": [
          { "id": "schedules", "name": "待执行", "path": "/schedules" },
          { "id": "schedule-executions", "name": "已执行", "path": "/schedule-executions" }
        ]
      },
      {
        "id": "execution",
        "name": "执行",
        "items": [
          { "id": "executions", "name": "执行记录", "path": "/executions" },
          { "id": "reports", "name": "测试报告", "path": "/reports" }
        ]
      },
      {
        "id": "log",
        "name": "日志",
        "items": [
          { "id": "log-explorer", "name": "日志查询", "path": "/log-explorer" }
        ]
      },
      {
        "id": "resource",
        "name": "资源",
        "items": [
          { "id": "templates", "name": "步骤模板", "path": "/templates" },
          { "id": "selector-tool", "name": "选择器工具", "path": "/selector-tool" }
        ]
      },
      {
        "id": "project",
        "name": "项目",
        "items": [
          { "id": "projects", "name": "项目管理", "path": "/projects" },
          { "id": "project-members", "name": "项目成员", "path": "/project-members" }
        ]
      },
      { "id": "settings", "name": "设置", "path": "/settings" }
    ]
  },
  "tester": {
    "name": "测试人员",
    "description": "可以执行测试和查看报告",
    "menus": [
      { "id": "home", "name": "首页", "path": "/" },
      {
        "id": "test-management",
        "name": "测试管理",
        "items": [
          { "id": "test-cases", "name": "测试用例", "path": "/test-cases" },
          { "id": "scenarios", "name": "测试场景", "path": "/scenarios" }
        ]
      },
      {
        "id": "schedule",
        "name": "定时",
        "items": [
          { "id": "schedules", "name": "待执行", "path": "/schedules" }
        ]
      },
      {
        "id": "execution",
        "name": "执行",
        "items": [
          { "id": "executions", "name": "执行记录", "path": "/executions" },
          { "id": "reports", "name": "测试报告", "path": "/reports" }
        ]
      },
      {
        "id": "log",
        "name": "日志",
        "items": [
          { "id": "log-explorer", "name": "日志查询", "path": "/log-explorer" }
        ]
      }
    ]
  },
  "viewer": {
    "name": "只读用户",
    "description": "只能查看信息",
    "menus": [
      { "id": "home", "name": "首页", "path": "/" },
      {
        "id": "test-management",
        "name": "测试管理",
        "items": [
          { "id": "test-cases", "name": "测试用例", "path": "/test-cases" },
          { "id": "scenarios", "name": "测试场景", "path": "/scenarios" }
        ]
      },
      {
        "id": "execution",
        "name": "执行",
        "items": [
          { "id": "executions", "name": "执行记录", "path": "/executions" },
          { "id": "reports", "name": "测试报告", "path": "/reports" }
        ]
      },
      {
        "id": "log",
        "name": "日志",
        "items": [
          { "id": "log-explorer", "name": "日志查询", "path": "/log-explorer" }
        ]
      }
    ]
  }
}
```

**Step 2: 验证文件创建**

Run: `cat data/role-menu-permissions.json`
Expected: 显示完整的JSON内容

**Step 3: 提交**

```bash
git add data/role-menu-permissions.json
git commit -m "feat: add role menu permissions config file"
```

---

## 任务2: 实现用户管理API

**Files:**
- Modify: `src/modules/auth/auth.controller.ts`
- Modify: `src/modules/auth/auth.service.ts`

**Step 1: 在 AuthService 中添加创建用户的方法**

在 `src/modules/auth/auth.service.ts` 文件末尾的 AuthService 类中添加：

```typescript
async createUser(username: string, email: string, password: string, role: UserRole): Promise<User> {
  const existingUser = this.users.find(
    (u) => u.username === username || u.email === email,
  );

  if (existingUser) {
    throw new ConflictException('用户名或邮箱已存在');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: User = {
    id: uuidv4(),
    username,
    email,
    passwordHash,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  this.users.push(newUser);
  this.saveUsers();

  const { passwordHash: _, ...result } = newUser;
  return result as any;
}
```

**Step 2: 在 AuthController 中添加用户管理路由**

在 `src/modules/auth/auth.controller.ts` 中添加以下方法（在现有方法后）：

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/permissions.decorator';
import { UserRole } from '../../common/interfaces';

// ... 现有代码 ...

@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermissions('admin')
@Get('users')
async getAllUsers() {
  return this.authService.getAllUsers();
}

@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermissions('admin')
@Post('users')
async createUser(@Body() body: { username: string; email: string; password: string; role: UserRole }) {
  return this.authService.createUser(body.username, body.email, body.password, body.role);
}

@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermissions('admin')
@Put('users/:userId/role')
async updateUserRole(@Param('userId') userId: string, @Body() body: { role: UserRole }) {
  return this.authService.updateUserRole(userId, body.role);
}

@UseGuards(AuthGuard, PermissionsGuard)
@RequirePermissions('admin')
@Delete('users/:userId')
async deleteUser(@Param('userId') userId: string) {
  return this.authService.deleteUser(userId);
}
```

**Step 3: 重启应用验证API**

Run: `npm start`
Expected: 应用正常启动，无错误

**Step 4: 测试API（可选）**

使用 Postman 或 curl 测试新添加的API端点

**Step 5: 提交**

```bash
git add src/modules/auth/auth.controller.ts src/modules/auth/auth.service.ts
git commit -m "feat: add user management APIs"
```

---

## 任务3: 实现角色菜单权限API

**Files:**
- Create: `src/modules/role-menu-permissions/role-menu-permissions.module.ts`
- Create: `src/modules/role-menu-permissions/role-menu-permissions.service.ts`
- Create: `src/modules/role-menu-permissions/role-menu-permissions.controller.ts`
- Create: `src/modules/role-menu-permissions/index.ts`
- Modify: `src/app.module.ts`

**Step 1: 创建模块文件**

创建 `src/modules/role-menu-permissions/role-menu-permissions.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { RoleMenuPermissionsController } from './role-menu-permissions.controller';
import { RoleMenuPermissionsService } from './role-menu-permissions.service';

@Module({
  controllers: [RoleMenuPermissionsController],
  providers: [RoleMenuPermissionsService],
  exports: [RoleMenuPermissionsService],
})
export class RoleMenuPermissionsModule {}
```

**Step 2: 创建服务文件**

创建 `src/modules/role-menu-permissions/role-menu-permissions.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface MenuItem {
  id: string;
  name: string;
  path?: string;
  items?: MenuItem[];
}

interface RoleMenuPermissions {
  name: string;
  description: string;
  menus: MenuItem[];
}

interface RoleMenuPermissionsConfig {
  [roleId: string]: RoleMenuPermissions;
}

@Injectable()
export class RoleMenuPermissionsService {
  private configFilePath = path.join(process.cwd(), 'data/role-menu-permissions.json');
  private config: RoleMenuPermissionsConfig = {};

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    try {
      if (fs.existsSync(this.configFilePath)) {
        const content = fs.readFileSync(this.configFilePath, 'utf-8');
        this.config = JSON.parse(content);
      }
    } catch (error) {
      console.error('加载角色菜单权限配置失败:', error);
      this.config = {};
    }
  }

  private saveConfig() {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(this.configFilePath, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存角色菜单权限配置失败:', error);
      throw error;
    }
  }

  getAllRolePermissions(): RoleMenuPermissionsConfig {
    return this.config;
  }

  getRolePermissions(roleId: string): RoleMenuPermissions | null {
    return this.config[roleId] || null;
  }

  updateRolePermissions(roleId: string, permissions: RoleMenuPermissions): RoleMenuPermissions {
    this.config[roleId] = permissions;
    this.saveConfig();
    return permissions;
  }

  hasMenuPermission(roleId: string, menuId: string): boolean {
    const rolePermissions = this.config[roleId];
    if (!rolePermissions) {
      return false;
    }

    return this.checkMenuPermission(rolePermissions.menus, menuId);
  }

  private checkMenuPermission(menus: MenuItem[], menuId: string): boolean {
    for (const menu of menus) {
      if (menu.id === menuId) {
        return true;
      }

      if (menu.items && this.checkMenuPermission(menu.items, menuId)) {
        return true;
      }
    }

    return false;
  }
}
```

**Step 3: 创建控制器文件**

创建 `src/modules/role-menu-permissions/role-menu-permissions.controller.ts`:

```typescript
import { Controller, Get, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RoleMenuPermissionsService } from './role-menu-permissions.service';

interface RoleMenuPermissions {
  name: string;
  description: string;
  menus: any[];
}

@Controller('api/role-menu-permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoleMenuPermissionsController {
  constructor(private readonly roleMenuPermissionsService: RoleMenuPermissionsService) {}

  @RequirePermissions('admin')
  @Get()
  getAllRolePermissions() {
    return this.roleMenuPermissionsService.getAllRolePermissions();
  }

  @RequirePermissions('admin')
  @Get(':roleId')
  getRolePermissions(@Param('roleId') roleId: string) {
    const permissions = this.roleMenuPermissionsService.getRolePermissions(roleId);
    if (!permissions) {
      throw new Error('角色不存在');
    }
    return permissions;
  }

  @RequirePermissions('admin')
  @Put(':roleId')
  updateRolePermissions(
    @Param('roleId') roleId: string,
    @Body() body: { name: string; description: string; menus: any[] },
  ) {
    return this.roleMenuPermissionsService.updateRolePermissions(roleId, body);
  }
}

@Controller('api/user/menu-permissions')
@UseGuards(JwtAuthGuard)
export class UserMenuPermissionsController {
  constructor(private readonly roleMenuPermissionsService: RoleMenuPermissionsService) {}

  @Get()
  getUserMenuPermissions(@Req() req: any) {
    const roleId = req.user.role;
    return this.roleMenuPermissionsService.getRolePermissions(roleId);
  }
}
```

**Step 4: 创建导出文件**

创建 `src/modules/role-menu-permissions/index.ts`:

```typescript
export * from './role-menu-permissions.module';
export * from './role-menu-permissions.service';
export * from './role-menu-permissions.controller';
```

**Step 5: 注册模块到 AppModule**

修改 `src/app.module.ts`，添加导入：

```typescript
import { RoleMenuPermissionsModule } from './modules/role-menu-permissions';

@Module({
  imports: [
    // ... 其他模块
    RoleMenuPermissionsModule,
  ],
  // ...
})
export class AppModule {}
```

**Step 6: 重启应用验证**

Run: `npm start`
Expected: 应用正常启动，新模块加载成功

**Step 7: 提交**

```bash
git add src/modules/role-menu-permissions/ src/app.module.ts
git commit -m "feat: add role menu permissions API"
```

---

## 任务4: 创建用户管理页面

**Files:**
- Create: `views/user-management.hbs`
- Modify: `src/modules/web/view.controller.ts`

**Step 1: 创建用户管理页面HTML**

创建 `views/user-management.hbs`:

```handlebars
<div class="page">
    <div class="page-header">
        <h1>用户管理</h1>
        <button class="btn btn-primary" onclick="showAddUserModal()">+ 新增用户</button>
    </div>

    <div id="usersList"></div>
</div>

<!-- 新增用户模态框 -->
<div id="addUserModal" class="modal" style="display: none;">
    <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
            <h2>新增用户</h2>
            <button type="button" class="btn-close" onclick="closeAddUserModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="addUserForm">
                <div class="form-group">
                    <label>用户名 *</label>
                    <input type="text" id="newUsername" class="form-control" required placeholder="请输入用户名">
                </div>
                <div class="form-group">
                    <label>邮箱 *</label>
                    <input type="email" id="newEmail" class="form-control" required placeholder="请输入邮箱">
                </div>
                <div class="form-group">
                    <label>密码 *</label>
                    <input type="password" id="newPassword" class="form-control" required placeholder="请输入密码（至少6位）" minlength="6">
                </div>
                <div class="form-group">
                    <label>角色 *</label>
                    <select id="newRole" class="form-control" required>
                        <option value="viewer">只读用户 (viewer)</option>
                        <option value="tester">测试人员 (tester)</option>
                        <option value="project_manager">项目管理员 (project_manager)</option>
                        <option value="admin">系统管理员 (admin)</option>
                    </select>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeAddUserModal()">取消</button>
            <button type="button" class="btn btn-primary" onclick="addUser()">添加</button>
        </div>
    </div>
</div>

<!-- 编辑角色模态框 -->
<div id="editRoleModal" class="modal" style="display: none;">
    <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
            <h2>编辑用户角色</h2>
            <button type="button" class="btn-close" onclick="closeEditRoleModal()">&times;</button>
        </div>
        <div class="modal-body">
            <input type="hidden" id="editUserId">
            <div class="form-group">
                <label>当前用户</label>
                <input type="text" id="editUsername" class="form-control" disabled>
            </div>
            <div class="form-group">
                <label>角色 *</label>
                <select id="editRole" class="form-control" required>
                    <option value="viewer">只读用户 (viewer)</option>
                    <option value="tester">测试人员 (tester)</option>
                    <option value="project_manager">项目管理员 (project_manager)</option>
                    <option value="admin">系统管理员 (admin)</option>
                </select>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeEditRoleModal()">取消</button>
            <button type="button" class="btn btn-primary" onclick="updateRole()">保存</button>
        </div>
    </div>
</div>

<style>
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .page-header h1 {
        margin: 0;
        font-size: 24px;
        color: #333;
    }

    .user-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 16px;
        background: #fff;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .user-info h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        color: #333;
    }

    .user-info p {
        margin: 4px 0;
        color: #666;
        font-size: 14px;
    }

    .user-role {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        background: #e3f2fd;
        color: #1976d2;
    }

    .user-actions {
        display: flex;
        gap: 8px;
    }

    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        align-items: center;
        justify-content: center;
    }

    .modal.show {
        display: flex;
    }

    .modal-content {
        background: white;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
    }

    .modal-header {
        padding: 20px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 20px;
    }

    .btn-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
    }

    .btn-close:hover {
        color: #333;
    }

    .modal-body {
        padding: 20px;
    }

    .modal-footer {
        padding: 15px 20px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
    }

    .form-control {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
    }

    .form-control:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
    }
</style>

<script>
    let allUsers = [];

    async function loadUsers() {
        try {
            const response = await fetch('/api/users');
            allUsers = await response.json();
            renderUsers();
        } catch (error) {
            console.error('加载用户失败:', error);
            alert('加载用户失败');
        }
    }

    function renderUsers() {
        const container = document.getElementById('usersList');

        if (allUsers.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">暂无用户</p>';
            return;
        }

        container.innerHTML = allUsers.map(user => `
            <div class="user-card">
                <div class="user-info">
                    <h3>${user.username}</h3>
                    <p>邮箱: ${user.email}</p>
                    <p>角色: <span class="user-role">${getRoleText(user.role)}</span></p>
                    <p>创建时间: ${new Date(user.createdAt).toLocaleString('zh-CN')}</p>
                </div>
                <div class="user-actions">
                    <button class="btn btn-sm btn-secondary" onclick="showEditRoleModal('${user.id}', '${user.username}', '${user.role}')">编辑角色</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}', '${user.username}')">删除用户</button>
                </div>
            </div>
        `).join('');
    }

    function getRoleText(role) {
        const roleMap = {
            'admin': '系统管理员',
            'project_manager': '项目管理员',
            'tester': '测试人员',
            'viewer': '只读用户'
        };
        return roleMap[role] || role;
    }

    function showAddUserModal() {
        document.getElementById('addUserModal').style.display = 'flex';
        document.getElementById('addUserForm').reset();
    }

    function closeAddUserModal() {
        document.getElementById('addUserModal').style.display = 'none';
    }

    async function addUser() {
        const username = document.getElementById('newUsername').value.trim();
        const email = document.getElementById('newEmail').value.trim();
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newRole').value;

        if (!username || !email || !password) {
            alert('请填写所有必填字段');
            return;
        }

        if (password.length < 6) {
            alert('密码至少需要6位');
            return;
        }

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, role })
            });

            const result = await response.json();
            if (response.ok) {
                alert('添加用户成功');
                closeAddUserModal();
                loadUsers();
            } else {
                alert(result.message || result.error || '添加用户失败');
            }
        } catch (error) {
            alert('添加用户失败: ' + error.message);
        }
    }

    function showEditRoleModal(userId, username, currentRole) {
        document.getElementById('editUserId').value = userId;
        document.getElementById('editUsername').value = username;
        document.getElementById('editRole').value = currentRole;
        document.getElementById('editRoleModal').style.display = 'flex';
    }

    function closeEditRoleModal() {
        document.getElementById('editRoleModal').style.display = 'none';
    }

    async function updateRole() {
        const userId = document.getElementById('editUserId').value;
        const role = document.getElementById('editRole').value;

        try {
            const response = await fetch(`/api/users/${userId}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role })
            });

            if (response.ok) {
                alert('更新角色成功');
                closeEditRoleModal();
                loadUsers();
            } else {
                const result = await response.json();
                alert(result.message || result.error || '更新角色失败');
            }
        } catch (error) {
            alert('更新角色失败: ' + error.message);
        }
    }

    async function deleteUser(userId, username) {
        if (!confirm(`确定要删除用户 "${username}" 吗?`)) return;

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('删除用户成功');
                loadUsers();
            } else {
                const result = await response.json();
                alert(result.message || result.error || '删除用户失败');
            }
        } catch (error) {
            alert('删除用户失败: ' + error.message);
        }
    }

    loadUsers();
</script>
```

**Step 2: 在 ViewController 中添加路由**

修改 `src/modules/web/view.controller.ts`，添加路由（在现有路由后）：

```typescript
@Controller()
export class ViewController {
  // ... 现有代码 ...

  @Get('user-management')
  @UseGuards(JwtAuthGuard)
  @Render('user-management')
  userManagement() {
    return { title: '用户管理' };
  }

  @Get('role-menu-permissions')
  @UseGuards(JwtAuthGuard)
  @Render('role-menu-permissions')
  roleMenuPermissions() {
    return { title: '角色菜单权限' };
  }
}
```

**Step 3: 重启应用验证页面**

Run: `npm start`
Expected: 访问 http://localhost:3000/user-management 正常显示

**Step 4: 提交**

```bash
git add views/user-management.hbs src/modules/web/view.controller.ts
git commit -m "feat: add user management page"
```

---

## 任务5: 创建角色菜单权限管理页面

**Files:**
- Create: `views/role-menu-permissions.hbs`

**Step 1: 创建角色菜单权限管理页面HTML**

创建 `views/role-menu-permissions.hbs`:

```handlebars
<div class="page">
    <div class="page-header">
        <h1>角色菜单权限管理</h1>
        <button class="btn btn-primary" onclick="savePermissions()">保存</button>
    </div>

    <div id="rolesList"></div>
</div>

<style>
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .page-header h1 {
        margin: 0;
        font-size: 24px;
        color: #333;
    }

    .role-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        margin-bottom: 16px;
        background: #fff;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .role-header {
        padding: 16px 20px;
        background: #f8f9fa;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .role-header:hover {
        background: #e9ecef;
    }

    .role-title {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .role-title h3 {
        margin: 0;
        font-size: 16px;
        color: #333;
    }

    .toggle-icon {
        font-size: 12px;
        transition: transform 0.3s;
    }

    .toggle-icon.expanded {
        transform: rotate(90deg);
    }

    .role-description {
        margin-left: 20px;
        font-size: 13px;
        color: #666;
    }

    .role-content {
        padding: 20px;
        display: none;
    }

    .role-content.show {
        display: block;
    }

    .menu-tree {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .menu-item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        background: #f8f9fa;
        border-radius: 4px;
        gap: 10px;
    }

    .menu-item.level-1 {
        margin-left: 0;
    }

    .menu-item.level-2 {
        margin-left: 30px;
    }

    .menu-checkbox {
        width: 18px;
        height: 18px;
        cursor: pointer;
    }

    .menu-name {
        flex: 1;
        font-size: 14px;
        color: #333;
    }

    .menu-path {
        font-size: 12px;
        color: #999;
        font-family: monospace;
    }

    .empty-state {
        text-align: center;
        padding: 40px;
        color: #999;
    }
</style>

<script>
    let allRolePermissions = {};
    let currentUserId = null;

    async function loadPermissions() {
        try {
            const response = await fetch('/api/role-menu-permissions');
            allRolePermissions = await response.json();
            renderRoles();
        } catch (error) {
            console.error('加载角色菜单权限失败:', error);
            alert('加载角色菜单权限失败');
        }
    }

    function getCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            currentUserId = user.id;
            return user;
        }
        return null;
    }

    function renderRoles() {
        const container = document.getElementById('rolesList');
        const currentUser = getCurrentUser();

        if (!currentUser || currentUser.role !== 'admin') {
            container.innerHTML = '<p class="empty-state">只有系统管理员可以管理角色菜单权限</p>';
            return;
        }

        const roles = Object.keys(allRolePermissions);

        if (roles.length === 0) {
            container.innerHTML = '<p class="empty-state">暂无角色配置</p>';
            return;
        }

        container.innerHTML = roles.map(roleId => {
            const role = allRolePermissions[roleId];
            return `
                <div class="role-card">
                    <div class="role-header" onclick="toggleRole('${roleId}')">
                        <div class="role-title">
                            <span class="toggle-icon" id="toggle-${roleId}">▶</span>
                            <div>
                                <h3>${role.name} (${roleId})</h3>
                                <p class="role-description">${role.description}</p>
                            </div>
                        </div>
                    </div>
                    <div class="role-content" id="content-${roleId}">
                        ${renderMenuTree(role.menus, roleId)}
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderMenuTree(menus, roleId, level = 1) {
        if (!menus || menus.length === 0) {
            return '<p class="empty-state">该角色暂无菜单权限</p>';
        }

        return menus.map(menu => `
            <div class="menu-item level-${level}">
                <input type="checkbox"
                       class="menu-checkbox"
                       data-role-id="${roleId}"
                       data-menu-id="${menu.id}"
                       id="checkbox-${roleId}-${menu.id}"
                       ${level === 1 ? 'checked' : ''}
                       ${menu.items ? `onchange="toggleChildren('${roleId}', '${menu.id}', this.checked)"` : ''}>
                <label for="checkbox-${roleId}-${menu.id}" class="menu-name">${menu.name}</label>
                ${menu.path ? `<span class="menu-path">${menu.path}</span>` : ''}
            </div>
            ${menu.items ? `
                <div style="margin-left: 20px;">
                    ${renderMenuTree(menu.items, roleId, level + 1)}
                </div>
            ` : ''}
        `).join('');
    }

    function toggleRole(roleId) {
        const content = document.getElementById(`content-${roleId}`);
        const toggle = document.getElementById(`toggle-${roleId}`);

        if (content.classList.contains('show')) {
            content.classList.remove('show');
            toggle.classList.remove('expanded');
        } else {
            content.classList.add('show');
            toggle.classList.add('expanded');
        }
    }

    function toggleChildren(roleId, menuId, checked) {
        const checkboxes = document.querySelectorAll(`input[data-role-id="${roleId}"][data-menu-id^="${menuId}-"]`);
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
    }

    async function savePermissions() {
        const currentUser = getCurrentUser();

        if (!currentUser || currentUser.role !== 'admin') {
            alert('只有系统管理员可以保存角色菜单权限');
            return;
        }

        const updatedRoles = Object.keys(allRolePermissions);
        let hasChanges = false;

        for (const roleId of updatedRoles) {
            const role = allRolePermissions[roleId];
            const updatedMenus = collectMenusFromDOM(role.menus, roleId);

            // 检查是否有变化
            if (JSON.stringify(role.menus) !== JSON.stringify(updatedMenus)) {
                hasChanges = true;
                role.menus = updatedMenus;

                try {
                    await fetch(`/api/role-menu-permissions/${roleId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(role)
                    });
                } catch (error) {
                    alert(`保存角色 ${roleId} 失败: ${error.message}`);
                    return;
                }
            }
        }

        if (hasChanges) {
            alert('保存成功');
        } else {
            alert('没有需要保存的更改');
        }
    }

    function collectMenusFromDOM(menus, roleId) {
        return menus.map(menu => {
            const checkbox = document.getElementById(`checkbox-${roleId}-${menu.id}`);
            const isChecked = checkbox ? checkbox.checked : true;

            const result = {
                id: menu.id,
                name: menu.name
            };

            if (menu.path) {
                result.path = menu.path;
            }

            if (menu.items) {
                result.items = collectMenusFromDOM(menu.items, roleId);
            }

            return result;
        });
    }

    loadPermissions();
</script>
```

**Step 2: 重启应用验证页面**

Run: `npm start`
Expected: 访问 http://localhost:3000/role-menu-permissions 正常显示

**Step 3: 提交**

```bash
git add views/role-menu-permissions.hbs
git commit -m "feat: add role menu permissions management page"
```

---

## 任务6: 实现动态菜单渲染

**Files:**
- Modify: `views/layouts/main.hbs`

**Step 1: 修改main.hbs，添加菜单渲染逻辑**

在 `views/layouts/main.hbs` 中，将现有的导航栏菜单部分替换为动态渲染版本。找到 `<nav class="navbar">` 部分，替换为：

```html
<nav class="navbar">
    <div class="navbar-menu" id="dynamicMenu">
        <!-- 菜单将通过JavaScript动态渲染 -->
        <div class="nav-item">
            <a href="/" class="nav-link">加载中...</a>
        </div>
    </div>
</nav>
```

**Step 2: 添加动态菜单渲染函数**

在 `main.hbs` 的 `<script>` 标签中，添加以下函数（在现有脚本之前）：

```javascript
// 动态菜单渲染
let userMenuPermissions = null;

async function loadUserMenuPermissions() {
    try {
        const response = await fetch('/api/user/menu-permissions');
        if (response.ok) {
            userMenuPermissions = await response.json();
            renderDynamicMenu();
        } else {
            // 如果获取失败，显示默认菜单
            renderDefaultMenu();
        }
    } catch (error) {
        console.error('加载菜单权限失败:', error);
        renderDefaultMenu();
    }
}

function renderDynamicMenu() {
    if (!userMenuPermissions || !userMenuPermissions.menus) {
        renderDefaultMenu();
        return;
    }

    const menuContainer = document.getElementById('dynamicMenu');
    if (!menuContainer) return;

    let menuHTML = '';

    userMenuPermissions.menus.forEach(menu => {
        if (menu.items && menu.items.length > 0) {
            // 分组菜单
            menuHTML += `
                <div class="nav-item dropdown">
                    <a href="#" class="nav-link dropdown-toggle">${menu.name}</a>
                    <div class="dropdown-menu">
                        ${menu.items.map(item => `
                            <a href="${item.path}" class="dropdown-link">${item.name}</a>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (menu.path) {
            // 单个菜单项
            menuHTML += `
                <div class="nav-item">
                    <a href="${menu.path}" class="nav-link">${menu.name}</a>
                </div>
            `;
        }
    });

    menuHTML += `
        <div class="global-project-selector">
            <select id="globalProjectSelect" onchange="handleGlobalProjectChange()">
                <option value="">-- 全局项目 --</option>
            </select>
        </div>
    `;

    menuContainer.innerHTML = menuHTML;

    // 重新加载全局项目选择器
    loadGlobalProjects();
}

function renderDefaultMenu() {
    const menuContainer = document.getElementById('dynamicMenu');
    if (!menuContainer) return;

    menuContainer.innerHTML = `
        <div class="nav-item">
            <a href="/" class="nav-link">首页</a>
        </div>
        <div class="nav-item dropdown">
            <a href="#" class="nav-link dropdown-toggle">测试管理</a>
            <div class="dropdown-menu">
                <a href="/test-cases" class="dropdown-link">测试用例</a>
                <a href="/scenarios" class="dropdown-link">测试场景</a>
            </div>
        </div>
        <div class="nav-item dropdown">
            <a href="#" class="nav-link dropdown-toggle">定时</a>
            <div class="dropdown-menu">
                <a href="/schedules" class="dropdown-link">待执行</a>
                <a href="/schedule-executions" class="dropdown-link">已执行</a>
            </div>
        </div>
        <div class="nav-item dropdown">
            <a href="#" class="nav-link dropdown-toggle">执行</a>
            <div class="dropdown-menu">
                <a href="/executions" class="dropdown-link">执行记录</a>
                <a href="/reports" class="dropdown-link">测试报告</a>
            </div>
        </div>
        <div class="nav-item dropdown">
            <a href="#" class="nav-link dropdown-toggle">日志</a>
            <div class="dropdown-menu">
                <a href="/log-explorer" class="dropdown-link">日志查询</a>
                <a href="/log-management" class="dropdown-link">日志管理</a>
            </div>
        </div>
        <div class="nav-item dropdown">
            <a href="#" class="nav-link dropdown-toggle">资源</a>
            <div class="dropdown-menu">
                <a href="/templates" class="dropdown-link">步骤模板</a>
                <a href="/selector-tool" class="dropdown-link">选择器工具</a>
            </div>
        </div>
        <div class="nav-item dropdown">
            <a href="#" class="nav-link dropdown-toggle">项目</a>
            <div class="dropdown-menu">
                <a href="/projects" class="dropdown-link">项目管理</a>
                <a href="/project-members" class="dropdown-link">项目成员</a>
            </div>
        </div>
        <div class="nav-item">
            <a href="/settings" class="nav-link">设置</a>
        </div>
        <div class="global-project-selector">
            <select id="globalProjectSelect" onchange="handleGlobalProjectChange()">
                <option value="">-- 全局项目 --</option>
            </select>
        </div>
    `;

    loadGlobalProjects();
}

// 检查页面访问权限
function checkPagePermission() {
    const currentPath = window.location.pathname;

    // 登录页面无需检查
    if (currentPath === '/login') {
        return true;
    }

    if (!userMenuPermissions || !userMenuPermissions.menus) {
        return true; // 没有权限信息时允许访问
    }

    // 检查当前路径是否在允许的菜单中
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

    if (!hasPathInMenus(userMenuPermissions.menus, currentPath)) {
        alert('您没有权限访问该页面');
        window.location.href = '/';
        return false;
    }

    return true;
}

// 修改页面加载事件
window.addEventListener('load', function() {
    checkAuth();
    loadUserMenuPermissions();
    setTimeout(checkPagePermission, 500);
});

// 监听菜单权限更新事件
window.addEventListener('menuPermissionsUpdated', function() {
    loadUserMenuPermissions();
});
```

**Step 3: 重启应用测试动态菜单**

Run: `npm start`
Expected:
- 使用admin登录后看到所有菜单
- 使用viewer登录后只看到有限菜单
- 访问无权限页面时提示并跳转

**Step 4: 提交**

```bash
git add views/layouts/main.hbs
git commit -m "feat: implement dynamic menu rendering based on user role"
```

---

## 任务7: 更新权限系统使用说明

**Files:**
- Modify: `权限系统使用说明.md`

**Step 1: 添加用户管理说明**

在 `权限系统使用说明.md` 中找到 `## 📂 项目成员管理` 部分，在其后添加：

```markdown
---

## 👤 用户管理

### 管理系统用户

1. 登录系统（需要 admin 角色）
2. 导航到 **用户管理**
3. 查看所有用户列表
4. 操作：
   - **新增用户**: 点击 "+ 新增用户" 按钮，填写用户名、邮箱、密码和角色
   - **编辑角色**: 点击 "编辑角色" 按钮，选择新的角色
   - **删除用户**: 点击 "删除用户" 按钮，确认后删除

### 用户角色说明

| 角色 | 权限级别 | 说明 |
|------|----------|------|
| **admin** | 最高权限 | 系统管理员,可以访问所有功能和菜单 |
| **project_manager** | 高权限 | 项目管理员,可以管理分配的项目和菜单 |
| **tester** | 中等权限 | 测试人员,可以执行测试和查看报告 |
| **viewer** | 低权限 | 只读用户,只能查看项目信息和报告 |

---

## 🎨 角色菜单权限管理

### 管理角色菜单权限

1. 登录系统（需要 admin 角色）
2. 导航到 **角色菜单权限**
3. 展开要修改的角色
4. 勾选/取消勾选菜单项
5. 点击 "保存" 按钮应用更改

### 菜单权限说明

- **首页**: 系统首页
- **测试管理**: 测试用例、测试场景
- **定时**: 待执行、已执行
- **执行**: 执行记录、测试报告
- **日志**: 日志查询、日志管理
- **资源**: 步骤模板、选择器工具
- **项目**: 项目管理、项目成员
- **设置**: 系统设置
- **用户管理**: 管理系统用户（仅 admin）
- **角色菜单权限**: 管理角色菜单权限（仅 admin）

### 动态菜单

系统会根据用户的角色动态显示菜单：
- 用户只能看到其角色有权限的菜单项
- 角色菜单权限修改后，用户下次登录或刷新页面生效
- 访问无权限的页面时会被重定向到首页
```

**Step 2: 提交**

```bash
git add 权限系统使用说明.md
git commit -m "docs: update permission system documentation"
```

---

## 测试指南

### 测试用户管理

1. 使用 admin 登录
2. 访问 /user-management
3. 新增一个测试用户（角色：tester）
4. 编辑该用户的角色为 viewer
5. 删除该用户

### 测试角色菜单权限

1. 使用 admin 登录
2. 访问 /role-menu-permissions
3. 展开 viewer 角色
4. 取消勾选某些菜单
5. 保存更改

### 测试动态菜单

1. 使用 admin 登录
   - 应该看到所有菜单
   - 可以访问所有页面

2. 使用 viewer 登录
   - 只应该看到部分菜单
   - 无法访问无权限的页面

---

## 验收检查清单

- [ ] 角色菜单权限配置文件已创建
- [ ] 用户管理API正常工作
- [ ] 角色菜单权限API正常工作
- [ ] 用户管理页面可以新增、编辑、删除用户
- [ ] 角色菜单权限页面可以查看和修改权限
- [ ] 动态菜单根据用户角色正确渲染
- [ ] 无权限访问页面时正确重定向
- [ ] 文档已更新

---

## 故障排查

### 菜单不显示

**问题**: 登录后菜单显示"加载中..."或显示不完整

**解决方案**:
1. 检查浏览器控制台是否有错误
2. 确认 `/api/user/menu-permissions` API返回正常
3. 检查用户角色是否正确

### 无法访问用户管理页面

**问题**: 访问 /user-management 提示权限不足

**解决方案**:
1. 确认当前用户角色为 admin
2. 检查 PermissionsGuard 是否正确配置

### 角色菜单权限保存失败

**问题**: 点击保存后提示失败

**解决方案**:
1. 检查 `data/role-menu-permissions.json` 文件是否存在
2. 检查文件权限
3. 查看后端日志
