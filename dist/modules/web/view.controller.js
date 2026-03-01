"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewController = void 0;
const common_1 = require("@nestjs/common");
const ai_1 = require("../ai");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const data_1 = require("../data");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let ViewController = class ViewController {
    constructor(dataService, aiService) {
        this.dataService = dataService;
        this.aiService = aiService;
    }
    async index(res, page = 1, pageSize = 10) {
        const projects = await this.dataService.getProjects();
        const testCases = await this.dataService.getAllTestCases({ page, pageSize });
        const executions = await this.dataService.getAllExecutions({ page, pageSize });
        const reports = await this.dataService.getReports();
        const testCasesArray = Array.isArray(testCases) ? testCases : testCases.data;
        const executionsArray = Array.isArray(executions) ? executions : executions.data;
        const testCasesTotal = Array.isArray(testCases) ? testCases.length : testCases.total;
        const executionsTotal = Array.isArray(executions) ? executions.length : executions.total;
        const testCasesTotalPages = Array.isArray(testCases) ? Math.ceil(testCases.length / pageSize) : testCases.totalPages;
        const executionsTotalPages = Array.isArray(executions) ? Math.ceil(executions.length / pageSize) : executions.totalPages;
        res.render('index', {
            title: 'AutoDOMP - Web自动化测试平台',
            projects,
            testCases: testCasesArray,
            executions: executionsArray,
            reports,
            stats: {
                totalProjects: projects.length,
                totalTests: testCasesTotal,
                totalExecutions: executionsTotal,
                passedExecutions: executionsArray.filter(e => e.status === 'passed').length,
                failedExecutions: executionsArray.filter(e => e.status === 'failed').length
            },
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                testCasesTotal,
                testCasesTotalPages,
                executionsTotal,
                executionsTotalPages
            }
        });
    }
    async projects(res) {
        res.render('projects', {
            title: '项目管理'
        });
    }
    async projectDetail(id, res) {
        const project = await this.dataService.getProject(id);
        if (!project) {
            return res.status(404).send('项目不存在');
        }
        const testCases = await this.dataService.getTestCases(id);
        const executions = await this.dataService.getExecutions(id);
        res.render('project-detail', {
            title: project.name,
            project,
            testCases,
            executions
        });
    }
    async testCases(res) {
        const projects = await this.dataService.getProjects();
        res.render('test-cases', {
            title: '测试用例',
            projects
        });
    }
    async createTestCase(projectId, res) {
        const project = await this.dataService.getProject(projectId);
        if (!project) {
            return res.status(404).send('项目不存在');
        }
        const config = await this.dataService.getSystemConfig();
        res.render('test-case-form', {
            title: '创建测试用例',
            project,
            testCase: null,
            aiEnabled: config.ai.enabled
        });
    }
    async editTestCaseLegacy(id, res) {
        const testCase = await this.dataService.getTestCase(id);
        if (!testCase) {
            return res.status(404).send('测试用例不存在');
        }
        return res.redirect(`/test-cases/${testCase.projectId}/${id}/edit`);
    }
    async editTestCase(projectId, id, res) {
        const project = await this.dataService.getProject(projectId);
        if (!project) {
            return res.status(404).send('项目不存在');
        }
        const testCase = await this.dataService.getTestCase(id);
        if (!testCase) {
            return res.status(404).send('测试用例不存在');
        }
        res.render('test-case-form', {
            title: '编辑测试用例',
            project,
            testCase,
            aiEnabled: false
        });
    }
    async executions(res) {
        const projects = await this.dataService.getProjects();
        res.render('executions', {
            title: '执行记录',
            projects: projects
        });
    }
    async executionDetail(id, res) {
        let execution = await this.dataService.getScenarioExecution(id);
        let isScenario = true;
        if (!execution) {
            execution = await this.dataService.getExecution(id);
            isScenario = false;
        }
        if (!execution) {
            return res.status(404).send('执行记录不存在');
        }
        let logsSummary = null;
        if (execution.structuredLogs && execution.structuredLogs.length > 0) {
            const logs = execution.structuredLogs;
            logsSummary = {
                total: logs.length,
                byLevel: {
                    debug: logs.filter((l) => l.level === 'debug').length,
                    info: logs.filter((l) => l.level === 'info').length,
                    warn: logs.filter((l) => l.level === 'warn').length,
                    error: logs.filter((l) => l.level === 'error').length,
                    critical: logs.filter((l) => l.level === 'critical').length
                }
            };
        }
        res.render('execution-detail-enhanced', {
            title: '执行详情',
            execution,
            logsSummary,
            isScenario
        });
    }
    async reports(res) {
        const projects = await this.dataService.getProjects();
        res.render('reports', {
            title: '测试报告',
            projects
        });
    }
    async settings(res) {
        const config = await this.dataService.getSystemConfig();
        res.render('settings', {
            title: '系统设置',
            config
        });
    }
    async templates(res) {
        const projects = await this.dataService.getProjects();
        res.render('templates', {
            title: '步骤模板',
            projects
        });
    }
    async scenarios(res) {
        const scenarios = await this.dataService.getScenarios();
        const projects = await this.dataService.getProjects();
        res.render('scenarios', {
            title: '测试场景',
            scenarios,
            projects
        });
    }
    async selectorTool(res) {
        const projects = await this.dataService.getProjects();
        res.render('selector-tool', {
            title: '选择器智能工具',
            projects
        });
    }
    async schedules(res) {
        const projects = await this.dataService.getProjects();
        res.render('schedules', {
            title: '定时任务',
            projects
        });
    }
    async scheduleExecutions(res) {
        res.render('schedule-executions', {
            title: '定时查询'
        });
    }
    async scheduleLogs(res) {
        res.render('schedule-logs', {
            title: '定时任务日志'
        });
    }
    async logExplorer(res) {
        res.render('log-explorer', {
            title: '日志查询'
        });
    }
    async logManagement(res) {
        res.render('log-management', {
            title: '日志管理'
        });
    }
    async login(res) {
        res.render('login', { layout: false });
    }
    async logout(res) {
        res.redirect('/login');
    }
    async projectMembers(res) {
        res.render('project-members');
    }
    async userManagement(res) {
        res.render('user-management', { title: '用户管理' });
    }
    async roleMenuPermissions(res) {
        res.render('role-menu-permissions', { title: '角色菜单权限' });
    }
};
exports.ViewController = ViewController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "index", null);
__decorate([
    (0, common_1.Get)('projects'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "projects", null);
__decorate([
    (0, common_1.Get)('projects/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "projectDetail", null);
__decorate([
    (0, common_1.Get)('test-cases'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "testCases", null);
__decorate([
    (0, common_1.Get)('test-cases/:projectId/create'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "createTestCase", null);
__decorate([
    (0, common_1.Get)('test-cases/:id/edit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "editTestCaseLegacy", null);
__decorate([
    (0, common_1.Get)('test-cases/:projectId/:id/edit'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "editTestCase", null);
__decorate([
    (0, common_1.Get)('executions'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "executions", null);
__decorate([
    (0, common_1.Get)('executions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "executionDetail", null);
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "reports", null);
__decorate([
    (0, common_1.Get)('settings'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "settings", null);
__decorate([
    (0, common_1.Get)('templates'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "templates", null);
__decorate([
    (0, common_1.Get)('scenarios'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "scenarios", null);
__decorate([
    (0, common_1.Get)('selector-tool'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "selectorTool", null);
__decorate([
    (0, common_1.Get)('schedules'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "schedules", null);
__decorate([
    (0, common_1.Get)('schedule-executions'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "scheduleExecutions", null);
__decorate([
    (0, common_1.Get)('schedule-logs'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "scheduleLogs", null);
__decorate([
    (0, common_1.Get)('log-explorer'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "logExplorer", null);
__decorate([
    (0, common_1.Get)('log-management'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "logManagement", null);
__decorate([
    (0, common_1.Get)('login'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('logout'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('project-members'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "projectMembers", null);
__decorate([
    (0, common_1.Get)('user-management'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "userManagement", null);
__decorate([
    (0, common_1.Get)('role-menu-permissions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ViewController.prototype, "roleMenuPermissions", null);
exports.ViewController = ViewController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [data_1.DataService,
        ai_1.AIService])
], ViewController);
//# sourceMappingURL=view.controller.js.map