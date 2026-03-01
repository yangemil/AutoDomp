import { DataService } from '../data';
import { TestReport, ScenarioExecution } from '../../common/interfaces';
export declare class ReportService {
    private readonly dataService;
    private readonly logger;
    constructor(dataService: DataService);
    generateScenarioReport(scenarioExecution: ScenarioExecution): Promise<TestReport>;
    generateReport(projectId: string, executionIds: string[], name?: string, description?: string): Promise<TestReport>;
    private generateHTML;
    private renderExecution;
    private renderStep;
    private getStatusText;
    private generateScenarioHTML;
    private renderTestCaseExecution;
}
