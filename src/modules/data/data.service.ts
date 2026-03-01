import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  Project,
  TestCase,
  TestExecution,
  TestReport,
  StepTemplate,
  Scenario,
  ScenarioExecution,
  AIConfig,
  SystemConfig,
  PaginatedResponse,
  OneTimeSchedule
} from '../../common/interfaces';

@Injectable()
export class DataService {
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly projectsDir = path.join(this.dataDir, 'projects');
  private readonly configPath = path.join(this.dataDir, 'config.json');
  private readonly screenshotsDir = path.join(this.dataDir, 'screenshots');
  private readonly scenariosDir = path.join(this.dataDir, 'scenarios');
  private readonly scenarioExecutionsDir = path.join(this.dataDir, 'scenario-executions');
  private readonly schedulesDir = path.join(this.dataDir, 'schedules');

  constructor() {
    this.ensureDirectories();
    this.ensureDefaultProject();
  }

  private ensureDirectories() {
    [this.projectsDir, this.screenshotsDir, this.scenariosDir, this.scenarioExecutionsDir, this.schedulesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private async ensureDefaultProject() {
    const projects = await this.getProjects();
    if (projects.length === 0) {
      const defaultProject: Project = {
        id: 'default-project',
        name: '默认项目',
        description: '系统默认项目',
        baseUrl: '',
        settings: {
          headless: false,
          slowMo: 200,
          screenshot: {
            enabled: true,
            onStep: false,
            onFailure: true
          },
          timeout: 30000
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await this.saveProject(defaultProject);
    }
  }

  async getProjects(includeDeleted?: boolean): Promise<Project[]> {
    if (!fs.existsSync(this.projectsDir)) {
      return [];
    }

    const projectDirs = fs.readdirSync(this.projectsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    const projects: Project[] = [];
    for (const projectDir of projectDirs) {
      const projectFile = path.join(this.projectsDir, projectDir, 'project.json');
      if (fs.existsSync(projectFile)) {
        const content = fs.readFileSync(projectFile, 'utf-8');
        const project = JSON.parse(content);
        if (includeDeleted || !project.deleted) {
          projects.push(project);
        }
      }
    }

    return projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getProject(id: string): Promise<Project | null> {
    const projectFile = path.join(this.projectsDir, id, 'project.json');
    if (!fs.existsSync(projectFile)) {
      return null;
    }
    const content = fs.readFileSync(projectFile, 'utf-8');
    return JSON.parse(content);
  }

  async saveProject(project: Project): Promise<void> {
    const projectDir = path.join(this.projectsDir, project.id);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    const subdirs = ['test-cases', 'executions', 'reports', 'templates', 'scenarios', 'scenario-reports', 'csv-files'];
    subdirs.forEach(subdir => {
      const dir = path.join(projectDir, subdir);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    const projectFile = path.join(projectDir, 'project.json');
    fs.writeFileSync(projectFile, JSON.stringify(project, null, 2), 'utf-8');
  }

  async deleteProject(id: string): Promise<boolean> {
    if (id === 'default-project') {
      throw new Error('无法删除默认项目');
    }

    const project = await this.getProject(id);
    if (!project) {
      return false;
    }

    project.deleted = true;
    project.updatedAt = new Date();

    const projectFile = path.join(this.projectsDir, id, 'project.json');
    fs.writeFileSync(projectFile, JSON.stringify(project, null, 2), 'utf-8');
    
    console.log(`项目已标记为删除: ${id}`);
    return true;
  }

  async getTestCases(projectId?: string, options?: { page?: number; pageSize?: number; search?: string; startDate?: string; endDate?: string }): Promise<TestCase[] | PaginatedResponse<TestCase>> {
    if (projectId) {
      const project = await this.getProject(projectId);
      if (!project) {
        return [];
      }

      let testCases = await this.getTestCasesInProject(project.id);

      // 过滤条件
      if (options?.search) {
        const search = options.search.toLowerCase();
        testCases = testCases.filter(tc => 
          tc.name.toLowerCase().includes(search) ||
          (tc.description && tc.description.toLowerCase().includes(search)) ||
          (tc.tags && tc.tags.some(tag => tag.toLowerCase().includes(search)))
        );
      }

      if (options?.startDate || options?.endDate) {
        const start = options.startDate ? new Date(options.startDate) : null;
        const end = options.endDate ? new Date(options.endDate) : null;
        
        if (start && end) {
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          testCases = testCases.filter(tc => {
            const created = new Date(tc.createdAt);
            return created >= start && created <= end;
          });
        } else if (start) {
          start.setHours(0, 0, 0, 0);
          testCases = testCases.filter(tc => new Date(tc.createdAt) >= start);
        } else if (end) {
          end.setHours(23, 59, 59, 999);
          testCases = testCases.filter(tc => new Date(tc.createdAt) <= end);
        }
      }

      // 分页
      if (options?.page && options?.pageSize) {
        const page = options.page;
        const pageSize = options.pageSize;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        
        const data = testCases.slice(start, end);
        const total = testCases.length;
        const totalPages = Math.ceil(total / pageSize);
        
        return {
          data,
          total,
          page,
          pageSize,
          totalPages
        };
      }

      return testCases;
    } else {
      return await this.getAllTestCases();
    }
  }

  private async getTestCasesInProject(projectId: string): Promise<TestCase[]> {
    const testCasesDir = path.join(this.projectsDir, projectId, 'test-cases');
    if (!fs.existsSync(testCasesDir)) {
      return [];
    }

    const files = fs.readdirSync(testCasesDir).filter(f => f.endsWith('.json'));
    const testCases: TestCase[] = [];

    for (const file of files) {
      const content = fs.readFileSync(path.join(testCasesDir, file), 'utf-8');
      testCases.push(JSON.parse(content));
    }

    return testCases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllTestCases(options?: { page?: number; pageSize?: number }): Promise<TestCase[] | PaginatedResponse<TestCase>> {
    let testCases: TestCase[] = [];
    
    const projects = await this.getProjects();
    for (const project of projects) {
      const projectTestCases = await this.getTestCasesInProject(project.id);
      testCases.push(...projectTestCases);
    }

    testCases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (options?.page && options?.pageSize) {
      const page = options.page;
      const pageSize = options.pageSize;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      
      const data = testCases.slice(start, end);
      const total = testCases.length;
      const totalPages = Math.ceil(total / pageSize);
      
      return {
        data,
        total,
        page,
        pageSize,
        totalPages
      };
    }

    return testCases;
  }

  async getTestCase(id: string): Promise<TestCase | null> {
    const projects = await this.getProjects();
    for (const project of projects) {
      const testCase = await this.getTestCaseInProject(project.id, id);
      if (testCase) {
        return testCase;
      }
    }
    return null;
  }

  private async getTestCaseInProject(projectId: string, testCaseId: string): Promise<TestCase | null> {
    const filePath = path.join(this.projectsDir, projectId, 'test-cases', `${testCaseId}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  async saveTestCase(testCase: TestCase): Promise<void> {
    if (!testCase.projectId) {
      throw new Error('测试用例必须关联到项目');
    }
    const filePath = path.join(this.projectsDir, testCase.projectId, 'test-cases', `${testCase.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(testCase, null, 2), 'utf-8');
  }

  async deleteTestCase(id: string): Promise<boolean> {
    const testCase = await this.getTestCase(id);
    if (!testCase) {
      return false;
    }
    
    const filePath = path.join(this.projectsDir, testCase.projectId, 'test-cases', `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  async getStepTemplates(projectId: string): Promise<StepTemplate[]> {
    const templatesDir = path.join(this.projectsDir, projectId, 'templates');
    if (!fs.existsSync(templatesDir)) {
      return [];
    }

    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
    const templates: StepTemplate[] = [];
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
      templates.push(JSON.parse(content));
    }
    
    return templates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getStepTemplate(id: string, projectId: string): Promise<StepTemplate | null> {
    const filePath = path.join(this.projectsDir, projectId, 'templates', `${id}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  async saveStepTemplate(template: StepTemplate): Promise<void> {
    if (!template.projectId) {
      throw new Error('步骤模板必须关联到项目');
    }
    const filePath = path.join(this.projectsDir, template.projectId, 'templates', `${template.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(template, null, 2), 'utf-8');
  }

  async deleteStepTemplate(id: string, projectId: string): Promise<boolean> {
    const filePath = path.join(this.projectsDir, projectId, 'templates', `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  async getExecutions(projectId?: string, options?: { page?: number; pageSize?: number; startDate?: string; endDate?: string }): Promise<TestExecution[] | PaginatedResponse<TestExecution>> {
    if (projectId) {
      let executions = await this.getExecutionsByProject(projectId);

      // 时间范围筛选
      if (options?.startDate || options?.endDate) {
        const start = options.startDate ? new Date(options.startDate) : null;
        const end = options.endDate ? new Date(options.endDate) : null;
        
        if (start && end) {
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          executions = executions.filter(e => {
            const startTime = new Date(e.startTime);
            return startTime >= start && startTime <= end;
          });
        } else if (start) {
          start.setHours(0, 0, 0, 0);
          executions = executions.filter(e => new Date(e.startTime) >= start);
        } else if (end) {
          end.setHours(23, 59, 59, 999);
          executions = executions.filter(e => new Date(e.startTime) <= end);
        }
      }

      // 分页
      if (options?.page && options?.pageSize) {
        const page = options.page;
        const pageSize = options.pageSize;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        
        const data = executions.slice(start, end);
        const total = executions.length;
        const totalPages = Math.ceil(total / pageSize);
        
        return {
          data,
          total,
          page,
          pageSize,
          totalPages
        };
      }

      return executions;
     } else {
       return await this.getAllExecutions(options);
     }
   }

   async getAllExecutions(options?: { page?: number; pageSize?: number }): Promise<TestExecution[] | PaginatedResponse<TestExecution>> {
     let allExecutions: TestExecution[] = [];
     
     const projects = await this.getProjects();
     for (const project of projects) {
         const executions = await this.getExecutionsByProject(project.id);
         allExecutions.push(...executions);
     }
     
     allExecutions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

     if (options?.page && options?.pageSize) {
        const page = options.page;
        const pageSize = options.pageSize;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        
        const data = allExecutions.slice(start, end);
        const total = allExecutions.length;
        const totalPages = Math.ceil(total / pageSize);
        
        return {
          data,
          total,
          page,
          pageSize,
          totalPages
        };
     }

     return allExecutions;
   }

  private async getExecutionsByProject(projectId: string): Promise<TestExecution[]> {
    const executionsDir = path.join(this.projectsDir, projectId, 'executions');
    if (!fs.existsSync(executionsDir)) {
      return [];
    }

    const files = fs.readdirSync(executionsDir).filter(f => f.endsWith('.json'));
    const executions: TestExecution[] = [];
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(executionsDir, file), 'utf-8');
      executions.push(JSON.parse(content));
    }
    
    return executions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async getExecution(id: string): Promise<TestExecution | null> {
    const projects = await this.getProjects();
    for (const project of projects) {
      const execution = await this.getExecutionInProject(project.id, id);
      if (execution) {
        return execution;
      }
    }
    return null;
  }

  private async getExecutionInProject(projectId: string, executionId: string): Promise<TestExecution | null> {
    const filePath = path.join(this.projectsDir, projectId, 'executions', `${executionId}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  async saveExecution(execution: TestExecution): Promise<void> {
    if (!execution.projectId) {
      throw new Error('执行记录必须关联到项目');
    }
    const filePath = path.join(this.projectsDir, execution.projectId, 'executions', `${execution.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(execution, null, 2), 'utf-8');
  }

  async deleteExecution(id: string): Promise<boolean> {
    const execution = await this.getExecution(id);
    if (!execution) {
      return false;
    }
    
    const filePath = path.join(this.projectsDir, execution.projectId, 'executions', `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  async getReports(projectId?: string): Promise<TestReport[]> {
    if (projectId) {
      return this.getReportsByProject(projectId);
    }

    const projects = await this.getProjects();
    const allReports: TestReport[] = [];
    
    for (const project of projects) {
      const reports = await this.getReportsByProject(project.id);
      allReports.push(...reports);
    }
    
    return allReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private async getReportsByProject(projectId: string): Promise<TestReport[]> {
    const reports: TestReport[] = [];
    
    const reportsDir = path.join(this.projectsDir, projectId, 'reports');
    if (fs.existsSync(reportsDir)) {
      const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(reportsDir, file), 'utf-8');
        reports.push(JSON.parse(content));
      }
    }
    
    const scenarioReportsDir = path.join(this.projectsDir, projectId, 'scenario-reports');
    if (fs.existsSync(scenarioReportsDir)) {
      const files = fs.readdirSync(scenarioReportsDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(scenarioReportsDir, file), 'utf-8');
        reports.push(JSON.parse(content));
      }
    }
    
    return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getReport(id: string): Promise<TestReport | null> {
    const projects = await this.getProjects();
    for (const project of projects) {
      const report = await this.getReportInProject(project.id, id);
      if (report) {
        return report;
      }
    }
    return null;
  }

  private async getReportInProject(projectId: string, reportId: string): Promise<TestReport | null> {
    const reportsDir = path.join(this.projectsDir, projectId, 'reports');
    const scenarioReportsDir = path.join(this.projectsDir, projectId, 'scenario-reports');
    
    for (const dir of [reportsDir, scenarioReportsDir]) {
      const filePath = path.join(dir, `${reportId}.json`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
    }
    return null;
  }

  async saveReport(report: TestReport): Promise<void> {
    if (!report.projectId) {
      throw new Error('报告必须关联到项目');
    }
    const reportType = report.type || 'test-case';
    const reportDir = reportType === 'scenario' 
      ? path.join(this.projectsDir, report.projectId, 'scenario-reports')
      : path.join(this.projectsDir, report.projectId, 'reports');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    const filePath = path.join(reportDir, `${report.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');
  }

  async deleteReport(id: string): Promise<boolean> {
    const report = await this.getReport(id);
    if (!report) {
      return false;
    }
    
    const reportDir = report.type === 'scenario' ? 'scenario-reports' : 'reports';
    const filePath = path.join(this.projectsDir, report.projectId, reportDir, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  async getSystemConfig(): Promise<SystemConfig> {
    if (!fs.existsSync(this.configPath)) {
      const defaultConfig: SystemConfig = {
        ai: {
          enabled: true,
          provider: 'qwen',
          apiUrl: 'http://10.142.25.235:8088/aimate-core/v1',
          apiKey: 'sk-2532d2b9a2fa487c82c22484e77f18c5',
          model: 'local-Qwen3-32B-no-think',
          temperature: 0.7,
          maxTokens: 2000
        },
        defaultProjectSettings: {
          headless: false,
          slowMo: 200,
          screenshot: {
            enabled: true,
            onStep: false,
            onFailure: true
          },
          timeout: 30000
        }
      };
      await this.saveSystemConfig(defaultConfig);
      return defaultConfig;
    }
    
    const content = fs.readFileSync(this.configPath, 'utf-8');
    return JSON.parse(content);
  }

  async saveSystemConfig(config: SystemConfig): Promise<void> {
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  getScreenshotPath(filename: string): string {
    return path.join(this.screenshotsDir, filename);
  }

  getReportHtmlPath(projectId: string, filename: string): string {
    return path.join(this.projectsDir, projectId, 'reports', filename);
  }

  getScenarioReportHtmlPath(projectId: string, filename: string): string {
    return path.join(this.projectsDir, projectId, 'scenario-reports', filename);
  }

  async exportTestCase(id: string): Promise<string> {
    const testCase = await this.getTestCase(id);
    if (!testCase) {
      throw new Error('测试用例不存在');
    }
    return JSON.stringify(testCase, null, 2);
  }

  async importTestCase(projectId: string, jsonData: string): Promise<TestCase> {
    let testCase: TestCase;
    try {
      testCase = JSON.parse(jsonData);
    } catch (error) {
      throw new Error('无效的JSON格式');
    }

    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    const { v4: uuidv4 } = require('uuid');
    testCase.id = uuidv4();
    testCase.projectId = projectId;
    testCase.createdAt = new Date();
    testCase.updatedAt = new Date();

    await this.saveTestCase(testCase);
    return testCase;
  }

  async getScenarios(projectId?: string): Promise<Scenario[]> {
    if (projectId) {
      const scenarioFile = path.join(this.projectsDir, projectId, 'scenarios.json');
      if (!fs.existsSync(scenarioFile)) {
        return [];
      }
      const content = fs.readFileSync(scenarioFile, 'utf-8');
      return JSON.parse(content);
    } else {
      const scenarios: Scenario[] = [];
      const projects = await this.getProjects();
      for (const project of projects) {
        const projectScenarios = await this.getScenarios(project.id);
        scenarios.push(...projectScenarios);
      }
      return scenarios.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  async getScenario(id: string): Promise<Scenario | null> {
    const projects = await this.getProjects();
    for (const project of projects) {
      const scenario = await this.getScenarioInProject(project.id, id);
      if (scenario) {
        return scenario;
      }
    }
    return null;
  }

  private async getScenarioInProject(projectId: string, scenarioId: string): Promise<Scenario | null> {
    const scenarioFile = path.join(this.projectsDir, projectId, 'scenarios.json');
    if (!fs.existsSync(scenarioFile)) {
      return null;
    }
    const content = fs.readFileSync(scenarioFile, 'utf-8');
    const scenarios = JSON.parse(content);
    return scenarios.find((s: Scenario) => s.id === scenarioId) || null;
  }

  async saveScenario(scenario: Scenario): Promise<void> {
    if (!scenario.projectId) {
      throw new Error('场景必须关联到项目');
    }
    const scenarioFile = path.join(this.projectsDir, scenario.projectId, 'scenarios.json');
    let scenarios: Scenario[] = [];
    
    if (fs.existsSync(scenarioFile)) {
      const content = fs.readFileSync(scenarioFile, 'utf-8');
      scenarios = JSON.parse(content);
    }
    
    const index = scenarios.findIndex(s => s.id === scenario.id);
    if (index >= 0) {
      scenarios[index] = scenario;
    } else {
      scenarios.push(scenario);
    }
    
    fs.writeFileSync(scenarioFile, JSON.stringify(scenarios, null, 2), 'utf-8');
  }

  async deleteScenario(id: string): Promise<boolean> {
    const projects = await this.getProjects();
    for (const project of projects) {
      const scenario = await this.getScenarioInProject(project.id, id);
      if (scenario) {
        const scenarioFile = path.join(this.projectsDir, project.id, 'scenarios.json');
        const content = fs.readFileSync(scenarioFile, 'utf-8');
        const scenarios: Scenario[] = JSON.parse(content);
        const filtered = scenarios.filter(s => s.id !== id);
        fs.writeFileSync(scenarioFile, JSON.stringify(filtered, null, 2), 'utf-8');
        return true;
      }
    }
    return false;
  }

  async getScenarioExecutions(projectId?: string): Promise<ScenarioExecution[]> {
    if (projectId) {
      const execFile = path.join(this.projectsDir, projectId, 'scenario-executions.json');
      if (!fs.existsSync(execFile)) {
        return [];
      }
      const content = fs.readFileSync(execFile, 'utf-8');
      return JSON.parse(content);
    } else {
      const executions: ScenarioExecution[] = [];
      const projects = await this.getProjects();
      for (const project of projects) {
        const projectExecs = await this.getScenarioExecutions(project.id);
        executions.push(...projectExecs);
      }
      return executions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    }
  }

  async getScenarioExecution(id: string): Promise<ScenarioExecution | null> {
    const projects = await this.getProjects();
    for (const project of projects) {
      const exec = await this.getScenarioExecutionInProject(project.id, id);
      if (exec) {
        return exec;
      }
    }
    return null;
  }

  private async getScenarioExecutionInProject(projectId: string, executionId: string): Promise<ScenarioExecution | null> {
    const execFile = path.join(this.projectsDir, projectId, 'scenario-executions.json');
    if (!fs.existsSync(execFile)) {
      return null;
    }
    const content = fs.readFileSync(execFile, 'utf-8');
    const executions: ScenarioExecution[] = JSON.parse(content);
    return executions.find(e => e.id === executionId) || null;
  }

  async saveScenarioExecution(execution: ScenarioExecution): Promise<void> {
    if (!execution.projectId) {
      throw new Error('场景执行必须关联到项目');
    }
    const execFile = path.join(this.projectsDir, execution.projectId, 'scenario-executions.json');
    let executions: ScenarioExecution[] = [];
    
    if (fs.existsSync(execFile)) {
      const content = fs.readFileSync(execFile, 'utf-8');
      executions = JSON.parse(content);
    }
    
    // 检查是否已存在相同ID，存在则更新，否则添加
    const existingIndex = executions.findIndex(e => e.id === execution.id);
    if (existingIndex >= 0) {
      executions[existingIndex] = execution;
    } else {
      executions.push(execution);
    }
    
    fs.writeFileSync(execFile, JSON.stringify(executions, null, 2), 'utf-8');
  }

  async deleteScenarioExecution(id: string): Promise<boolean> {
    const projects = await this.getProjects();
    for (const project of projects) {
      const exec = await this.getScenarioExecutionInProject(project.id, id);
      if (exec) {
        const execFile = path.join(this.projectsDir, project.id, 'scenario-executions.json');
        const content = fs.readFileSync(execFile, 'utf-8');
        const executions: ScenarioExecution[] = JSON.parse(content);
        const filtered = executions.filter(e => e.id !== id);
        fs.writeFileSync(execFile, JSON.stringify(filtered, null, 2), 'utf-8');
        return true;
      }
    }
    return false;
  }

  // ===== 定时任务相关方法 =====
  private getSchedulesFile(): string {
    return path.join(this.schedulesDir, 'one-time-schedules.json');
  }

  async getOneTimeSchedules(): Promise<OneTimeSchedule[]> {
    const file = this.getSchedulesFile();
    if (!fs.existsSync(file)) {
      return [];
    }
    const content = fs.readFileSync(file, 'utf-8');
    return JSON.parse(content);
  }

  async getOneTimeSchedule(id: string): Promise<OneTimeSchedule | null> {
    const schedules = await this.getOneTimeSchedules();
    return schedules.find(s => s.id === id) || null;
  }

  async saveOneTimeSchedule(schedule: OneTimeSchedule): Promise<void> {
    const schedules = await this.getOneTimeSchedules();
    
    // 检查是否已存在相同ID的记录，如果存在则更新
    const index = schedules.findIndex(s => s.id === schedule.id);
    if (index >= 0) {
      schedules[index] = schedule;
    } else {
      schedules.push(schedule);
    }
    

    const file = this.getSchedulesFile();
    fs.writeFileSync(file, JSON.stringify(schedules, null, 2), 'utf-8');
  }

  async deleteOneTimeSchedule(id: string): Promise<boolean> {
    const schedules = await this.getOneTimeSchedules();
    const filtered = schedules.filter(s => s.id !== id);
    
    if (filtered.length === schedules.length) {
      return false;
    }
    
    const file = this.getSchedulesFile();
    fs.writeFileSync(file, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  }

  // ==================== 权限相关方法 ====================

  async getUserProjects(userId: string, userRole: string): Promise<Project[]> {
    const allProjects = await this.getProjects();

    if (userRole === 'admin') {
      return allProjects;
    }

    // 过滤出用户有权限的项目
    return allProjects.filter((project) => {
      if (project.ownerId === userId) {
        return true;
      }

      if (!project.members) {
        return false;
      }

      return project.members.some((m) => m.userId === userId);
    });
  }

  async checkUserProjectPermission(
    userId: string,
    projectId: string,
    userRole: string,
  ): Promise<boolean> {
    const project = await this.getProject(projectId);
    if (!project) {
      return false;
    }

    // 管理员拥有所有权限
    if (userRole === 'admin') {
      return true;
    }

    // 项目所有者拥有所有权限
    if (project.ownerId === userId) {
      return true;
    }

    // 检查是否是项目成员
    if (!project.members) {
      return false;
    }

    return project.members.some((m) => m.userId === userId);
  }

  async setProjectOwner(projectId: string, userId: string): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    project.ownerId = userId;
    await this.saveProject(project);
  }
}