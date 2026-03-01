# 项目权限控制设计文档

**日期：** 2026-03-01
**作者：** opencode
**状态：** 已批准

---

## 1. 概述

### 1.1 背景

当前系统存在项目权限控制问题：
- 用户可以看到所有项目，不管是否有访问权限
- 新建项目时创建者没有被自动添加为成员
- 需要实现基于用户角色的项目访问控制

### 1.2 目标

- ✅ 用户只能看到有权限访问的项目
- ✅ 新建项目时自动将创建者添加为 admin 成员
- ✅ 所有显示项目的地方都进行权限过滤
- ✅ 后端统一管理权限逻辑

### 1.3 范围

**涉及的功能：**
- 首页（Dashboard）项目列表
- 项目管理页面
- 创建项目功能
- 项目详情页面

**不涉及：**
- 具体操作的细粒度权限检查（如创建测试用例、执行测试等）
- 前端路由权限守卫

---

## 2. 架构设计

### 2.1 权限控制层级

```
用户角色（全局）
   ↓
项目成员（项目级）
   ├─ 角色：admin / member / guest
   └─ 权限：read / write / execute / manage
   ↓
页面访问控制（用户只能看到有权限的项目）
```

### 2.2 权限模型

#### 项目成员角色

| 角色 | 说明 | 默认权限 |
|------|------|----------|
| **admin** | 项目管理员 | 拥有所有权限 |
| **member** | 项目普通成员 | 需要显式指定权限 |
| **guest** | 项目访客 | 只有 read 权限 |

#### 具体权限

| 权限 | 说明 | 适用场景 |
|------|------|----------|
| **read** | 查看权限 | 查看项目信息、测试用例、执行记录 |
| **write** | 编辑权限 | 创建、修改测试用例和配置 |
| **execute** | 执行权限 | 执行测试、运行场景 |
| **manage** | 管理权限 | 添加/移除成员、管理项目设置 |

#### 全局角色到项目权限映射

| 全局角色 | 项目可见性 | 说明 |
|----------|-----------|------|
| **admin** | 所有项目 | 可以看到所有项目，不受限制 |
| **project_manager** | 所有项目 | 可以看到所有项目（根据业务需求调整） |
| **tester** | 有权限的项目 | 只能看到自己是成员的项目 |
| **viewer** | 有权限的项目 | 只能看到自己是成员的项目 |

---

## 3. 核心功能设计

### 3.1 首页项目列表过滤

**文件：** `src/modules/web/view.controller.ts`
**方法：** `index()`

**修改前：**
```typescript
const projects = await this.dataService.getProjects();
```

**修改后：**
```typescript
const projects = await this.permissionsService.getUserProjects(
  req.user.userId,
  req.user.role
);
```

**效果：**
- admin 用户：看到所有项目
- 其他用户：只看到自己是成员的项目

### 3.2 项目详情权限检查

**文件：** `src/modules/web/view.controller.ts`
**方法：** `projectDetail()`

**新增权限检查：**
```typescript
// 检查用户是否有权限访问该项目
const hasPermission = await this.permissionsService.checkPermission(
  req.user.userId,
  id,  // projectId
  'read'
);

if (!hasPermission) {
  return res.status(403).send('您没有权限访问该项目');
}
```

**效果：**
- 用户访问未授权的项目详情页时返回 403

### 3.3 创建项目自动添加成员

**文件：** `src/modules/web/api.controller.ts`
**方法：** `createProject()`

**新增逻辑：**
```typescript
// 创建项目成功后
const createdProject = await this.dataService.createProject(createProjectDto);

// 自动将创建者添加为 admin 成员
await this.permissionsService.addMemberToProject(
  createdProject.id,
  req.user.userId,
  req.user.username,
  'admin',  // 角色
  ['read', 'write', 'execute', 'manage']  // 权限
);
```

**效果：**
- 创建者自动成为项目 admin
- 拥有所有权限

---

## 4. 数据流程

### 4.1 用户访问首页流程

```
用户请求 GET /
   ↓
JwtAuthGuard 验证 token
   ↓
获取用户信息（userId, username, role）
   ↓
调用 PermissionsService.getUserProjects(userId, role)
   ↓
  ├─ admin: 调用 dataService.getProjects()，返回所有项目
  └─ 其他: 过滤 projects，只返回用户是成员的项目
   ↓
渲染首页，传递过滤后的项目列表
   ↓
用户只看到有权限的项目
```

### 4.2 创建项目流程

```
用户提交创建项目 POST /api/projects
   ↓
验证输入参数
   ↓
调用 dataService.createProject() 创建项目
   ↓
调用 permissionsService.addMemberToProject()
   ├─ userId: 创建者ID
   ├─ username: 创建者用户名
   ├─ role: admin
   └─ permissions: ['read', 'write', 'execute', 'manage']
   ↓
返回项目信息
   ↓
创建者自动成为项目 admin
```

### 4.3 用户访问项目详情流程

```
用户请求 GET /projects/:id
   ↓
JwtAuthGuard 验证 token
   ↓
获取项目信息
   ↓
调用 permissionsService.checkPermission(userId, projectId, 'read')
   ↓
  ├─ 有权限: 继续渲染页面
  └─ 无权限: 返回 403 Forbidden
```

