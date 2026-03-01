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
var APIController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIController = void 0;
const common_1 = require("@nestjs/common");
const ai_1 = require("../ai");
const test_engine_1 = require("../test-engine");
const report_1 = require("../report");
const data_1 = require("../data");
const timer_1 = require("../timer");
const playwright_1 = require("playwright");
const fs = require("fs");
const path = require("path");
const uuid_1 = require("uuid");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let APIController = APIController_1 = class APIController {
    constructor(dataService, aiService, testEngineService, reportService, timerService) {
        this.dataService = dataService;
        this.aiService = aiService;
        this.testEngineService = testEngineService;
        this.reportService = reportService;
        this.timerService = timerService;
        this.logger = new common_1.Logger(APIController_1.name);
    }
    async getProjects(includeDeleted) {
        const include = includeDeleted === 'true';
        return await this.dataService.getProjects(include);
    }
    async restoreProject(id) {
        try {
            const project = await this.dataService.getProject(id);
            if (!project) {
                return { success: false, error: '项目不存在' };
            }
            project.deleted = false;
            project.updatedAt = new Date();
            const projectFile = path.join(this.dataService['projectsDir'], id, 'project.json');
            fs.writeFileSync(projectFile, JSON.stringify(project, null, 2), 'utf-8');
            return { success: true, project };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getProject(id) {
        const project = await this.dataService.getProject(id);
        if (!project) {
            return { error: '项目不存在' };
        }
        return project;
    }
    async createProject(project) {
        const newProject = {
            id: (0, uuid_1.v4)(),
            name: project.name || '未命名项目',
            description: project.description || '',
            baseUrl: project.baseUrl || '',
            settings: project.settings || {
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
        await this.dataService.saveProject(newProject);
        return newProject;
    }
    async updateProject(id, project) {
        const existing = await this.dataService.getProject(id);
        if (!existing) {
            return { error: '项目不存在' };
        }
        const updated = {
            ...existing,
            ...project,
            id,
            updatedAt: new Date()
        };
        await this.dataService.saveProject(updated);
        return updated;
    }
    async deleteProject(id) {
        try {
            const deleted = await this.dataService.deleteProject(id);
            return { success: deleted };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getTestCases(projectId, page, pageSize, search, startDate, endDate) {
        return await this.dataService.getTestCases(projectId, { page, pageSize, search, startDate, endDate });
    }
    async getTestCase(id) {
        const testCase = await this.dataService.getTestCase(id);
        if (!testCase) {
            return { error: '测试用例不存在' };
        }
        return testCase;
    }
    async createTestCase(testCase) {
        if (!testCase.projectId) {
            return { error: '必须指定项目ID' };
        }
        const newTestCase = {
            id: (0, uuid_1.v4)(),
            projectId: testCase.projectId,
            name: testCase.name || '未命名测试用例',
            description: testCase.description || '',
            url: testCase.url || '',
            useRelativeUrl: testCase.useRelativeUrl !== false,
            steps: testCase.steps || [],
            expectedResults: testCase.expectedResults || [],
            testData: testCase.testData || {},
            tags: testCase.tags || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await this.dataService.saveTestCase(newTestCase);
        return newTestCase;
    }
    async updateTestCase(id, testCase) {
        const existing = await this.dataService.getTestCase(id);
        if (!existing) {
            return { error: '测试用例不存在' };
        }
        const updated = {
            ...existing,
            ...testCase,
            id,
            updatedAt: new Date()
        };
        await this.dataService.saveTestCase(updated);
        return updated;
    }
    async deleteTestCase(id) {
        const deleted = await this.dataService.deleteTestCase(id);
        return { success: deleted };
    }
    async exportTestCase(id, res) {
        try {
            const jsonData = await this.dataService.exportTestCase(id);
            const testCase = await this.dataService.getTestCase(id);
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${testCase?.name || 'test-case'}.json"`);
            res.send(jsonData);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async importTestCase(data) {
        try {
            const testCase = await this.dataService.importTestCase(data.projectId, data.testCaseData);
            return { success: true, testCase };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getStepTemplates(projectId) {
        return await this.dataService.getStepTemplates(projectId);
    }
    async getStepTemplate(projectId, id) {
        const template = await this.dataService.getStepTemplate(id, projectId);
        if (!template) {
            return { error: '步骤模板不存在' };
        }
        return template;
    }
    async createStepTemplate(template) {
        if (!template.projectId) {
            return { error: '必须指定项目ID' };
        }
        const newTemplate = {
            id: (0, uuid_1.v4)(),
            projectId: template.projectId,
            name: template.name || '未命名模板',
            description: template.description || '',
            steps: template.steps || [],
            tags: template.tags || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await this.dataService.saveStepTemplate(newTemplate);
        return newTemplate;
    }
    async updateStepTemplate(projectId, id, template) {
        const existing = await this.dataService.getStepTemplate(id, projectId);
        if (!existing) {
            return { error: '步骤模板不存在' };
        }
        const updated = {
            ...existing,
            ...template,
            id,
            projectId,
            updatedAt: new Date()
        };
        await this.dataService.saveStepTemplate(updated);
        return updated;
    }
    async deleteStepTemplate(projectId, id) {
        const deleted = await this.dataService.deleteStepTemplate(id, projectId);
        return { success: deleted };
    }
    async generateTestCase(data) {
        try {
            const project = await this.dataService.getProject(data.projectId);
            if (!project) {
                return { success: false, error: '项目不存在' };
            }
            const testCase = await this.aiService.generateTestCase(data.description, project.baseUrl);
            testCase.projectId = data.projectId;
            testCase.useRelativeUrl = true;
            await this.dataService.saveTestCase(testCase);
            return { success: true, testCase };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async testAIConnection(aiConfig) {
        return await this.aiService.testConnection(aiConfig);
    }
    async parseScheduleTime(body) {
        try {
            const config = await this.dataService.getSystemConfig();
            const aiConfig = config.ai;
            if (!aiConfig.enabled) {
                return { success: false, error: 'AI功能未启用，请在系统设置中启用' };
            }
            const prompt = `请解析以下时间描述，转换为标准的Cron表达式或标准日期时间格式。

【重要】Cron表达式格式说明（共5位，用空格分隔）：
- 第1位：分钟 (0-59)，例如：0, 15, 30, 45
- 第2位：小时 (0-23)，例如：0=午夜, 9=早上9点, 15=下午3点, 18=下午6点
- 第3位：日期 (1-31)
- 第4位：月份 (1-12)
- 第5位：星期 (0-6，0是周日，1是周一)

【正确示例】：
- 每天早上9点 -> 0 9 * * *
- 每天下午3点 -> 0 15 * * *
- 每天08:00 -> 0 8 * * *
- 每天15:00 -> 0 15 * * *
- 每周一10:00 -> 0 10 * * 1
- 每周五18:00 -> 0 18 * * 5
- 每月1号9点 -> 0 9 1 * *
- 每月15号0点 -> 0 0 15 * *

【错误示例】（请勿生成这种格式）：
- 0 15 15 * *  ❌ （这表示每月15号15点，不是每天15点）

规则：
1. 如果是具体的一次性时间（如明天08:00），转换为标准ISO日期时间格式：YYYY-MM-DDTHH:mm
2. 如果是重复性的时间（如每天、每周），必须转换为5位Cron表达式，第3、4位必须用*表示任意
3. 请同时给出简短的中文描述说明识别结果

请直接返回JSON格式，不要有其他内容：
{
  "executionDate": "YYYY-MM-DDTHH:mm" (如果是具体时间) 或 null,
  "cronExpression": "5位Cron表达式" (如果是重复时间) 或 null,
  "description": "识别结果的描述"
}

时间描述: ${body.input}`;
            const response = await fetch(`${aiConfig.apiUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${aiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: aiConfig.model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    max_tokens: 500
                })
            });
            if (!response.ok) {
                throw new Error(`AI API请求失败: ${response.status}`);
            }
            const data = await response.json();
            const content = data.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                return {
                    success: true,
                    executionDate: result.executionDate,
                    cronExpression: result.cronExpression,
                    description: result.description
                };
            }
            return { success: false, error: '无法解析AI返回的结果' };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async executeTest(id, options) {
        try {
            const result = await this.testEngineService.executeTestCase(id, options);
            const execution = Array.isArray(result) ? result[0] : result;
            try {
                await this.reportService.generateReport(execution.projectId, [execution.id], `测试用例报告 - ${execution.testCaseName}`);
            }
            catch (reportError) {
                console.error('生成报告失败:', reportError.message);
            }
            return { success: true, execution };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getExecutions(projectId, page, pageSize, startDate, endDate) {
        return await this.dataService.getExecutions(projectId, { page, pageSize, startDate, endDate });
    }
    async getExecution(id) {
        const execution = await this.dataService.getExecution(id);
        if (!execution) {
            return { error: '执行记录不存在' };
        }
        return execution;
    }
    async deleteExecution(id) {
        try {
            const deleted = await this.dataService.deleteExecution(id);
            if (!deleted) {
                return { success: false, error: '执行记录不存在或删除失败' };
            }
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getExecutionFileSize(id) {
        try {
            let execution = await this.dataService.getExecution(id);
            let isScenario = false;
            if (!execution) {
                execution = await this.dataService.getScenarioExecution(id);
                isScenario = true;
            }
            if (!execution) {
                return { size: 0 };
            }
            const project = await this.dataService.getProject(execution.projectId);
            if (!project) {
                return { size: 0 };
            }
            const dirName = isScenario ? 'scenario-executions' : 'executions';
            const filePath = path.join(process.cwd(), 'data', 'projects', project.id, dirName, `${execution.id}.json`);
            if (!fs.existsSync(filePath)) {
                return { size: 0 };
            }
            const stats = fs.statSync(filePath);
            return { size: stats.size };
        }
        catch (error) {
            return { size: 0 };
        }
    }
    async getStructuredLogs(id, level) {
        let execution = await this.dataService.getExecution(id);
        if (!execution) {
            execution = await this.dataService.getScenarioExecution(id);
        }
        if (!execution) {
            return { error: '执行记录不存在' };
        }
        const logs = execution.structuredLogs || [];
        if (level) {
            return logs.filter((log) => log.level === level);
        }
        return logs;
    }
    async getPerformanceMetrics(id) {
        let execution = await this.dataService.getExecution(id);
        if (!execution) {
            execution = await this.dataService.getScenarioExecution(id);
        }
        if (!execution) {
            return { error: '执行记录不存在' };
        }
        return execution.performanceMetrics || null;
    }
    async getEnvironmentInfo(id) {
        let execution = await this.dataService.getExecution(id);
        if (!execution) {
            execution = await this.dataService.getScenarioExecution(id);
        }
        if (!execution) {
            return { error: '执行记录不存在' };
        }
        return execution.environmentInfo || null;
    }
    async getLogsSummary(id) {
        let execution = await this.dataService.getExecution(id);
        if (!execution) {
            execution = await this.dataService.getScenarioExecution(id);
        }
        if (!execution) {
            return { error: '执行记录不存在' };
        }
        const logs = execution.structuredLogs || [];
        const summary = {
            total: logs.length,
            byLevel: {
                debug: 0,
                info: 0,
                warn: 0,
                error: 0,
                critical: 0
            }
        };
        logs.forEach((log) => {
            if (summary.byLevel.hasOwnProperty(log.level)) {
                summary.byLevel[log.level]++;
            }
        });
        return summary;
    }
    async exportLogs(id, format, res) {
        const execution = await this.dataService.getExecution(id);
        if (!execution) {
            return res.status(404).json({ error: '执行记录不存在' });
        }
        const logs = execution.structuredLogs || [];
        if (format === 'json') {
            const jsonContent = JSON.stringify(logs, null, 2);
            res.setHeader('Content-Disposition', `attachment; filename="logs_${id}.json"`);
            res.setHeader('Content-Type', 'application/json');
            return res.send(jsonContent);
        }
        else {
            const headers = ['ID', 'Timestamp', 'Level', 'Message', 'Step Order', 'Duration (ms)', 'Action'];
            const rows = logs.map((log) => [
                log.id,
                log.timestamp,
                log.level,
                log.message,
                log.stepOrder || '',
                log.metadata?.duration || '',
                log.metadata?.action || ''
            ]);
            const csvContent = [headers, ...rows]
                .map(row => row.map(cell => `"${cell}"`).join(','))
                .join('\n');
            res.setHeader('Content-Disposition', `attachment; filename="logs_${id}.csv"`);
            res.setHeader('Content-Type', 'text/csv;charset=utf-8');
            return res.send('\uFEFF' + csvContent);
        }
    }
    async getReports(projectId) {
        return await this.dataService.getReports(projectId);
    }
    async getReport(id) {
        const report = await this.dataService.getReport(id);
        if (!report) {
            return { error: '报告不存在' };
        }
        return report;
    }
    async deleteReport(id) {
        const deleted = await this.dataService.deleteReport(id);
        return { success: deleted };
    }
    async deleteAllReports(projectId) {
        try {
            const reports = await this.dataService.getReports(projectId);
            let deletedCount = 0;
            for (const report of reports) {
                const deleted = await this.dataService.deleteReport(report.id);
                if (deleted)
                    deletedCount++;
            }
            return { success: true, deletedCount };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async generateReport(data) {
        try {
            const report = await this.reportService.generateReport(data.projectId, data.executionIds, data.name, data.description);
            return { success: true, report };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getReportHtml(projectId, filename, res) {
        const fs = require('fs');
        let reportPath = this.dataService.getReportHtmlPath(projectId, filename);
        if (fs.existsSync(reportPath)) {
            return res.sendFile(reportPath);
        }
        reportPath = this.dataService.getScenarioReportHtmlPath(projectId, filename);
        if (fs.existsSync(reportPath)) {
            return res.sendFile(reportPath);
        }
        return res.status(404).send('报告不存在');
    }
    async getConfig() {
        return await this.dataService.getSystemConfig();
    }
    async saveConfig(config) {
        await this.dataService.saveSystemConfig(config);
        return { success: true };
    }
    async getDashboardStats(projectId) {
        const testCases = projectId
            ? await this.dataService.getTestCases(projectId)
            : await this.dataService.getTestCases();
        const executions = projectId
            ? await this.dataService.getExecutions(projectId)
            : await this.dataService.getExecutions();
        const reports = await this.dataService.getReports(projectId);
        const testCasesArray = Array.isArray(testCases) ? testCases : testCases.data;
        const executionsArray = Array.isArray(executions) ? executions : executions.data;
        return {
            totalTestCases: testCasesArray.length,
            totalExecutions: executionsArray.length,
            passedExecutions: executionsArray.filter(e => e.status === 'passed').length,
            failedExecutions: executionsArray.filter(e => e.status === 'failed').length,
            totalReports: reports.length
        };
    }
    async getScenarios(projectId) {
        return await this.dataService.getScenarios(projectId);
    }
    async getScenario(id) {
        const scenario = await this.dataService.getScenario(id);
        if (!scenario) {
            return { error: '场景不存在' };
        }
        const scenarioTestCases = scenario.testCases || [];
        const testCaseIds = scenarioTestCases.map((tc) => tc.id);
        const testCases = await Promise.all(testCaseIds.map((id) => this.dataService.getTestCase(id)));
        return {
            ...scenario,
            testCases: testCases.filter(tc => tc !== null).map((tc, index) => ({
                ...tc,
                loopCount: scenarioTestCases[index]?.loopCount || 1
            }))
        };
    }
    async createScenario(scenario) {
        if (!scenario.projectId) {
            return { error: '必须指定项目ID' };
        }
        const testCases = scenario.testCases || [];
        const testCaseIds = scenario.testCaseIds || [];
        const normalizedTestCases = testCases.length > 0
            ? testCases.map((tc) => ({ id: tc.id, loopCount: tc.loopCount || 1 }))
            : testCaseIds.map((id) => ({ id, loopCount: 1 }));
        const newScenario = {
            id: (0, uuid_1.v4)(),
            projectId: scenario.projectId,
            name: scenario.name || '未命名场景',
            description: scenario.description || '',
            testCases: normalizedTestCases,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await this.dataService.saveScenario(newScenario);
        return newScenario;
    }
    async updateScenario(id, scenario) {
        const existing = await this.dataService.getScenario(id);
        if (!existing) {
            return { error: '场景不存在' };
        }
        const testCases = scenario.testCases || existing.testCases || [];
        const testCaseIds = scenario.testCaseIds || [];
        const normalizedTestCases = testCases.length > 0
            ? testCases.map((tc) => ({ id: tc.id, loopCount: tc.loopCount || 1 }))
            : (existing.testCases || testCaseIds.map((id) => ({ id, loopCount: 1 })));
        const updated = {
            ...existing,
            ...scenario,
            testCases: normalizedTestCases,
            id,
            updatedAt: new Date()
        };
        await this.dataService.saveScenario(updated);
        return updated;
    }
    async deleteScenario(id) {
        const deleted = await this.dataService.deleteScenario(id);
        return { success: deleted };
    }
    async getScenarioExecutions(projectId) {
        return await this.dataService.getScenarioExecutions(projectId);
    }
    async getScenarioExecution(id) {
        const execution = await this.dataService.getScenarioExecution(id);
        if (!execution) {
            return { error: '场景执行记录不存在' };
        }
        return execution;
    }
    async executeScenario(id, options) {
        const loopCount = options?.loopCount || 1;
        try {
            const scenario = await this.dataService.getScenario(id);
            if (!scenario) {
                return { success: false, error: '场景不存在' };
            }
            const project = await this.dataService.getProject(scenario.projectId);
            const config = {
                ...project.settings,
                baseUrl: project.baseUrl,
                ...options
            };
            await this.testEngineService.createScenarioSession(id, config);
            const sharedPage = this.testEngineService.getScenarioPage(id);
            const scenarioTestCases = scenario.testCases || [];
            const testCaseCount = scenarioTestCases.length;
            const globalLoopCount = loopCount || 1;
            const totalTests = scenarioTestCases.reduce((sum, tc) => sum + (tc.loopCount || 1), 0) * globalLoopCount;
            const execution = {
                id: (0, uuid_1.v4)(),
                projectId: scenario.projectId,
                scenarioId: scenario.id,
                scenarioName: scenario.name,
                status: 'running',
                startTime: new Date(),
                executionIds: [],
                totalTests,
                passedTests: 0,
                failedTests: 0,
                logs: [`开始执行场景: ${scenario.name}`, `包含 ${testCaseCount} 个测试用例`, `全局循环: ${globalLoopCount}`, `使用共享浏览器会话`],
                context: {}
            };
            await this.dataService.saveScenarioExecution(execution);
            let passedCount = 0;
            let failedCount = 0;
            const testExecutionIds = [];
            let scenarioContext = {};
            let executionIndex = 0;
            for (let loop = 0; loop < globalLoopCount; loop++) {
                if (globalLoopCount > 1) {
                    execution.logs.push(`\n=== 第 ${loop + 1}/${globalLoopCount} 轮 ===`);
                }
                for (let i = 0; i < scenarioTestCases.length; i++) {
                    const scenarioTestCase = scenarioTestCases[i];
                    const testCaseId = scenarioTestCase.id;
                    const testCaseLoopCount = scenarioTestCase.loopCount || 1;
                    const testCase = await this.dataService.getTestCase(testCaseId);
                    if (!testCase) {
                        execution.logs.push(`测试用例 ${testCaseId} 不存在，跳过`);
                        failedCount++;
                        continue;
                    }
                    for (let tcLoop = 0; tcLoop < testCaseLoopCount; tcLoop++) {
                        executionIndex++;
                        const loopPrefix = globalLoopCount > 1 ? `[轮${loop + 1}] ` : '';
                        const tcLoopPrefix = testCaseLoopCount > 1 ? `${loopPrefix}[${testCase.name} 第${tcLoop + 1}次] ` : loopPrefix;
                        execution.logs.push(`${tcLoopPrefix}[${executionIndex}/${totalTests}] 开始执行: ${testCase.name}`);
                        execution.logs.push(`${tcLoopPrefix}[${executionIndex}/${totalTests}] 当前上下文: ${JSON.stringify(scenarioContext)}`);
                        try {
                            const testExecutionResult = await this.testEngineService.executeTestCase(testCaseId, { ...options, scenarioContext }, scenarioContext, sharedPage);
                            const testExecution = Array.isArray(testExecutionResult) ? testExecutionResult[0] : testExecutionResult;
                            if (testExecution && testExecution.id) {
                                testExecutionIds.push(testExecution.id);
                                if (testExecution.context && Object.keys(testExecution.context).length > 0) {
                                    execution.logs.push(`${tcLoopPrefix}[${executionIndex}/${totalTests}] 测试用例输出上下文: ${JSON.stringify(testExecution.context)}`);
                                    Object.assign(scenarioContext, testExecution.context);
                                }
                                if (testExecution.status === 'passed') {
                                    passedCount++;
                                    execution.logs.push(`${tcLoopPrefix}[${executionIndex}/${totalTests}] ${testCase.name}: 通过`);
                                }
                                else {
                                    failedCount++;
                                    execution.logs.push(`${tcLoopPrefix}[${executionIndex}/${totalTests}] ${testCase.name}: 失败 - ${testExecution.error || '未知错误'}`);
                                }
                            }
                            else {
                                failedCount++;
                                execution.logs.push(`${tcLoopPrefix}[${executionIndex}/${totalTests}] ${testCase.name}: 执行失败`);
                            }
                        }
                        catch (error) {
                            failedCount++;
                            execution.logs.push(`${tcLoopPrefix}[${executionIndex}/${totalTests}] ${testCase.name}: 异常 - ${error.message}`);
                        }
                    }
                }
            }
            await this.testEngineService.closeScenarioSession(id);
            execution.executionIds = testExecutionIds;
            execution.passedTests = passedCount;
            execution.failedTests = failedCount;
            execution.status = failedCount === 0 ? 'passed' : 'failed';
            execution.endTime = new Date();
            execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
            execution.context = scenarioContext;
            execution.logs.push(`\n场景执行完成，共执行 ${loopCount} 轮，总计 ${testExecutionIds.length} 个测试用例，通过 ${passedCount} 个，失败 ${failedCount} 个`);
            execution.logs.push(`场景最终上下文: ${JSON.stringify(scenarioContext)}`);
            await this.dataService.saveScenarioExecution(execution);
            let report = null;
            try {
                report = await this.reportService.generateScenarioReport(execution);
                execution.logs.push(`\n测试报告已生成: ${report.name}`);
            }
            catch (reportError) {
                execution.logs.push(`\n生成报告失败: ${reportError.message}`);
                this.logger.error(`生成场景报告失败: ${reportError.message}`);
            }
            return { success: true, execution, report };
        }
        catch (error) {
            await this.testEngineService.closeScenarioSession(id);
            return { success: false, error: error.message };
        }
    }
    async deleteScenarioExecution(id) {
        const deleted = await this.dataService.deleteScenarioExecution(id);
        return { success: deleted };
    }
    async optimizeSelector(body) {
        const { url, selector, cookies, description } = body;
        if (!url || !selector) {
            return { success: false, error: 'URL和选择器不能为空' };
        }
        let browser = null;
        let page = null;
        try {
            browser = await playwright_1.chromium.launch({ headless: true });
            const context = await browser.newContext();
            if (cookies) {
                const urlObj = new URL(url);
                const cookieArray = cookies.split(';').map(c => {
                    const [name, ...valueParts] = c.trim().split('=');
                    return {
                        name: name.trim(),
                        value: valueParts.join('=').trim(),
                        domain: '.' + urlObj.hostname,
                        path: '/'
                    };
                });
                await context.addCookies(cookieArray);
            }
            page = await context.newPage();
            const navigationTimeout = 60000;
            let pageLoaded = false;
            try {
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: navigationTimeout });
                pageLoaded = true;
            }
            catch (navError) {
                if (navError.message.includes('Timeout')) {
                    this.logger.warn(`页面导航超时: ${navError.message}`);
                }
                else {
                    this.logger.warn(`页面导航错误: ${navError.message}`);
                }
            }
            await page.waitForTimeout(3000);
            const pageContent = await page.content();
            if (!pageContent || pageContent.length < 100) {
                return {
                    success: false,
                    error: '页面加载失败',
                    hint: cookies ? '请检查Cookie是否有效。Cookie格式应为: name1=value1; name2=value2' : '请检查URL是否正确'
                };
            }
            const pageUrl = page.url();
            const isLoginPage = pageUrl.includes('/login') || pageContent.includes('登录') || pageContent.includes('login');
            if (isLoginPage && !pageUrl.includes(url.split('/').pop())) {
                return {
                    success: false,
                    error: '页面仍然显示登录页，说明Cookie已失效或格式不正确',
                    hint: '请重新获取有效的Cookie'
                };
            }
            if (!pageLoaded && pageContent.length > 100) {
                this.logger.log('页面部分加载，继续尝试解析');
            }
            let elementInfo = null;
            let suggestedSelector = null;
            try {
                const element = page.locator(selector);
                const count = await element.count();
                if (count === 0) {
                    this.logger.log(`原始选择器未找到元素: ${selector}, description: ${description}`);
                    if (description) {
                        this.logger.log('根据描述让AI生成选择器...');
                        let pageElementInfo = null;
                        try {
                            const sampleElement = page.locator('.el-cascader, .el-input, input, button').first();
                            const sampleCount = await sampleElement.count();
                            if (sampleCount > 0) {
                                pageElementInfo = await sampleElement.evaluate((el) => {
                                    return {
                                        tag: el.tagName.toLowerCase(),
                                        id: el.id || undefined,
                                        name: el.name || undefined,
                                        className: el.className || undefined,
                                        placeholder: el.placeholder || undefined
                                    };
                                });
                            }
                        }
                        catch (e) {
                            this.logger.warn('获取页面元素信息失败');
                        }
                        const aiResult = await this.aiService.optimizeSelector({
                            tag: pageElementInfo?.tag || 'input',
                            id: pageElementInfo?.id,
                            name: pageElementInfo?.name,
                            className: pageElementInfo?.className,
                            placeholder: pageElementInfo?.placeholder,
                            description: description
                        });
                        return {
                            success: true,
                            original: selector,
                            elementInfo: pageElementInfo || { note: '基于描述推断' },
                            suggested: aiResult.selector,
                            reason: aiResult.reason + '（原始选择器未找到，使用描述生成）',
                            stability: aiResult.stability,
                            note: '原始选择器未找到，已根据元素描述生成推荐选择器'
                        };
                    }
                    return {
                        success: false,
                        error: `未找到元素: ${selector}`,
                        hint: '选择器包含动态ID，请提供元素描述让AI生成稳定选择器'
                    };
                }
                elementInfo = await element.first().evaluate((el) => {
                    return {
                        tag: el.tagName.toLowerCase(),
                        id: el.id || undefined,
                        name: el.name || undefined,
                        className: el.className || undefined,
                        placeholder: el.placeholder || undefined,
                        type: el.type || undefined,
                        text: el.textContent?.trim().substring(0, 100) || undefined
                    };
                });
            }
            catch (elementError) {
                return { success: false, error: `无法定位元素: ${elementError.message}` };
            }
            if (!elementInfo) {
                return { success: false, error: '无法获取元素信息' };
            }
            const result = await this.aiService.optimizeSelector({
                ...elementInfo,
                description
            });
            return {
                success: true,
                original: selector,
                elementInfo,
                suggested: result.selector,
                reason: result.reason,
                stability: result.stability
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
        finally {
            if (browser) {
                await browser.close();
            }
        }
    }
    async getSchedules() {
        return await this.timerService.getSchedules();
    }
    async getSchedule(id) {
        const schedule = await this.timerService.getSchedule(id);
        if (!schedule) {
            return { error: '定时任务不存在' };
        }
        return schedule;
    }
    async createSchedule(schedule) {
        if (!schedule.projectId || !schedule.scenarioId) {
            return { error: '必须指定项目ID和场景ID' };
        }
        if (!schedule.executionDate && !schedule.cronExpression) {
            return { error: '必须指定执行时间或Cron表达式' };
        }
        try {
            const newSchedule = await this.timerService.createSchedule(schedule);
            return { success: true, schedule: newSchedule };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async updateSchedule(id, schedule) {
        try {
            const updated = await this.timerService.updateSchedule(id, schedule);
            if (!updated) {
                return { success: false, error: '定时任务不存在' };
            }
            return { success: true, schedule: updated };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async deleteSchedule(id) {
        try {
            const deleted = await this.timerService.deleteSchedule(id);
            return { success: deleted };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async cancelSchedule(id) {
        try {
            const schedule = await this.timerService.cancelSchedule(id);
            return { success: true, schedule };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async runScheduleNow(id) {
        try {
            const schedule = await this.timerService.runNow(id);
            if (!schedule) {
                return { success: false, error: '定时任务不存在或无法执行' };
            }
            return { success: true, schedule };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async uploadCsv(projectId, req) {
        try {
            const project = await this.dataService.getProject(projectId);
            if (!project) {
                return { success: false, error: '项目不存在' };
            }
            const uploadDir = path.join(process.cwd(), 'data', 'projects', projectId, 'csv-files');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const contentType = req.headers['content-type'] || '';
            if (contentType.includes('multipart/form-data')) {
                const boundary = contentType.split('boundary=')[1];
                if (!boundary) {
                    return { success: false, error: '无效的请求' };
                }
                const buffers = [];
                req.on('data', (chunk) => buffers.push(chunk));
                await new Promise((resolve) => req.on('end', resolve));
                const body = Buffer.concat(buffers);
                const parts = body.toString('binary').split(`--${boundary}`);
                let filename = '';
                let fileContent = '';
                for (const part of parts) {
                    if (part.includes('filename="') && part.includes('.csv"')) {
                        const filenameMatch = part.match(/filename="([^"]+)"/);
                        if (filenameMatch) {
                            filename = filenameMatch[1];
                        }
                        const contentStart = part.indexOf('\r\n\r\n');
                        if (contentStart > 0) {
                            fileContent = part.substring(contentStart + 4, part.length - 2);
                        }
                    }
                }
                if (!filename) {
                    return { success: false, error: '未找到CSV文件' };
                }
                const filePath = path.join(uploadDir, filename);
                fs.writeFileSync(filePath, fileContent, 'binary');
                return { success: true, filename };
            }
            return { success: false, error: '不支持的文件上传方式' };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getCsvFiles(projectId) {
        try {
            const project = await this.dataService.getProject(projectId);
            if (!project) {
                return [];
            }
            const uploadDir = path.join(process.cwd(), 'data', 'projects', projectId, 'csv-files');
            if (!fs.existsSync(uploadDir)) {
                return [];
            }
            const files = fs.readdirSync(uploadDir).filter(f => f.endsWith('.csv'));
            return files;
        }
        catch (error) {
            return [];
        }
    }
};
exports.APIController = APIController;
__decorate([
    (0, common_1.Get)('projects'),
    __param(0, (0, common_1.Query)('includeDeleted')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getProjects", null);
__decorate([
    (0, common_1.Post)('projects/:id/restore'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "restoreProject", null);
__decorate([
    (0, common_1.Get)('projects/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getProject", null);
__decorate([
    (0, common_1.Post)('projects'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "createProject", null);
__decorate([
    (0, common_1.Put)('projects/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "updateProject", null);
__decorate([
    (0, common_1.Delete)('projects/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "deleteProject", null);
__decorate([
    (0, common_1.Get)('test-cases'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Query)('projectId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('startDate')),
    __param(5, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, String, String, String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getTestCases", null);
__decorate([
    (0, common_1.Get)('test-cases/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getTestCase", null);
__decorate([
    (0, common_1.Post)('test-cases'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "createTestCase", null);
__decorate([
    (0, common_1.Put)('test-cases/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "updateTestCase", null);
__decorate([
    (0, common_1.Delete)('test-cases/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "deleteTestCase", null);
__decorate([
    (0, common_1.Post)('test-cases/:id/export'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "exportTestCase", null);
__decorate([
    (0, common_1.Post)('test-cases/import'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "importTestCase", null);
__decorate([
    (0, common_1.Get)('step-templates/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getStepTemplates", null);
__decorate([
    (0, common_1.Get)('step-templates/:projectId/:id'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getStepTemplate", null);
__decorate([
    (0, common_1.Post)('step-templates'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "createStepTemplate", null);
__decorate([
    (0, common_1.Put)('step-templates/:projectId/:id'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "updateStepTemplate", null);
__decorate([
    (0, common_1.Delete)('step-templates/:projectId/:id'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "deleteStepTemplate", null);
__decorate([
    (0, common_1.Post)('ai/generate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "generateTestCase", null);
__decorate([
    (0, common_1.Post)('ai/test-connection'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "testAIConnection", null);
__decorate([
    (0, common_1.Post)('ai/parse-schedule'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "parseScheduleTime", null);
__decorate([
    (0, common_1.Post)('execute/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "executeTest", null);
__decorate([
    (0, common_1.Get)('executions'),
    __param(0, (0, common_1.Query)('projectId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getExecutions", null);
__decorate([
    (0, common_1.Get)('executions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getExecution", null);
__decorate([
    (0, common_1.Delete)('executions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "deleteExecution", null);
__decorate([
    (0, common_1.Get)('executions/:id/file-size'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getExecutionFileSize", null);
__decorate([
    (0, common_1.Get)('executions/:id/structured-logs'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('level')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getStructuredLogs", null);
__decorate([
    (0, common_1.Get)('executions/:id/performance'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getPerformanceMetrics", null);
__decorate([
    (0, common_1.Get)('executions/:id/environment'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getEnvironmentInfo", null);
__decorate([
    (0, common_1.Get)('executions/:id/logs-summary'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getLogsSummary", null);
__decorate([
    (0, common_1.Get)('executions/:id/export-logs/:format'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('format')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "exportLogs", null);
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getReports", null);
__decorate([
    (0, common_1.Get)('reports/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getReport", null);
__decorate([
    (0, common_1.Delete)('reports/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "deleteReport", null);
__decorate([
    (0, common_1.Delete)('reports'),
    __param(0, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "deleteAllReports", null);
__decorate([
    (0, common_1.Post)('reports/generate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "generateReport", null);
__decorate([
    (0, common_1.Get)('reports/html/:projectId/:filename'),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Param)('filename')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getReportHtml", null);
__decorate([
    (0, common_1.Get)('config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Post)('config'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "saveConfig", null);
__decorate([
    (0, common_1.Get)('dashboard/stats'),
    __param(0, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('scenarios'),
    __param(0, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getScenarios", null);
__decorate([
    (0, common_1.Get)('scenarios/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getScenario", null);
__decorate([
    (0, common_1.Post)('scenarios'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "createScenario", null);
__decorate([
    (0, common_1.Put)('scenarios/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "updateScenario", null);
__decorate([
    (0, common_1.Delete)('scenarios/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "deleteScenario", null);
__decorate([
    (0, common_1.Get)('scenario-executions'),
    __param(0, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getScenarioExecutions", null);
__decorate([
    (0, common_1.Get)('scenario-executions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getScenarioExecution", null);
__decorate([
    (0, common_1.Post)('scenarios/:id/execute'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "executeScenario", null);
__decorate([
    (0, common_1.Delete)('scenario-executions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "deleteScenarioExecution", null);
__decorate([
    (0, common_1.Post)('selectors/optimize'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "optimizeSelector", null);
__decorate([
    (0, common_1.Get)('schedules'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getSchedules", null);
__decorate([
    (0, common_1.Get)('schedules/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getSchedule", null);
__decorate([
    (0, common_1.Post)('schedules'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "createSchedule", null);
__decorate([
    (0, common_1.Put)('schedules/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "updateSchedule", null);
__decorate([
    (0, common_1.Delete)('schedules/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "deleteSchedule", null);
__decorate([
    (0, common_1.Post)('schedules/:id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "cancelSchedule", null);
__decorate([
    (0, common_1.Post)('schedules/:id/run-now'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "runScheduleNow", null);
__decorate([
    (0, common_1.Post)('projects/:id/upload-csv'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "uploadCsv", null);
__decorate([
    (0, common_1.Get)('projects/:id/csv-files'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], APIController.prototype, "getCsvFiles", null);
exports.APIController = APIController = APIController_1 = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [data_1.DataService,
        ai_1.AIService,
        test_engine_1.TestEngineService,
        report_1.ReportService,
        timer_1.TimerService])
], APIController);
//# sourceMappingURL=api.controller.js.map