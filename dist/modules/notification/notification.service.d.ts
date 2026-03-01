import { DataService } from '../data';
export declare class NotificationService {
    private readonly dataService;
    private readonly logger;
    constructor(dataService: DataService);
    sendFeishuNotification(webhook: string, data: {
        taskName: string;
        scenarioName: string;
        status: 'passed' | 'failed';
        passedTests: number;
        failedTests: number;
        duration: number;
        executionDate: string;
        cronExpression?: string;
        executedAt?: string;
        executionUrl?: string;
    }): Promise<boolean>;
}
