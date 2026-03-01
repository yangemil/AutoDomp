import { LogLevel, LogEntry, LogContext, LogMetadata, LogFilters, LogSearchQuery, LogSearchResult } from './interfaces';
export declare class LoggingService {
    private readonly logger;
    private logBuffer;
    log(level: LogLevel, message: string, context?: LogContext): LogEntry;
    logTestExecution(executionId: string, level: LogLevel, message: string, metadata?: LogMetadata): LogEntry;
    logStepExecution(executionId: string, stepOrder: number, level: LogLevel, message: string, metadata?: LogMetadata): LogEntry;
    logError(executionId: string, error: Error, context?: Partial<LogContext> & {
        stepOrder?: number;
    }, metadata?: LogMetadata): LogEntry;
    private addToBuffer;
    getExecutionLogs(executionId: string, filters?: LogFilters): LogEntry[];
    clearExecutionLogs(executionId: string): void;
    searchLogs(query: LogSearchQuery): LogSearchResult;
    private calculateAggregations;
    exportLogsJSON(executionId: string): string;
    exportLogsCSV(executionId: string): string;
}
