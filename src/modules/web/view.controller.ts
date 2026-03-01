import { Controller, Get, Param, Res, Query, UseGuards, Req } from '@nestjs/common';
import { Response } from 'express';
import { AIService } from '../ai';
import { Public } from '../auth/decorators/public.decorator';
import { DataService } from '../data';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsService } from '../permissions/permissions.service';
import { Permission } from '../../common/interfaces';

@Controller()
export class ViewController {
  constructor(
    private readonly dataService: DataService,
    private readonly aiService: AIService,
    private readonly permissionsService: PermissionsService
  ) {}

  @Get()
  async index(@Req() req: any, @Res() res: Response, @Query('page') page: number = 1, @Query('pageSize') pageSize: number = 10) {
    const projects = await this.permissionsService.getUserProjects(
      req.user.userId,
      req.user.role
    );
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

  @Get('projects')
  async projects(@Res() res: Response) {
    res.render('projects', {
      title: '项目管理'
    });
  }

  @Get('projects/:id')
  async projectDetail(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const project = await this.dataService.getProject(id);
    if (!project) {
      return res.status(404).send('项目不存在');
    }
    
    const hasPermission = await this.permissionsService.checkPermission(
      req.user.userId,
      id,
      Permission.READ
    );
    
    if (!hasPermission) {
      return res.status(403).json({
        message: '您没有权限访问该项目',
        statusCode: 403
      });
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

  @Get('test-cases')
  async testCases(@Res() res: Response) {
    const projects = await this.dataService.getProjects();
    res.render('test-cases', {
      title: '测试用例',
      projects
    });
  }

  @Get('test-cases/:projectId/create')
  async createTestCase(@Param('projectId') projectId: string, @Res() res: Response) {
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

  @Get('test-cases/:id/edit')
  async editTestCaseLegacy(@Param('id') id: string, @Res() res: Response) {
    const testCase = await this.dataService.getTestCase(id);
    if (!testCase) {
      return res.status(404).send('测试用例不存在');
    }
    return res.redirect(`/test-cases/${testCase.projectId}/${id}/edit`);
  }

  @Get('test-cases/:projectId/:id/edit')
  async editTestCase(@Param('projectId') projectId: string, @Param('id') id: string, @Res() res: Response) {
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

  @Get('executions')
  async executions(@Res() res: Response) {
    const projects = await this.dataService.getProjects();
    
    res.render('executions', {
      title: '执行记录',
      projects: projects
    });
  }

  @Get('executions/:id')
  async executionDetail(@Param('id') id: string, @Res() res: Response) {
    // 先尝试查找场景执行
    let execution: any = await this.dataService.getScenarioExecution(id);
    let isScenario = true;
    
    // 如果不是场景执行，尝试查找测试用例执行
    if (!execution) {
      execution = await this.dataService.getExecution(id);
      isScenario = false;
    }
    
    if (!execution) {
      return res.status(404).send('执行记录不存在');
    }
    
    // 如果有结构化日志，获取日志摘要
    let logsSummary = null;
    if (execution.structuredLogs && execution.structuredLogs.length > 0) {
      const logs = execution.structuredLogs;
      logsSummary = {
        total: logs.length,
        byLevel: {
          debug: logs.filter((l: any) => l.level === 'debug').length,
          info: logs.filter((l: any) => l.level === 'info').length,
          warn: logs.filter((l: any) => l.level === 'warn').length,
          error: logs.filter((l: any) => l.level === 'error').length,
          critical: logs.filter((l: any) => l.level === 'critical').length
        }
      };
    }
    
    // 使用增强版页面
    res.render('execution-detail-enhanced', {
      title: '执行详情',
      execution,
      logsSummary,
      isScenario
    });
  }

  @Get('reports')
  async reports(@Res() res: Response) {
    const projects = await this.dataService.getProjects();
    res.render('reports', {
      title: '测试报告',
      projects
    });
  }

  @Get('settings')
  async settings(@Res() res: Response) {
    const config = await this.dataService.getSystemConfig();
    res.render('settings', {
      title: '系统设置',
      config
    });
  }

  @Get('templates')
  async templates(@Res() res: Response) {
    const projects = await this.dataService.getProjects();
    res.render('templates', {
      title: '步骤模板',
      projects
    });
  }

  @Get('scenarios')
  async scenarios(@Res() res: Response) {
    const scenarios = await this.dataService.getScenarios();
    const projects = await this.dataService.getProjects();
    res.render('scenarios', {
      title: '测试场景',
      scenarios,
      projects
    });
  }

  @Get('selector-tool')
  async selectorTool(@Res() res: Response) {
    const projects = await this.dataService.getProjects();
    res.render('selector-tool', {
      title: '选择器智能工具',
      projects
    });
  }

  @Get('schedules')
  async schedules(@Res() res: Response) {
    const projects = await this.dataService.getProjects();
    res.render('schedules', {
      title: '定时任务',
      projects
    });
  }

  @Get('schedule-executions')
  async scheduleExecutions(@Res() res: Response) {
    res.render('schedule-executions', {
      title: '定时查询'
    });
  }

  @Get('schedule-logs')
  async scheduleLogs(@Res() res: Response) {
    res.render('schedule-logs', {
      title: '定时任务日志'
    });
  }

  @Get('log-explorer')
  async logExplorer(@Res() res: Response) {
    res.render('log-explorer', {
      title: '日志查询'
    });
  }

  @Get('log-management')
  async logManagement(@Res() res: Response) {
    res.render('log-management', {
      title: '日志管理'
    });
  }
  
  @Get('login')
  @Public()
  async login(@Res() res: Response) {
    res.render('login', { layout: false });
  }
  
  @Get('logout')
  async logout(@Res() res: Response) {
    // 前端会清除 localStorage
    res.redirect('/login');
  }
  
  @Get('project-members')
  async projectMembers(@Res() res: Response) {
    res.render('project-members');
  }

  @Get('user-management')
  async userManagement(@Res() res: Response) {
    res.render('user-management', { title: '用户管理' });
  }

  @Get('role-menu-permissions')
  async roleMenuPermissions(@Res() res: Response) {
    res.render('role-menu-permissions', { title: '角色菜单权限' });
  }
}