---

## 5. 错误处理

### 5.1 场景：用户无权限访问项目

**错误类型：** Forbidden (403)

**处理方式：**
```typescript
if (!hasPermission) {
  return res.status(403).json({
    message: '您没有权限访问该项目',
    statusCode: 403
  });
}
```

**用户体验：**
- 显示清晰的错误信息
- 前端可以跳转到首页或项目列表

### 5.2 场景：API 返回空列表

**处理方式：**
```typescript
const projects = await this.permissionsService.getUserProjects(
  req.user.userId,
  req.user.role
);

// 无论返回空数组还是正常列表，都正常渲染
res.render('index', {
  projects,
  // ...
});
```

**用户体验：**
- 前端显示"暂无项目，立即创建"
- 引导用户创建项目

### 5.3 场景：权限服务异常

**错误类型：** Internal Server Error (500)

**处理方式：**
```typescript
try {
  const projects = await this.permissionsService.getUserProjects(
    req.user.userId,
    req.user.role
  );
  // ...
} catch (error) {
  console.error('获取用户项目列表失败:', error);
  // 降级处理：返回空数组
  const projects = [];
}
```

**用户体验：**
- 不会因为服务异常导致页面崩溃
- 日志记录错误信息供排查

---

## 6. 测试计划

### 6.1 单元测试

**测试用例 1：admin 用户获取项目列表**
- 输入：admin 用户 ID
- 预期：返回所有项目
- 验证：项目数量与系统总项目数一致

**测试用例 2：普通用户获取项目列表**
- 输入：test1 用户 ID（只属于 1 个项目）
- 预期：只返回 1 个项目
- 验证：返回的项目 ID 正确

**测试用例 3：用户无权限访问项目**
- 输入：用户访问未授权的项目
- 预期：返回 false
- 验证：权限检查逻辑正确

### 6.2 集成测试

**测试场景 1：首页项目列表**
- 步骤：
  1. 使用 admin 登录
  2. 访问首页
  3. 记录显示的项目数量
  4. 使用 test1 登录
  5. 访问首页
  6. 记录显示的项目数量
- 预期：test1 只能看到 1 个项目

**测试场景 2：创建项目**
- 步骤：
  1. 使用任意用户创建新项目
  2. 查看项目成员列表
- 预期：创建者自动成为 admin 成员，拥有所有权限

**测试场景 3：访问未授权项目详情**
- 步骤：
  1. 使用 test1 登录
  2. 直接访问未授权项目的详情页 URL
- 预期：返回 403 Forbidden

---

## 7. 实施步骤

### Phase 1: 后端核心修改

**步骤 1.1：修改首页项目列表**
- 文件：`src/modules/web/view.controller.ts`
- 方法：`index()`
- 修改：调用 `permissionsService.getUserProjects()`
- 测试：admin 和 test1 分别访问首页

**步骤 1.2：修改项目详情权限检查**
- 文件：`src/modules/web/view.controller.ts`
- 方法：`projectDetail()`
- 修改：添加权限检查逻辑
- 测试：test1 访问未授权项目

**步骤 1.3：修改创建项目逻辑**
- 文件：`src/modules/web/api.controller.ts`
- 方法：`createProject()`
- 修改：添加创建者自动为成员逻辑
- 测试：创建项目后检查成员列表

### Phase 2: 验证和优化

**步骤 2.1：全功能测试**
- 使用 admin 登录，验证能看到所有项目
- 使用 test1 登录，验证只能看到 1 个项目
- 创建新项目，验证创建者自动成为 admin

**步骤 2.2：边界情况测试**
- 项目没有成员时
- 用户被移除成员后
- 重复添加同一成员

**步骤 2.3：错误场景测试**
- 访问不存在的项目
- API 调用失败
- 并发创建项目

---

## 8. 后续优化建议

### 8.1 短期优化

1. **前端项目列表优化**
   - 添加项目权限标识（自己创建的、有权限的）
   - 优化项目卡片显示

2. **权限提示优化**
   - 无权限时显示更友好的提示
   - 提供"申请权限"功能

### 8.2 长期优化

1. **细粒度权限控制**
   - 实现操作级别的权限检查
   - 为每个 API 端点添加权限验证

2. **权限审计**
   - 记录权限变更历史
   - 提供权限审计日志

3. **权限模板**
   - 预设角色权限模板
   - 快速分配权限

---

## 9. 参考资料

**相关文件：**
- `src/modules/permissions/permissions.service.ts` - 权限服务
- `src/modules/permissions/permissions.controller.ts` - 权限控制器
- `src/modules/web/view.controller.ts` - 视图控制器
- `src/modules/web/api.controller.ts` - API 控制器

**相关接口：**
- `GET /api/user/projects` - 获取用户有权限的项目
- `GET /api/projects/:id` - 获取项目详情
- `POST /api/projects/:id/members` - 添加项目成员
- `PUT /api/projects/:id/members/:userId/permissions` - 更新成员权限
- `DELETE /api/projects/:id/members/:userId` - 移除项目成员

---

**文档版本：** v1.0
**最后更新：** 2026-03-01
