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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
let DataService = class DataService {
    constructor() {
        this.dataDir = path.join(process.cwd(), 'data');
        this.projectsDir = path.join(this.dataDir, 'projects');
        this.configPath = path.join(this.dataDir, 'config.json');
        this.screenshotsDir = path.join(this.dataDir, 'screenshots');
        this.scenariosDir = path.join(this.dataDir, 'scenarios');
        this.scenarioExecutionsDir = path.join(this.dataDir, 'scenario-executions');
        this.schedulesDir = path.join(this.dataDir, 'schedules');
        this.ensureDirectories();
        this.ensureDefaultProject();
    }
    ensureDirectories() {
        [this.projectsDir, this.screenshotsDir, this.scenariosDir, this.scenarioExecutionsDir, this.schedulesDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    async ensureDefaultProject() {
        const projects = await this.getProjects();
        if (projects.length === 0) {
            const defaultProject = {
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
    async getProjects(includeDeleted) {
        if (!fs.existsSync(this.projectsDir)) {
            return [];
        }
        const projectDirs = fs.readdirSync(this.projectsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        const projects = [];
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
    async getProject(id) {
        const projectFile = path.join(this.projectsDir, id, 'project.json');
        if (!fs.existsSync(projectFile)) {
            return null;
        }
        const content = fs.readFileSync(projectFile, 'utf-8');
        return JSON.parse(content);
    }
    async saveProject(project) {
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
    async deleteProject(id) {
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
    async getTestCases(projectId, options) {
        if (projectId) {
            const project = await this.getProject(projectId);
            if (!project) {
                return [];
            }
            let testCases = await this.getTestCasesInProject(project.id);
            if (options?.search) {
                const search = options.search.toLowerCase();
                testCases = testCases.filter(tc => tc.name.toLowerCase().includes(search) ||
                    (tc.description && tc.description.toLowerCase().includes(search)) ||
                    (tc.tags && tc.tags.some(tag => tag.toLowerCase().includes(search))));
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
                }
                else if (start) {
                    start.setHours(0, 0, 0, 0);
                    testCases = testCases.filter(tc => new Date(tc.createdAt) >= start);
                }
                else if (end) {
                    end.setHours(23, 59, 59, 999);
                    testCases = testCases.filter(tc => new Date(tc.createdAt) <= end);
                }
            }
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
        else {
            return await this.getAllTestCases();
        }
    }
    async getTestCasesInProject(projectId) {
        const testCasesDir = path.join(this.projectsDir, projectId, 'test-cases');
        if (!fs.existsSync(testCasesDir)) {
            return [];
        }
        const files = fs.readdirSync(testCasesDir).filter(f => f.endsWith('.json'));
        const testCases = [];
        for (const file of files) {
            const content = fs.readFileSync(path.join(testCasesDir, file), 'utf-8');
            testCases.push(JSON.parse(content));
        }
        return testCases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    async getAllTestCases(options) {
        let testCases = [];
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
    async getTestCase(id) {
        const projects = await this.getProjects();
        for (const project of projects) {
            const testCase = await this.getTestCaseInProject(project.id, id);
            if (testCase) {
                return testCase;
            }
        }
        return null;
    }
    async getTestCaseInProject(projectId, testCaseId) {
        const filePath = path.join(this.projectsDir, projectId, 'test-cases', `${testCaseId}.json`);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    }
    async saveTestCase(testCase) {
        if (!testCase.projectId) {
            throw new Error('测试用例必须关联到项目');
        }
        const filePath = path.join(this.projectsDir, testCase.projectId, 'test-cases', `${testCase.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(testCase, null, 2), 'utf-8');
    }
    async deleteTestCase(id) {
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
    async getStepTemplates(projectId) {
        const templatesDir = path.join(this.projectsDir, projectId, 'templates');
        if (!fs.existsSync(templatesDir)) {
            return [];
        }
        const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
        const templates = [];
        for (const file of files) {
            const content = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
            templates.push(JSON.parse(content));
        }
        return templates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    async getStepTemplate(id, projectId) {
        const filePath = path.join(this.projectsDir, projectId, 'templates', `${id}.json`);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    }
    async saveStepTemplate(template) {
        if (!template.projectId) {
            throw new Error('步骤模板必须关联到项目');
        }
        const filePath = path.join(this.projectsDir, template.projectId, 'templates', `${template.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(template, null, 2), 'utf-8');
    }
    async deleteStepTemplate(id, projectId) {
        const filePath = path.join(this.projectsDir, projectId, 'templates', `${id}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    }
    async getExecutions(projectId, options) {
        if (projectId) {
            let executions = await this.getExecutionsByProject(projectId);
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
                }
                else if (start) {
                    start.setHours(0, 0, 0, 0);
                    executions = executions.filter(e => new Date(e.startTime) >= start);
                }
                else if (end) {
                    end.setHours(23, 59, 59, 999);
                    executions = executions.filter(e => new Date(e.startTime) <= end);
                }
            }
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
        }
        else {
            return await this.getAllExecutions(options);
        }
    }
    async getAllExecutions(options) {
        let allExecutions = [];
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
    async getExecutionsByProject(projectId) {
        const executionsDir = path.join(this.projectsDir, projectId, 'executions');
        if (!fs.existsSync(executionsDir)) {
            return [];
        }
        const files = fs.readdirSync(executionsDir).filter(f => f.endsWith('.json'));
        const executions = [];
        for (const file of files) {
            const content = fs.readFileSync(path.join(executionsDir, file), 'utf-8');
            executions.push(JSON.parse(content));
        }
        return executions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    }
    async getExecution(id) {
        const projects = await this.getProjects();
        for (const project of projects) {
            const execution = await this.getExecutionInProject(project.id, id);
            if (execution) {
                return execution;
            }
        }
        return null;
    }
    async getExecutionInProject(projectId, executionId) {
        const filePath = path.join(this.projectsDir, projectId, 'executions', `${executionId}.json`);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    }
    async saveExecution(execution) {
        if (!execution.projectId) {
            throw new Error('执行记录必须关联到项目');
        }
        const filePath = path.join(this.projectsDir, execution.projectId, 'executions', `${execution.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(execution, null, 2), 'utf-8');
    }
    async deleteExecution(id) {
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
    async getReports(projectId) {
        if (projectId) {
            return this.getReportsByProject(projectId);
        }
        const projects = await this.getProjects();
        const allReports = [];
        for (const project of projects) {
            const reports = await this.getReportsByProject(project.id);
            allReports.push(...reports);
        }
        return allReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    async getReportsByProject(projectId) {
        const reports = [];
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
    async getReport(id) {
        const projects = await this.getProjects();
        for (const project of projects) {
            const report = await this.getReportInProject(project.id, id);
            if (report) {
                return report;
            }
        }
        return null;
    }
    async getReportInProject(projectId, reportId) {
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
    async saveReport(report) {
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
    async deleteReport(id) {
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
    async getSystemConfig() {
        if (!fs.existsSync(this.configPath)) {
            const defaultConfig = {
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
    async saveSystemConfig(config) {
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
    }
    getScreenshotPath(filename) {
        return path.join(this.screenshotsDir, filename);
    }
    getReportHtmlPath(projectId, filename) {
        return path.join(this.projectsDir, projectId, 'reports', filename);
    }
    getScenarioReportHtmlPath(projectId, filename) {
        return path.join(this.projectsDir, projectId, 'scenario-reports', filename);
    }
    async exportTestCase(id) {
        const testCase = await this.getTestCase(id);
        if (!testCase) {
            throw new Error('测试用例不存在');
        }
        return JSON.stringify(testCase, null, 2);
    }
    async importTestCase(projectId, jsonData) {
        let testCase;
        try {
            testCase = JSON.parse(jsonData);
        }
        catch (error) {
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
    async getScenarios(projectId) {
        if (projectId) {
            const scenarioFile = path.join(this.projectsDir, projectId, 'scenarios.json');
            if (!fs.existsSync(scenarioFile)) {
                return [];
            }
            const content = fs.readFileSync(scenarioFile, 'utf-8');
            return JSON.parse(content);
        }
        else {
            const scenarios = [];
            const projects = await this.getProjects();
            for (const project of projects) {
                const projectScenarios = await this.getScenarios(project.id);
                scenarios.push(...projectScenarios);
            }
            return scenarios.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
    }
    async getScenario(id) {
        const projects = await this.getProjects();
        for (const project of projects) {
            const scenario = await this.getScenarioInProject(project.id, id);
            if (scenario) {
                return scenario;
            }
        }
        return null;
    }
    async getScenarioInProject(projectId, scenarioId) {
        const scenarioFile = path.join(this.projectsDir, projectId, 'scenarios.json');
        if (!fs.existsSync(scenarioFile)) {
            return null;
        }
        const content = fs.readFileSync(scenarioFile, 'utf-8');
        const scenarios = JSON.parse(content);
        return scenarios.find((s) => s.id === scenarioId) || null;
    }
    async saveScenario(scenario) {
        if (!scenario.projectId) {
            throw new Error('场景必须关联到项目');
        }
        const scenarioFile = path.join(this.projectsDir, scenario.projectId, 'scenarios.json');
        let scenarios = [];
        if (fs.existsSync(scenarioFile)) {
            const content = fs.readFileSync(scenarioFile, 'utf-8');
            scenarios = JSON.parse(content);
        }
        const index = scenarios.findIndex(s => s.id === scenario.id);
        if (index >= 0) {
            scenarios[index] = scenario;
        }
        else {
            scenarios.push(scenario);
        }
        fs.writeFileSync(scenarioFile, JSON.stringify(scenarios, null, 2), 'utf-8');
    }
    async deleteScenario(id) {
        const projects = await this.getProjects();
        for (const project of projects) {
            const scenario = await this.getScenarioInProject(project.id, id);
            if (scenario) {
                const scenarioFile = path.join(this.projectsDir, project.id, 'scenarios.json');
                const content = fs.readFileSync(scenarioFile, 'utf-8');
                const scenarios = JSON.parse(content);
                const filtered = scenarios.filter(s => s.id !== id);
                fs.writeFileSync(scenarioFile, JSON.stringify(filtered, null, 2), 'utf-8');
                return true;
            }
        }
        return false;
    }
    async getScenarioExecutions(projectId) {
        if (projectId) {
            const execFile = path.join(this.projectsDir, projectId, 'scenario-executions.json');
            if (!fs.existsSync(execFile)) {
                return [];
            }
            const content = fs.readFileSync(execFile, 'utf-8');
            return JSON.parse(content);
        }
        else {
            const executions = [];
            const projects = await this.getProjects();
            for (const project of projects) {
                const projectExecs = await this.getScenarioExecutions(project.id);
                executions.push(...projectExecs);
            }
            return executions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        }
    }
    async getScenarioExecution(id) {
        const projects = await this.getProjects();
        for (const project of projects) {
            const exec = await this.getScenarioExecutionInProject(project.id, id);
            if (exec) {
                return exec;
            }
        }
        return null;
    }
    async getScenarioExecutionInProject(projectId, executionId) {
        const execFile = path.join(this.projectsDir, projectId, 'scenario-executions.json');
        if (!fs.existsSync(execFile)) {
            return null;
        }
        const content = fs.readFileSync(execFile, 'utf-8');
        const executions = JSON.parse(content);
        return executions.find(e => e.id === executionId) || null;
    }
    async saveScenarioExecution(execution) {
        if (!execution.projectId) {
            throw new Error('场景执行必须关联到项目');
        }
        const execFile = path.join(this.projectsDir, execution.projectId, 'scenario-executions.json');
        let executions = [];
        if (fs.existsSync(execFile)) {
            const content = fs.readFileSync(execFile, 'utf-8');
            executions = JSON.parse(content);
        }
        const existingIndex = executions.findIndex(e => e.id === execution.id);
        if (existingIndex >= 0) {
            executions[existingIndex] = execution;
        }
        else {
            executions.push(execution);
        }
        fs.writeFileSync(execFile, JSON.stringify(executions, null, 2), 'utf-8');
    }
    async deleteScenarioExecution(id) {
        const projects = await this.getProjects();
        for (const project of projects) {
            const exec = await this.getScenarioExecutionInProject(project.id, id);
            if (exec) {
                const execFile = path.join(this.projectsDir, project.id, 'scenario-executions.json');
                const content = fs.readFileSync(execFile, 'utf-8');
                const executions = JSON.parse(content);
                const filtered = executions.filter(e => e.id !== id);
                fs.writeFileSync(execFile, JSON.stringify(filtered, null, 2), 'utf-8');
                return true;
            }
        }
        return false;
    }
    getSchedulesFile() {
        return path.join(this.schedulesDir, 'one-time-schedules.json');
    }
    async getOneTimeSchedules() {
        const file = this.getSchedulesFile();
        if (!fs.existsSync(file)) {
            return [];
        }
        const content = fs.readFileSync(file, 'utf-8');
        return JSON.parse(content);
    }
    async getOneTimeSchedule(id) {
        const schedules = await this.getOneTimeSchedules();
        return schedules.find(s => s.id === id) || null;
    }
    async saveOneTimeSchedule(schedule) {
        const schedules = await this.getOneTimeSchedules();
        const index = schedules.findIndex(s => s.id === schedule.id);
        if (index >= 0) {
            schedules[index] = schedule;
        }
        else {
            schedules.push(schedule);
        }
        const file = this.getSchedulesFile();
        fs.writeFileSync(file, JSON.stringify(schedules, null, 2), 'utf-8');
    }
    async deleteOneTimeSchedule(id) {
        const schedules = await this.getOneTimeSchedules();
        const filtered = schedules.filter(s => s.id !== id);
        if (filtered.length === schedules.length) {
            return false;
        }
        const file = this.getSchedulesFile();
        fs.writeFileSync(file, JSON.stringify(filtered, null, 2), 'utf-8');
        return true;
    }
    async getUserProjects(userId, userRole) {
        const allProjects = await this.getProjects();
        if (userRole === 'admin') {
            return allProjects;
        }
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
    async checkUserProjectPermission(userId, projectId, userRole) {
        const project = await this.getProject(projectId);
        if (!project) {
            return false;
        }
        if (userRole === 'admin') {
            return true;
        }
        if (project.ownerId === userId) {
            return true;
        }
        if (!project.members) {
            return false;
        }
        return project.members.some((m) => m.userId === userId);
    }
    async setProjectOwner(projectId, userId) {
        const project = await this.getProject(projectId);
        if (!project) {
            throw new Error('项目不存在');
        }
        project.ownerId = userId;
        await this.saveProject(project);
    }
};
exports.DataService = DataService;
exports.DataService = DataService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DataService);
//# sourceMappingURL=data.service.js.map