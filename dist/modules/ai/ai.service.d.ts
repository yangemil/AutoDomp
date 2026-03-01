import { DataService } from '../data';
import { TestCase, AIConfig } from '../../common/interfaces';
export declare class AIService {
    private readonly dataService;
    private readonly logger;
    constructor(dataService: DataService);
    generateTestCase(description: string, baseUrl?: string): Promise<TestCase>;
    generateTestData(fields: string[]): Promise<Record<string, any>>;
    private buildPrompt;
    private callAI;
    private parseAIToTestCase;
    testConnection(aiConfig: AIConfig): Promise<{
        success: boolean;
        message: string;
    }>;
    generateSelector(description: string, pageHtml?: string): Promise<string>;
    optimizeSelector(elementInfo: {
        tag: string;
        id?: string;
        name?: string;
        className?: string;
        placeholder?: string;
        type?: string;
        text?: string;
        description?: string;
    }): Promise<{
        selector: string;
        reason: string;
        stability: number;
    }>;
}
