export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    CRITICAL = "critical"
}
export interface LogEntry {
    id: string;
    timestamp: string;
    level: LogLevel;
    message: string;
    executionId?: string;
    stepOrder?: number;
    context?: LogContext;
    metadata?: LogMetadata;
}
export interface LogContext {
    traceId?: string;
    spanId?: string;
    projectId?: string;
    scenarioId?: string;
    testCaseId?: string;
    userId?: string;
    environment?: string;
}
export interface LogMetadata {
    duration?: number;
    selector?: string;
    element?: string;
    action?: string;
    value?: string;
    error?: ErrorInfo;
    screenshot?: string;
    url?: string;
    pageTitle?: string;
}
export interface ErrorInfo {
    message: string;
    stack?: string;
    code?: string;
    type?: string;
}
export interface LogFilters {
    level?: LogLevel;
    startDate?: Date;
    endDate?: Date;
    stepOrder?: number;
    includeMetadata?: boolean;
}
export interface LogSearchQuery {
    searchText?: string;
    level?: LogLevel[];
    dateRange?: {
        start: Date;
        end: Date;
    };
    executionIds?: string[];
    maxResults?: number;
}
export interface LogSearchResult {
    total: number;
    logs: LogEntry[];
    aggregations?: {
        byLevel: Record<LogLevel, number>;
        byExecution: Record<string, number>;
    };
}
