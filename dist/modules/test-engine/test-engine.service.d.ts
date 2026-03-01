import { Page } from 'playwright';
import { DataService } from '../data';
import { AIService } from '../ai';
import { LoggingService } from '../logging';
import { TestExecution, ProjectSettings, ScenarioExecution } from '../../common/interfaces';
export declare class TestEngineService {
    private readonly dataService;
    private readonly aiService;
    private readonly loggingService;
    private readonly logger;
    private browser;
    private activeExecutions;
    private scenarioContexts;
    constructor(dataService: DataService, aiService: AIService, loggingService: LoggingService);
    private readCsvData;
    private replaceVariables;
    private executeSingleTest;
    executeTestCase(testCaseId: string, options?: any, scenarioContext?: Record<string, any>, sharedPage?: Page): Promise<TestExecution | TestExecution[]>;
    private executeStep;
    private executeAssertion;
    executeScenario(scenarioId: string, options?: any, projectId?: string): Promise<ScenarioExecution>;
    stopExecution(executionId: string): Promise<void>;
    closeBrowser(): Promise<void>;
    createScenarioSession(scenarioId: string, config: ProjectSettings & {
        baseUrl: string;
    }): Promise<void>;
    getScenarioPage(scenarioId: string): Page | null;
    closeScenarioSession(scenarioId: string): Promise<void>;
    private takeScreenshot;
    getActiveExecutions(): TestExecution[];
    private resolveSelector;
    private resolveTextSelector;
    private resolveSelectorWithAI;
    private smartClick;
    private getActionText;
    private collectEnvironmentInfo;
}
