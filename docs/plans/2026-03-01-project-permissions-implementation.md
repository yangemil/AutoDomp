# 项目权限控制实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 实现项目权限控制功能，确保用户只能看到有权限的项目，新建项目时自动将创建者添加为 admin 成员

**Architecture:** 通过 PermissionsService.getUserProjects() 统一过滤项目列表，在创建项目时自动将创建者添加为成员，在项目详情页添加权限检查

**Tech Stack:** NestJS, TypeScript, Handlebars, JavaScript

---

## Task 1: 修改首页项目列表过滤

**Files:**
- Modify: `src/modules/web/view.controller.ts:15-51`

**Step 1: 分析当前实现**

当前 `index()` 方法使用 `dataService.getProjects()` 获取所有项目，没有权限过滤：
```typescript
const projects = await this.dataService.getProjects();
```

**Step 2: 修改为使用权限服务**

注入 `PermissionsService` 并调用 `getUserProjects()` 方法：
```typescript
import { PermissionsService } from '../permissions/permissions.service';

@Controller()
export class ViewController {
  constructor(
    private readonly dataService: DataService,
    private readonly aiService: AIService,
    private readonly permissionsService: PermissionsService  // 新增
  ) {}

  @Get()
  async index(@Res() res: Response, @Query('page') page: number = 1, @Query('pageSize') pageSize: number = 10) {
    // 获取用户信息需要从请求中获取
    const projects = await this.permissionsService.getUserProjects(
      req.user.userId,
      req.user.role
    );
    
    // 其余代码保持不变...
    res.render('index', {
      title: 'AutoDOMP - Web自动化测试平台',
      projects,
      // ...
    });
  }
}
```

**Step 3: 添加 Request 注入**

修改方法签名以获取请求上下文：
```typescript
@Get()
async index(@Req() req: any, @Res() res: Response, @Query('page') page: number = 1, @Query('pageSize') pageSize: number = 10) {
  const projects = await this.permissionsService.getUserProjects(
    req.user.userId,
    req.user.role
  );
  // ...
}
```

**Step 4: 测试权限过滤**

Run: 启动服务，使用 admin 和 test1 分别访问首页

Expected:
- admin: 看到所有 3 个项目
- test1: 只能看到 1 个项目（litemall）

**Step 5: Commit**

```bash
git add src/modules/web/view.controller.ts
git commit -m "feat: 首页项目列表根据用户权限过滤"
```

---

## Task 2: 修改项目详情权限检查

**Files:**
- Modify: `src/modules/web/view.controller.ts:60-76`

**Step 1: 分析当前实现**

当前 `projectDetail()` 方法没有权限检查，任何用户都可以访问任何项目。

**Step 2: 添加权限检查逻辑**

在获取项目信息后添加权限检查：
```typescript
@Get('projects/:id')
async projectDetail(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
  const project = await this.dataService.getProject(id);
  if (!project) {
    return res.status(404).send('项目不存在');
  }

  // 新增：权限检查
  const hasPermission = await this.permissionsService.checkPermission(
    req.user.userId,
    id,
    'read'
  );

  if (!hasPermission) {
    return res.status(403).json({
      message: '您没有权限访问该项目',
      statusCode: 403
    });
  }
  
  // 原有代码保持不变...
  const testCases = await this.dataService.getTestCases(id);
  const executions = await this.dataService.getExecutions(id);
  
  res.render('project-detail', {
    title: project.name,
    project,
    testCases,
    executions
  });
}
```

**Step 3: 测试权限检查**

Run: 使用 test1 登录，直接访问未授权项目详情页

Expected:
- 返回 403 Forbidden 错误
- 显示权限提示信息

**Step 4: Commit**

```bash
git add src/modules/web/view.controller.ts
git commit -m "feat: 项目详情页面添加权限检查"
```

---

## Task 3: 修改创建项目自动添加成员

**Files:**
- Modify: `src/modules/web/api.controller.ts`

**Step 1: 分析当前实现**

当前 `createProject()` 方法创建项目后没有将创建者添加为成员。

**Step 2: 注入 PermissionsService**

在 ApiController 中注入权限服务：
```typescript
import { PermissionsService } from '../permissions/permissions.service';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class ApiController {
  constructor(
    private readonly dataService: DataService,
    private readonly permissionsService: PermissionsService  // 新增
  ) {}
```

