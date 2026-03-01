import { Response, Request } from 'express';
import { AIService } from '../ai';
import { TestEngineService } from '../test-engine';
import { ReportService } from '../report';
import { DataService } from '../data';
import { TimerService } from '../timer';
import { TestCase, Project, StepTemplate, AIConfig, SystemConfig, Scenario, ScenarioExecution } from '../../common/interfaces';
export declare class APIController {
    private readonly dataService;
    private readonly aiService;
    private readonly testEngineService;
    private readonly reportService;
    private readonly timerService;
    private readonly logger;
    constructor(dataService: DataService, aiService: AIService, testEngineService: TestEngineService, reportService: ReportService, timerService: TimerService);
    getProjects(includeDeleted?: string): Promise<Project[]>;
    restoreProject(id: string): Promise<{
        success: boolean;
        project: Project;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        project?: undefined;
    }>;
    getProject(id: string): Promise<Project | {
        error: string;
    }>;
    createProject(project: Partial<Project>): Promise<Project>;
    updateProject(id: string, project: Partial<Project>): Promise<Project | {
        error: string;
    }>;
    deleteProject(id: string): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    getTestCases(projectId?: string, page?: number, pageSize?: number, search?: string, startDate?: string, endDate?: string): Promise<import("../../common/interfaces").PaginatedResponse<TestCase> | TestCase[]>;
    getTestCase(id: string): Promise<TestCase | {
        error: string;
    }>;
    createTestCase(testCase: Partial<TestCase>): Promise<TestCase | {
        error: string;
    }>;
    updateTestCase(id: string, testCase: Partial<TestCase>): Promise<TestCase | {
        error: string;
    }>;
    deleteTestCase(id: string): Promise<{
        success: boolean;
    }>;
    exportTestCase(id: string, res: Response): Promise<void>;
    importTestCase(data: {
        projectId: string;
        testCaseData: string;
    }): Promise<{
        success: boolean;
        testCase: TestCase;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        testCase?: undefined;
    }>;
    getStepTemplates(projectId: string): Promise<StepTemplate[]>;
    getStepTemplate(projectId: string, id: string): Promise<StepTemplate | {
        error: string;
    }>;
    createStepTemplate(template: Partial<StepTemplate>): Promise<StepTemplate | {
        error: string;
    }>;
    updateStepTemplate(projectId: string, id: string, template: Partial<StepTemplate>): Promise<StepTemplate | {
        error: string;
    }>;
    deleteStepTemplate(projectId: string, id: string): Promise<{
        success: boolean;
    }>;
    generateTestCase(data: {
        description: string;
        projectId: string;
    }): Promise<{
        success: boolean;
        testCase: TestCase;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        testCase?: undefined;
    }>;
    testAIConnection(aiConfig: AIConfig): Promise<{
        success: boolean;
        message: string;
    }>;
    parseScheduleTime(body: {
        input: string;
    }): Promise<{
        success: boolean;
        executionDate: any;
        cronExpression: any;
        description: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        executionDate?: undefined;
        cronExpression?: undefined;
        description?: undefined;
    }>;
    executeTest(id: string, options?: any): Promise<{
        success: boolean;
        execution: import("../../common/interfaces").TestExecution;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        execution?: undefined;
    }>;
    getExecutions(projectId?: string, page?: number, pageSize?: number, startDate?: string, endDate?: string): Promise<import("../../common/interfaces").PaginatedResponse<import("../../common/interfaces").TestExecution> | import("../../common/interfaces").TestExecution[]>;
    getExecution(id: string): Promise<import("../../common/interfaces").TestExecution | {
        error: string;
    }>;
    deleteExecution(id: string): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    getExecutionFileSize(id: string): Promise<{
        size: number;
    }>;
    getStructuredLogs(id: string, level?: string): Promise<any>;
    getPerformanceMetrics(id: string): Promise<any>;
    getEnvironmentInfo(id: string): Promise<any>;
    getLogsSummary(id: string): Promise<{
        total: any;
        byLevel: {
            debug: number;
            info: number;
            warn: number;
            error: number;
            critical: number;
        };
    } | {
        error: string;
    }>;
    exportLogs(id: string, format: 'json' | 'csv', res: Response): Promise<Response<any, Record<string, any>>>;
    getReports(projectId?: string): Promise<import("../../common/interfaces").TestReport[]>;
    getReport(id: string): Promise<import("../../common/interfaces").TestReport | {
        error: string;
    }>;
    deleteReport(id: string): Promise<{
        success: boolean;
    }>;
    deleteAllReports(projectId: string): Promise<{
        success: boolean;
        deletedCount: number;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        deletedCount?: undefined;
    }>;
    generateReport(data: {
        executionIds: string[];
        name?: string;
        description?: string;
        projectId: string;
    }): Promise<{
        success: boolean;
        report: import("../../common/interfaces").TestReport;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        report?: undefined;
    }>;
    getReportHtml(projectId: string, filename: string, res: Response): Promise<void | Response<any, Record<string, any>>>;
    getConfig(): Promise<SystemConfig>;
    saveConfig(config: SystemConfig): Promise<{
        success: boolean;
    }>;
    getDashboardStats(projectId?: string): Promise<{
        totalTestCases: number;
        totalExecutions: number;
        passedExecutions: number;
        failedExecutions: number;
        totalReports: number;
    }>;
    getScenarios(projectId?: string): Promise<Scenario[]>;
    getScenario(id: string): Promise<{
        error: string;
    } | {
        testCases: any[];
        id: string;
        projectId: string;
        name: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        error?: undefined;
    }>;
    createScenario(scenario: any): Promise<Scenario | {
        error: string;
    }>;
    updateScenario(id: string, scenario: any): Promise<Scenario | {
        error: string;
    }>;
    deleteScenario(id: string): Promise<{
        success: boolean;
    }>;
    getScenarioExecutions(projectId?: string): Promise<ScenarioExecution[]>;
    getScenarioExecution(id: string): Promise<ScenarioExecution | {
        error: string;
    }>;
    executeScenario(id: string, options?: any): Promise<{
        success: boolean;
        execution: ScenarioExecution;
        report: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        execution?: undefined;
        report?: undefined;
    }>;
    deleteScenarioExecution(id: string): Promise<{
        success: boolean;
    }>;
    optimizeSelector(body: {
        url: string;
        selector: string;
        cookies?: string;
        description?: string;
    }): Promise<{
        success: boolean;
        error: string;
        hint: string;
        original?: undefined;
        elementInfo?: undefined;
        suggested?: undefined;
        reason?: undefined;
        stability?: undefined;
        note?: undefined;
    } | {
        success: boolean;
        original: string;
        elementInfo: any;
        suggested: string;
        reason: string;
        stability: number;
        note: string;
        error?: undefined;
        hint?: undefined;
    } | {
        success: boolean;
        original: string;
        elementInfo: any;
        suggested: string;
        reason: string;
        stability: number;
        error?: undefined;
        hint?: undefined;
        note?: undefined;
    } | {
        success: boolean;
        error: any;
        hint?: undefined;
        original?: undefined;
        elementInfo?: undefined;
        suggested?: undefined;
        reason?: undefined;
        stability?: undefined;
        note?: undefined;
    }>;
    getSchedules(): Promise<import("../../common/interfaces").OneTimeSchedule[]>;
    getSchedule(id: string): Promise<import("../../common/interfaces").OneTimeSchedule | {
        error: string;
    }>;
    createSchedule(schedule: any): Promise<{
        error: string;
        success?: undefined;
        schedule?: undefined;
    } | {
        success: boolean;
        schedule: import("../../common/interfaces").OneTimeSchedule;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        schedule?: undefined;
    }>;
    updateSchedule(id: string, schedule: any): Promise<{
        success: boolean;
        schedule: import("../../common/interfaces").OneTimeSchedule;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        schedule?: undefined;
    }>;
    deleteSchedule(id: string): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    cancelSchedule(id: string): Promise<{
        success: boolean;
        schedule: import("../../common/interfaces").OneTimeSchedule;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        schedule?: undefined;
    }>;
    runScheduleNow(id: string): Promise<{
        success: boolean;
        schedule: import("../../common/interfaces").OneTimeSchedule;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        schedule?: undefined;
    }>;
    uploadCsv(projectId: string, req: Request): Promise<{
        success: boolean;
        filename: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        filename?: undefined;
    }>;
    getCsvFiles(projectId: string): Promise<string[]>;
}
