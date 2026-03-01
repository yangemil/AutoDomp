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
var TestEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestEngineService = void 0;
const common_1 = require("@nestjs/common");
const playwright_1 = require("playwright");
const data_1 = require("../data");
const ai_1 = require("../ai");
const logging_1 = require("../logging");
const uuid_1 = require("uuid");
const path = require("path");
const fs = require("fs");
const csv = require('csv-parser');
let TestEngineService = TestEngineService_1 = class TestEngineService {
    constructor(dataService, aiService, loggingService) {
        this.dataService = dataService;
        this.aiService = aiService;
        this.loggingService = loggingService;
        this.logger = new common_1.Logger(TestEngineService_1.name);
        this.browser = null;
        this.activeExecutions = new Map();
        this.scenarioContexts = new Map();
    }
    async readCsvData(csvPath, dataRange) {
        return new Promise((resolve, reject) => {
            const results = [];
            let index = 0;
            const parseRange = (range) => {
                const match = range.match(/^(\d+)\s*-\s*(\d+)$/);
                if (!match)
                    return null;
                return {
                    start: parseInt(match[1]) - 1,
                    end: parseInt(match[2])
                };
            };
            const range = dataRange ? parseRange(dataRange) : null;
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (data) => {
                if (range) {
                    if (index >= range.start && index < range.end) {
                        results.push(data);
                    }
                }
                else {
                    results.push(data);
                }
                index++;
            })
                .on('end', () => resolve(results))
                .on('error', (error) => reject(error));
        });
    }
    replaceVariables(value, data) {
        if (!value)
            return value;
        return value.replace(/\$\{(\w+)\}/g, (match, key) => {
            const val = data[key];
            return val !== undefined ? String(val) : match;
        });
    }
    async executeSingleTest(testCase, config, testData = {}, scenarioContext, sharedPage) {
        const mergedTestData = { ...testData, ...scenarioContext };
        const traceId = (0, uuid_1.v4)();
        const execution = {
            id: (0, uuid_1.v4)(),
            projectId: testCase.projectId,
            testCaseId: testCase.id,
            testCaseName: testCase.name,
            status: 'pending',
            startTime: new Date(),
            steps: testCase.steps.map(step => ({
                stepId: step.id,
                order: step.order,
                action: step.action,
                status: 'pending',
                startTime: new Date()
            })),
            screenshots: [],
            logs: [],
            context: {},
            structuredLogs: [],
            performanceMetrics: {
                totalDuration: 0,
                averageStepDuration: 0,
                pageLoadTimes: [],
                elementInteractions: 0
            }
        };
        if (Object.keys(mergedTestData).length > 0) {
            const logMessage = `使用测试数据: ${JSON.stringify(mergedTestData)}`;
            execution.logs.push(`[${new Date().toISOString()}] ${logMessage}`);
            const structuredLog = this.loggingService.logTestExecution(execution.id, logging_1.LogLevel.INFO, logMessage);
            structuredLog.executionId = execution.id;
            structuredLog.context = {
                traceId,
                projectId: testCase.projectId,
                testCaseId: testCase.id,
                environment: process.env.NODE_ENV || 'development'
            };
            execution.structuredLogs?.push(structuredLog);
        }
        this.activeExecutions.set(execution.id, execution);
        await this.dataService.saveExecution(execution);
        let page;
        let context = null;
        let shouldCloseContext = false;
        try {
            execution.status = 'running';
            const logMessage = `开始执行测试用例: ${testCase.name}`;
            execution.logs.push(`[${new Date().toISOString()}] ${logMessage}`);
            const structuredLog = this.loggingService.logTestExecution(execution.id, logging_1.LogLevel.INFO, logMessage);
            structuredLog.executionId = execution.id;
            execution.structuredLogs?.push(structuredLog);
            await this.dataService.saveExecution(execution);
            if (sharedPage) {
                page = sharedPage;
                execution.logs.push(`[${new Date().toISOString()}] 使用场景共享页面`);
                execution.environmentInfo = await this.collectEnvironmentInfo(page);
            }
            else {
                if (this.browser) {
                    await this.browser.close();
                    this.browser = null;
                }
                execution.logs.push(`[${new Date().toISOString()}] 启动浏览器...`);
                this.browser = await playwright_1.chromium.launch({
                    headless: config.headless,
                    slowMo: config.slowMo
                });
                context = await this.browser.newContext({
                    viewport: { width: 1920, height: 1080 }
                });
                page = await context.newPage();
                shouldCloseContext = true;
                execution.environmentInfo = await this.collectEnvironmentInfo(page);
            }
            const baseUrl = config.baseUrl || '';
            if (testCase.url) {
                const initialUrl = testCase.useRelativeUrl ? baseUrl + testCase.url : testCase.url;
                const logMessage = `导航到测试页面: ${initialUrl}`;
                execution.logs.push(`[${new Date().toISOString()}] ${logMessage}`);
                const pageLoadStart = Date.now();
                try {
                    await page.goto(initialUrl, { waitUntil: 'networkidle', timeout: config.timeout });
                    const loadDuration = Date.now() - pageLoadStart;
                    execution.logs.push(`[${new Date().toISOString()}] 页面加载成功`);
                    execution.structuredLogs?.push(this.loggingService.logTestExecution(execution.id, logging_1.LogLevel.INFO, '页面加载成功', {
                        duration: loadDuration,
                        url: initialUrl,
                        action: 'navigate'
                    }));
                    if (execution.performanceMetrics) {
                        execution.performanceMetrics.pageLoadTimes.push(loadDuration);
                    }
                    const pageTitle = await page.title();
                    if (pageTitle) {
                        execution.structuredLogs?.push(this.loggingService.logTestExecution(execution.id, logging_1.LogLevel.DEBUG, `页面标题: ${pageTitle}`, { pageTitle }));
                    }
                }
                catch (navError) {
                    execution.logs.push(`[${new Date().toISOString()}] 页面导航失败: ${navError.message}`);
                    execution.structuredLogs?.push(this.loggingService.logError(execution.id, navError, { projectId: testCase.projectId }, { url: initialUrl, action: 'navigate' }));
                }
            }
            for (let i = 0; i < testCase.steps.length; i++) {
                const step = testCase.steps[i];
                const stepResult = execution.steps[i];
                stepResult.status = 'running';
                stepResult.startTime = new Date();
                const actionText = this.getActionText(step.action);
                const logMessage = `执行步骤 ${step.order}: ${actionText}`;
                execution.logs.push(`[${new Date().toISOString()}] ${logMessage}`);
                const structuredLog = this.loggingService.logStepExecution(execution.id, step.order, logging_1.LogLevel.DEBUG, logMessage, { action: actionText, selector: step.selector, value: step.value });
                execution.structuredLogs?.push(structuredLog);
                await this.dataService.saveExecution(execution);
                try {
                    let stepsToExecute = [step];
                    if (step.action === 'template' && step.templateId) {
                        const template = await this.dataService.getStepTemplate(step.templateId, testCase.projectId);
                        if (template) {
                            stepsToExecute = template.steps;
                            execution.logs.push(`[${new Date().toISOString()}] 使用模板: ${template.name} (${template.steps.length}个步骤)`);
                        }
                        else {
                            throw new Error(`模板不存在: ${step.templateId}`);
                        }
                    }
                    for (const actualStep of stepsToExecute) {
                        await this.executeStep(page, actualStep, baseUrl, config, execution, testData);
                    }
                    const waitAfter = step.waitAfter || config.waitAfter || 0;
                    if (waitAfter > 0) {
                        execution.logs.push(`[${new Date().toISOString()}] 等待 ${waitAfter}ms`);
                        await page.waitForTimeout(waitAfter);
                    }
                    if (step.screenshot || (config.screenshot.onStep && config.screenshot.enabled)) {
                        await this.takeScreenshot(page, step, execution, stepResult);
                    }
                    stepResult.status = 'passed';
                    stepResult.endTime = new Date();
                    stepResult.duration = stepResult.endTime.getTime() - stepResult.startTime.getTime();
                    execution.logs.push(`[${new Date().toISOString()}] 步骤 ${step.order} 执行成功`);
                }
                catch (error) {
                    stepResult.status = 'failed';
                    stepResult.endTime = new Date();
                    stepResult.duration = stepResult.endTime.getTime() - stepResult.startTime.getTime();
                    stepResult.error = error.message;
                    if (config.screenshot.onFailure && config.screenshot.enabled) {
                        const screenshotName = `${execution.id}_step_${step.order}_error.png`;
                        const screenshotPath = this.dataService.getScreenshotPath(screenshotName);
                        try {
                            await page.screenshot({ path: screenshotPath, fullPage: false });
                            stepResult.screenshot = screenshotName;
                            execution.screenshots.push(screenshotName);
                            execution.structuredLogs?.push(this.loggingService.logTestExecution(execution.id, logging_1.LogLevel.INFO, `错误截图已保存: ${screenshotName}`, { screenshot: screenshotName }));
                        }
                        catch (screenshotError) {
                            const logMessage = `截图失败: ${screenshotError.message}`;
                            execution.logs.push(`[${new Date().toISOString()}] ${logMessage}`);
                            execution.structuredLogs?.push(this.loggingService.logTestExecution(execution.id, logging_1.LogLevel.ERROR, logMessage, { error: { message: screenshotError.message, type: screenshotError.constructor.name } }));
                        }
                    }
                    const logMessage = `步骤 ${step.order} 执行失败: ${error.message}`;
                    execution.logs.push(`[${new Date().toISOString()}] ${logMessage}`);
                    execution.structuredLogs?.push(this.loggingService.logError(execution.id, error, {
                        stepOrder: step.order,
                        projectId: testCase.projectId
                    }, {
                        action: step.action,
                        selector: step.selector,
                        url: page.url()
                    }));
                    execution.status = 'failed';
                    execution.error = `步骤 ${step.order} 失败: ${error.message}`;
                    break;
                }
                await this.dataService.saveExecution(execution);
            }
            if (execution.status === 'running') {
                execution.status = 'passed';
            }
            if (shouldCloseContext && context) {
                await context.close();
            }
        }
        catch (error) {
            execution.status = 'error';
            execution.error = error.message;
            const logMessage = `执行出错: ${error.message}`;
            execution.logs.push(`[${new Date().toISOString()}] ${logMessage}`);
            this.logger.error(`测试执行错误:`, error);
            execution.structuredLogs?.push(this.loggingService.logError(execution.id, error, { projectId: testCase.projectId }));
        }
        finally {
            execution.endTime = new Date();
            execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
            const logMessage = `测试执行完成，状态: ${execution.status}`;
            execution.logs.push(`[${new Date().toISOString()}] ${logMessage}`);
            execution.structuredLogs?.push(this.loggingService.logTestExecution(execution.id, logging_1.LogLevel.INFO, logMessage));
            if (execution.performanceMetrics) {
                execution.performanceMetrics.totalDuration = execution.duration || 0;
                execution.performanceMetrics.averageStepDuration =
                    execution.steps.reduce((sum, s) => sum + (s.duration || 0), 0) / execution.steps.length;
                const slowestStep = execution.steps.reduce((max, s) => (s.duration || 0) > (max.duration || 0) ? s : max);
                if (slowestStep && slowestStep.duration) {
                    execution.performanceMetrics.slowestStep = {
                        order: slowestStep.order,
                        action: slowestStep.action,
                        description: testCase.steps.find(s => s.id === slowestStep.stepId)?.description || '',
                        duration: slowestStep.duration
                    };
                }
            }
            await this.dataService.saveExecution(execution);
            this.activeExecutions.delete(execution.id);
            this.loggingService.clearExecutionLogs(execution.id);
        }
        return execution;
    }
    async executeTestCase(testCaseId, options, scenarioContext, sharedPage) {
        const testCase = await this.dataService.getTestCase(testCaseId);
        if (!testCase) {
            throw new Error(`测试用例不存在: ${testCaseId}`);
        }
        const project = await this.dataService.getProject(testCase.projectId);
        if (!project) {
            throw new Error(`项目不存在: ${testCase.projectId}`);
        }
        const mergedConfig = {
            ...project.settings,
            baseUrl: project.baseUrl,
            ...options
        };
        let testDataRows = [];
        let dataFiles = options?.dataFiles || (options?.dataFile ? [options.dataFile] : []);
        const dataRange = options?.dataRange || testCase?.dataDriven?.dataRange;
        const executionCount = options?.executionCount || testCase?.dataDriven?.executionCount || 1;
        if (!options?.dataFile && !options?.dataFiles && testCase.dataDriven?.enabled) {
            if (testCase.dataDriven.dataFiles) {
                dataFiles = testCase.dataDriven.dataFiles;
            }
            else if (testCase.dataDriven.dataFile) {
                dataFiles = [testCase.dataDriven.dataFile];
            }
        }
        if (dataFiles && dataFiles.length > 0) {
            for (const dataFile of dataFiles) {
                const csvPath = path.join(this.dataService['projectsDir'], testCase.projectId, dataFile);
                if (fs.existsSync(csvPath)) {
                    const data = await this.readCsvData(csvPath, dataRange);
                    const repeatedData = [];
                    for (let i = 0; i < executionCount; i++) {
                        data.forEach(row => {
                            const rowCopy = { ...row };
                            rowCopy._sourceFile = dataFile;
                            rowCopy._executionIndex = i + 1;
                            repeatedData.push(rowCopy);
                        });
                    }
                    testDataRows.push(...repeatedData);
                }
            }
        }
        if (testDataRows.length > 0) {
            const executions = [];
            for (const testData of testDataRows) {
                const execution = await this.executeSingleTest(testCase, mergedConfig, testData, scenarioContext, sharedPage);
                executions.push(execution);
            }
            return executions;
        }
        else {
            if (executionCount > 1) {
                const executions = [];
                for (let i = 0; i < executionCount; i++) {
                    const execution = await this.executeSingleTest(testCase, mergedConfig, {
                        _executionIndex: i + 1,
                        _iteration: `第${i + 1}次执行`
                    }, scenarioContext, sharedPage);
                    executions.push(execution);
                }
                return executions;
            }
            return await this.executeSingleTest(testCase, mergedConfig, {}, scenarioContext, sharedPage);
        }
    }
    async executeStep(page, step, baseUrl, config, execution, testData = {}) {
        const replacedValue = this.replaceVariables(step.value || '', testData);
        const replacedSelector = this.replaceVariables(step.selector || '', testData);
        switch (step.action) {
            case 'navigate':
                const url = replacedValue.startsWith('http') ? replacedValue : baseUrl + replacedValue;
                execution.logs.push(`[${new Date().toISOString()}] 导航到: ${url}`);
                await page.goto(url, { waitUntil: 'networkidle', timeout: config.timeout });
                break;
            case 'click':
                execution.logs.push(`[${new Date().toISOString()}] 点击元素: ${replacedSelector}`);
                await page.click(replacedSelector, { timeout: config.timeout });
                break;
            case 'fill':
                execution.logs.push(`[${new Date().toISOString()}] 填充输入框 ${replacedSelector}: ${replacedValue}`);
                await page.fill(replacedSelector, replacedValue, { timeout: config.timeout });
                break;
            case 'select':
                execution.logs.push(`[${new Date().toISOString()}] 选择 ${step.selector}: ${step.value}`);
                await page.selectOption(step.selector, step.value, { timeout: config.timeout });
                break;
            case 'wait':
                const waitTime = step.waitTime || parseInt(step.value) || 1000;
                execution.logs.push(`[${new Date().toISOString()}] 等待 ${waitTime}ms`);
                await page.waitForTimeout(waitTime);
                break;
            case 'screenshot':
                const screenshotName = `${execution.id}_manual_${Date.now()}.png`;
                const screenshotPath = this.dataService.getScreenshotPath(screenshotName);
                await page.screenshot({ path: screenshotPath, fullPage: true });
                execution.screenshots.push(screenshotName);
                execution.logs.push(`[${new Date().toISOString()}] 手动截图已保存`);
                break;
            case 'verify':
                execution.logs.push(`[${new Date().toISOString()}] 执行验证步骤: ${step.description}`);
                break;
            case 'click':
                const clickSelector = replacedSelector;
                if (clickSelector.startsWith('text=') || clickSelector.startsWith('text:')) {
                    const resolvedSelector = this.resolveSelector(clickSelector);
                    execution.logs.push(`[${new Date().toISOString()}] 点击元素: ${resolvedSelector}`);
                    await page.click(resolvedSelector, { timeout: config.timeout });
                }
                else {
                    const resolvedSelector = await this.resolveSelectorWithAI(page, clickSelector);
                    execution.logs.push(`[${new Date().toISOString()}] 点击元素: ${resolvedSelector}`);
                    await page.click(resolvedSelector, { timeout: config.timeout });
                }
                break;
            case 'fill':
                const fillSelector = await this.resolveSelectorWithAI(page, replacedSelector);
                execution.logs.push(`[${new Date().toISOString()}] 填充输入框 ${fillSelector}: ${replacedValue}`);
                await page.fill(fillSelector, replacedValue, { timeout: config.timeout });
                break;
            case 'select':
                const selectSelector = await this.resolveSelectorWithAI(page, replacedSelector);
                execution.logs.push(`[${new Date().toISOString()}] 选择 ${selectSelector}: ${step.value}`);
                await page.selectOption(selectSelector, step.value, { timeout: config.timeout });
                break;
            case 'saveToContext':
                execution.logs.push(`[${new Date().toISOString()}] 保存数据到上下文: ${replacedSelector}`);
                const saved = this.replaceVariables(replacedValue, testData);
                if (saved && saved !== replacedValue) {
                    try {
                        const selectorValue = await page.locator(replacedSelector).textContent({ timeout: config.timeout });
                        if (selectorValue) {
                            const key = replacedValue.replace(/\$\{(.+?)}/, '').trim();
                            execution.context = execution.context || {};
                            execution.context[key] = selectorValue.trim();
                        }
                    }
                    catch (extractError) {
                        execution.logs.push(`[${new Date().toISOString()}] 提取失败: ${extractError.message}`);
                    }
                    const key = replacedValue.replace(/\$\{(.+?)}/, '').trim();
                    execution.context = execution.context || {};
                    execution.context[key] = saved;
                    execution.logs.push(`[${new Date().toISOString()}] 保存到上下文: ${key} = ${saved}`);
                }
                else {
                    execution.logs.push(`[${new Date().toISOString()}] 保存数据到上下文: ${replacedValue}`);
                }
                break;
            default:
                throw new Error(`未知的动作类型: ${step.action}`);
        }
        if (step.assertion && step.assertion.enabled) {
            await this.executeAssertion(page, step.assertion, testData, config.timeout, execution);
        }
    }
    async executeAssertion(page, assertion, testData, timeout, execution) {
        const replacedSelector = this.replaceVariables(assertion.selector || '', testData);
        const replacedValue = this.replaceVariables(assertion.value || '', testData);
        const assertionTimeout = assertion.timeout || timeout;
        try {
            switch (assertion.type) {
                case 'text_contains':
                    execution.logs.push(`[${new Date().toISOString()}] 断言: 元素 ${replacedSelector} 的文本包含 "${replacedValue}"`);
                    const textContains = await page.textContent(replacedSelector, { timeout: assertionTimeout });
                    if (!textContains.includes(replacedValue)) {
                        throw new Error(`断言失败: 期望文本包含 "${replacedValue}", 实际为 "${textContains}"`);
                    }
                    execution.logs.push(`[${new Date().toISOString()}] 断言成功: 文本包含 "${replacedValue}"`);
                    break;
                case 'text_equals':
                    execution.logs.push(`[${new Date().toISOString()}] 断言: 元素 ${replacedSelector} 的文本等于 "${replacedValue}"`);
                    const textEquals = await page.textContent(replacedSelector, { timeout: assertionTimeout });
                    if (textEquals.trim() !== replacedValue) {
                        throw new Error(`断言失败: 期望文本等于 "${replacedValue}", 实际为 "${textEquals.trim()}"`);
                    }
                    execution.logs.push(`[${new Date().toISOString()}] 断言成功: 文本等于 "${replacedValue}"`);
                    break;
                case 'element_exists':
                    execution.logs.push(`[${new Date().toISOString()}] 断言: 元素 ${replacedSelector} 存在`);
                    await page.waitForSelector(replacedSelector, { timeout: assertionTimeout });
                    execution.logs.push(`[${new Date().toISOString()}] 断言成功: 元素存在`);
                    break;
                case 'element_visible':
                    execution.logs.push(`[${new Date().toISOString()}] 断言: 元素 ${replacedSelector} 可见`);
                    await page.waitForSelector(replacedSelector, { state: 'visible', timeout: assertionTimeout });
                    execution.logs.push(`[${new Date().toISOString()}] 断言成功: 元素可见`);
                    break;
                case 'element_hidden':
                    execution.logs.push(`[${new Date().toISOString()}] 断言: 元素 ${replacedSelector} 隐藏`);
                    await page.waitForSelector(replacedSelector, { state: 'hidden', timeout: assertionTimeout });
                    execution.logs.push(`[${new Date().toISOString()}] 断言成功: 元素隐藏`);
                    break;
                case 'attribute_equals':
                    execution.logs.push(`[${new Date().toISOString()}] 断言: 元素 ${replacedSelector} 的属性 ${assertion.attribute} 等于 "${replacedValue}"`);
                    const attrValue = await page.getAttribute(replacedSelector, assertion.attribute);
                    if (attrValue !== replacedValue) {
                        throw new Error(`断言失败: 期望属性 "${assertion.attribute}" 等于 "${replacedValue}", 实际为 "${attrValue}"`);
                    }
                    execution.logs.push(`[${new Date().toISOString()}] 断言成功: 属性 ${assertion.attribute} 等于 "${replacedValue}"`);
                    break;
                case 'element_enabled':
                    execution.logs.push(`[${new Date().toISOString()}] 断言: 元素 ${replacedSelector} 可用`);
                    const isEnabled = await page.isEnabled(replacedSelector);
                    if (!isEnabled) {
                        throw new Error(`断言失败: 元素不可用`);
                    }
                    execution.logs.push(`[${new Date().toISOString()}] 断言成功: 元素可用`);
                    break;
                case 'element_disabled':
                    execution.logs.push(`[${new Date().toISOString()}] 断言: 元素 ${replacedSelector} 不可用`);
                    const isDisabled = await page.isDisabled(replacedSelector);
                    if (!isDisabled) {
                        throw new Error(`断言失败: 元素可用`);
                    }
                    execution.logs.push(`[${new Date().toISOString()}] 断言成功: 元素不可用`);
                    break;
                case 'url_contains':
                    execution.logs.push(`[${new Date().toISOString()}] 断言: URL 包含 "${replacedValue}"`);
                    const currentUrl = page.url();
                    if (!currentUrl.includes(replacedValue)) {
                        throw new Error(`断言失败: 期望URL包含 "${replacedValue}", 实际为 "${currentUrl}"`);
                    }
                    execution.logs.push(`[${new Date().toISOString()}] 断言成功: URL 包含 "${replacedValue}"`);
                    break;
                case 'title_equals':
                    execution.logs.push(`[${new Date().toISOString()}] 断言: 页面标题等于 "${replacedValue}"`);
                    const pageTitle = await page.title();
                    if (pageTitle !== replacedValue) {
                        throw new Error(`断言失败: 期望标题等于 "${replacedValue}", 实际为 "${pageTitle}"`);
                    }
                    execution.logs.push(`[${new Date().toISOString()}] 断言成功: 页面标题等于 "${replacedValue}"`);
                    break;
                default:
                    throw new Error(`未知的断言类型: ${assertion.type}`);
            }
        }
        catch (error) {
            execution.logs.push(`[${new Date().toISOString()}] 断言失败: ${error.message}`);
            throw error;
        }
    }
    async executeScenario(scenarioId, options, projectId) {
        const scenario = await this.dataService.getScenario(scenarioId);
        if (!scenario) {
            throw new Error(`场景不存在: ${scenarioId}`);
        }
        const project = await this.dataService.getProject(scenario.projectId);
        if (!project) {
            throw new Error(`项目不存在: ${scenario.projectId}`);
        }
        const config = {
            ...project.settings,
            baseUrl: project.baseUrl,
            ...options
        };
        await this.createScenarioSession(scenarioId, config);
        const sharedPage = this.getScenarioPage(scenarioId);
        const scenarioTestCases = scenario.testCases || [];
        const totalTests = scenarioTestCases.length;
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
            logs: [`开始执行场景: ${scenario.name}`, `包含 ${totalTests} 个测试用例`],
            context: {}
        };
        let passedCount = 0;
        let failedCount = 0;
        const testExecutionIds = [];
        for (let i = 0; i < scenarioTestCases.length; i++) {
            const scenarioTestCase = scenarioTestCases[i];
            const testCaseId = scenarioTestCase.id;
            const testCase = await this.dataService.getTestCase(testCaseId);
            if (!testCase) {
                execution.logs.push(`测试用例 ${testCaseId} 不存在，跳过`);
                failedCount++;
                continue;
            }
            execution.logs.push(`开始执行: ${testCase.name}`);
            try {
                const testExecutionResult = await this.executeTestCase(testCaseId, config, {}, sharedPage);
                const testExecution = Array.isArray(testExecutionResult) ? testExecutionResult[0] : testExecutionResult;
                if (testExecution && testExecution.id) {
                    testExecutionIds.push(testExecution.id);
                    if (testExecution.status === 'passed') {
                        passedCount++;
                        execution.logs.push(`${testCase.name}: 通过`);
                    }
                    else {
                        failedCount++;
                        execution.logs.push(`${testCase.name}: 失败 - ${testExecution.error || '未知错误'}`);
                    }
                }
            }
            catch (error) {
                failedCount++;
                execution.logs.push(`${testCase.name}: 异常 - ${error.message}`);
            }
        }
        await this.closeScenarioSession(scenarioId);
        execution.executionIds = testExecutionIds;
        execution.passedTests = passedCount;
        execution.failedTests = failedCount;
        execution.status = failedCount === 0 ? 'passed' : 'failed';
        execution.endTime = new Date();
        execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
        execution.logs.push(`场景执行完成，通过 ${passedCount} 个，失败 ${failedCount} 个`);
        await this.dataService.saveScenarioExecution(execution);
        return execution;
    }
    async stopExecution(executionId) {
        const execution = this.activeExecutions.get(executionId);
        if (execution) {
            execution.status = 'error';
            execution.error = '用户手动停止';
            execution.endTime = new Date();
            execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
            execution.logs.push(`[${new Date().toISOString()}] 测试被手动停止`);
            await this.dataService.saveExecution(execution);
            this.activeExecutions.delete(executionId);
        }
    }
    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.logger.log('浏览器已关闭');
        }
    }
    async createScenarioSession(scenarioId, config) {
        if (this.scenarioContexts.has(scenarioId)) {
            return;
        }
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
        this.browser = await playwright_1.chromium.launch({
            headless: config.headless,
            slowMo: config.slowMo
        });
        const context = await this.browser.newContext();
        const page = await context.newPage();
        this.scenarioContexts.set(scenarioId, { browser: this.browser, context, page });
        this.logger.log(`场景会话已创建: ${scenarioId}`);
    }
    getScenarioPage(scenarioId) {
        const session = this.scenarioContexts.get(scenarioId);
        return session ? session.page : null;
    }
    async closeScenarioSession(scenarioId) {
        const session = this.scenarioContexts.get(scenarioId);
        if (session) {
            await session.context.close();
            this.scenarioContexts.delete(scenarioId);
            this.logger.log(`场景会话已关闭: ${scenarioId}`);
        }
    }
    async takeScreenshot(page, step, execution, stepResult) {
        const screenshotName = `${execution.id}_step_${step.order}.png`;
        const screenshotPath = this.dataService.getScreenshotPath(screenshotName);
        try {
            if (step.action === 'verify') {
                await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => { });
                await page.waitForTimeout(500);
            }
            if (step.selector && step.highlightOnScreenshot) {
                execution.logs.push(`[${new Date().toISOString()}] 高亮元素: ${step.selector}`);
                await page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    if (el) {
                        el.style.border = '5px dashed #ff0000 !important';
                        el.style.boxShadow = '0 0 10px #ff0000';
                        el.style.position = 'relative';
                        el.style.zIndex = '999999';
                    }
                }, step.selector);
            }
            await page.waitForTimeout(100);
            await page.screenshot({ path: screenshotPath, fullPage: false });
            execution.logs.push(`[${new Date().toISOString()}] 截图已保存: ${screenshotName}`);
            if (step.selector && step.highlightOnScreenshot) {
                await page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    if (el) {
                        el.style.border = '';
                        el.style.boxShadow = '';
                        el.style.position = '';
                        el.style.zIndex = '';
                    }
                }, step.selector);
            }
            stepResult.screenshot = screenshotName;
            execution.screenshots.push(screenshotName);
        }
        catch (screenshotError) {
            if (step.selector && step.highlightOnScreenshot) {
                await page.evaluate((sel) => {
                    const el = document.querySelector(sel);
                    if (el) {
                        el.style.border = '';
                        el.style.boxShadow = '';
                        el.style.position = '';
                        el.style.zIndex = '';
                    }
                }, step.selector);
            }
            execution.logs.push(`[${new Date().toISOString()}] 截图失败: ${screenshotError.message}`);
        }
    }
    getActiveExecutions() {
        return Array.from(this.activeExecutions.values());
    }
    resolveSelector(selector) {
        if (!selector)
            return selector;
        if (selector.startsWith('text=')) {
            const text = selector.substring(5);
            return `text=${text}`;
        }
        if (selector.startsWith('text:') && !selector.startsWith('text:nth=') && !selector.startsWith('text:第') && !selector.startsWith('text:倒数')) {
            const text = selector.substring(5);
            return `text=${text}`;
        }
        if (selector.startsWith('text:nth=') || selector.startsWith('text:第') || selector.startsWith('text:倒数')) {
            return selector;
        }
        if (selector.startsWith('text:contains=')) {
            const text = selector.substring(14);
            return `text=${text}`;
        }
        if (selector.includes('*=')) {
            return selector;
        }
        if (selector.startsWith('id:startswith=')) {
            const prefix = selector.substring(14);
            return `[id^="${prefix}"]`;
        }
        if (selector.startsWith('id:contains=')) {
            const text = selector.substring(12);
            return `[id*="${text}"]`;
        }
        if (selector.startsWith('smart=')) {
            return selector;
        }
        return selector;
    }
    async resolveTextSelector(page, selector) {
        let index = 0;
        const nthMatch = selector.match(/text:(?:nth=)?(\d+),(.+)/);
        const reverseMatch = selector.match(/text:倒数(?:第)?(\d+),(.+)/);
        const simpleMatch = selector.match(/text:(.+)/);
        let text = '';
        let isReverse = false;
        if (reverseMatch) {
            index = parseInt(reverseMatch[1]) - 1;
            text = reverseMatch[2];
            isReverse = true;
        }
        else if (nthMatch) {
            index = parseInt(nthMatch[1]) - 1;
            text = nthMatch[2];
        }
        else if (simpleMatch) {
            text = simpleMatch[1];
            index = 0;
        }
        const allElements = page.locator(`text=${text}`);
        const count = await allElements.count();
        if (count === 0) {
            throw new Error(`未找到包含文本 "${text}" 的元素`);
        }
        if (isReverse) {
            return allElements.nth(count - index - 1);
        }
        else {
            return allElements.nth(index);
        }
    }
    async resolveSelectorWithAI(page, selector) {
        if (!selector.startsWith('ai:')) {
            return this.resolveSelector(selector);
        }
        const description = selector.substring(3);
        this.logger.log(`AI选择器: ${description}`);
        try {
            const generatedSelector = await this.aiService.generateSelector(description);
            this.logger.log(`AI生成的选择器: ${generatedSelector}`);
            return generatedSelector;
        }
        catch (error) {
            this.logger.error(`AI选择器生成失败: ${error.message}`);
            throw new Error(`AI选择器生成失败: ${error.message}`);
        }
    }
    async smartClick(page, selector, timeout) {
        if (!selector.startsWith('smart=')) {
            await page.click(selector, { timeout });
            return;
        }
        const keyword = selector.substring(6);
        const strategies = [
            () => page.locator(`text=${keyword}`).first(),
            () => page.locator(`.el-cascader-panel .el-cascader-menu:first-child .el-cascader-menu-item:has-text("${keyword}")`).first(),
            () => page.locator(`[class*="${keyword}"]`).first(),
            () => page.locator(`button:has-text("${keyword}")`).first(),
            () => page.locator(`a:has-text("${keyword}")`).first(),
        ];
        for (let i = 0; i < strategies.length; i++) {
            try {
                const locator = strategies[i]();
                const count = await locator.count();
                if (count > 0) {
                    await locator.first().click({ timeout: 5000 });
                    return;
                }
            }
            catch (e) {
                continue;
            }
        }
        throw new Error(`智能选择器未能找到元素: ${keyword}`);
    }
    getActionText(action) {
        const actionMap = {
            'click': '点击元素',
            'fill': '填充输入框',
            'type': '输入文本',
            'select': '选择选项',
            'check': '勾选',
            'uncheck': '取消勾选',
            'hover': '悬停',
            'dblclick': '双击',
            'rightclick': '右键点击',
            'goto': '导航到',
            'wait': '等待',
            'screenshot': '截图',
            'assert': '断言',
            'scroll': '滚动',
            'evaluate': '执行脚本'
        };
        return actionMap[action] || action;
    }
    async collectEnvironmentInfo(page) {
        const os = require('os');
        const pwVersion = require('playwright/package.json').version;
        let osDisplay = os.type();
        if (os.type() === 'Windows_NT') {
            const version = os.release();
            if (version.startsWith('10.0.2') && parseInt(version.split('.')[2]) >= 26100) {
                osDisplay = 'Windows 11 24H2';
            }
            else if (version.startsWith('10.0.2')) {
                osDisplay = 'Windows 11';
            }
            else if (version.startsWith('10.0.1')) {
                osDisplay = 'Windows 10';
            }
        }
        return {
            os: osDisplay,
            osVersion: '',
            nodeVersion: process.version,
            platform: os.platform(),
            browserVersion: await page.evaluate(() => navigator.userAgent),
            resolution: `${page.viewportSize().width}x${page.viewportSize().height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            locale: Intl.DateTimeFormat().resolvedOptions().locale,
            memoryUsage: {
                used: os.freemem(),
                total: os.totalmem(),
                percentage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100)
            },
            cpuUsage: os.loadavg()[0],
            testPlatform: 'Playwright',
            testPlatformVersion: pwVersion
        };
    }
};
exports.TestEngineService = TestEngineService;
exports.TestEngineService = TestEngineService = TestEngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [data_1.DataService,
        ai_1.AIService,
        logging_1.LoggingService])
], TestEngineService);
//# sourceMappingURL=test-engine.service.js.map