**Step 3: 添加创建者自动为成员逻辑**

在创建项目后添加权限服务调用：
```typescript
@Post('projects')
async createProject(@Req() req: any, @Body() createProjectDto: any) {
  const project = await this.dataService.createProject(createProjectDto);
  
  // 新增：自动将创建者添加为 admin 成员
  await this.permissionsService.addMemberToProject(
    project.id,
    req.user.userId,
    req.user.username,
    'admin',  // 角色
    ['read', 'write', 'execute', 'manage']  // 权限
  );
  
  return project;
}
```

**Step 4: 测试创建项目**

Run: 使用任意用户创建新项目，然后查看项目成员列表

Expected:
- 创建者自动成为项目成员
- 角色为 admin
- 拥有所有权限

**Step 5: Commit**

```bash
git add src/modules/web/api.controller.ts
git commit -m "feat: 创建项目时自动将创建者添加为 admin 成员"
```

---

## Task 4: 修改项目管理页面权限过滤

**Files:**
- Modify: `src/modules/web/view.controller.ts:53-58`

**Step 1: 分析当前实现**

`projects()` 方法只渲染页面，项目列表由前端通过 API 获取。

**Step 2: 无需修改后端**

前端已经使用 `/api/user/projects` 接口获取项目列表，该接口已经实现了权限过滤。

确认前端代码是否正确调用此接口。

**Step 3: 前端验证（可选）**

检查 `views/projects.hbs` 是否正确调用 `/api/user/projects`。

**Step 4: 测试项目管理页面**

Run: 使用 test1 登录，访问项目管理页面

Expected:
- 只能看到 1 个项目
- 页面正常加载无错误

**Step 5: No commit needed**

此任务主要是验证，无需代码修改。

---

## Task 5: 完整功能测试

**Files:**
- No files modified (testing only)

**Step 1: 测试 admin 用户访问首页**

操作：
1. 使用 admin/admin123 登录
2. 访问首页
3. 统计显示的项目数量

Expected:
- 看到 3 个项目
- 所有项目卡片正常显示

**Step 2: 测试 test1 用户访问首页**

操作：
1. 使用 test1 登录
2. 访问首页
3. 统计显示的项目数量

Expected:
- 只能看到 1 个项目（litemall）
- 其他 2 个项目不显示

**Step 3: 测试创建新项目**

操作：
1. 使用 test1 登录
2. 创建新项目
3. 访问项目成员管理页面

Expected:
- 创建成功
- test1 自动成为该项目的 admin 成员
- 首页显示 2 个项目

**Step 4: 测试未授权访问项目详情**

操作：
1. 使用 test1 登录
2. 尝试访问未授权项目的详情页

Expected:
- 返回 403 Forbidden
- 显示权限错误信息

**Step 5: 测试项目选择器**

操作：
1. 使用 test1 登录
2. 访问测试用例页面
3. 查看项目选择器

Expected:
- 只显示有权限的 1 个项目

---

## Task 6: 清理和优化

**Files:**
- No files modified (code review only)

**Step 1: 代码审查**

检查修改的代码：
- 是否正确处理异常
- 是否有重复代码
- 是否符合项目代码风格

**Step 2: 日志记录确认**

确认关键操作有适当的日志：
- 权限检查失败
- 添加成员失败
- 获取项目列表失败

**Step 3: 边界情况测试**

测试边界情况：
- 用户没有权限访问任何项目时
- 项目成员列表为空时
- 权限服务返回异常时

**Step 4: 性能检查**

确认性能：
- 权限过滤不会导致性能问题
- 首页加载速度正常
- 数据库查询效率良好

**Step 5: 文档更新**

更新相关文档：
- API 接口文档
- 权限模型说明
- 使用指南

---

## 总结

本实现计划将完成以下目标：

✅ 用户只能看到有权限的项目
✅ 新建项目时自动将创建者添加为 admin 成员
✅ 所有显示项目的地方都进行权限过滤
✅ 后端统一管理权限逻辑

**预计完成时间：** 30-45 分钟
**修改文件数：** 2 个
**新增测试用例：** 4-5 个
