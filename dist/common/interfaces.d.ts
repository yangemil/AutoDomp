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
export interface PerformanceMetrics {
    totalDuration: number;
    averageStepDuration: number;
    slowestStep?: {
        order: number;
        action: string;
        description: string;
        duration: number;
    };
    pageLoadTimes: number[];
    elementInteractions: number;
    networkRequests?: number;
    memoryUsage?: {
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
}
export interface EnvironmentInfo {
    os: string;
    osVersion: string;
    nodeVersion: string;
    platform: string;
    browserVersion: string;
    resolution: string;
    timezone: string;
    locale: string;
    memoryUsage?: {
        used: number;
        total: number;
        percentage: number;
    };
    cpuUsage?: number;
    testPlatform: string;
    testPlatformVersion: string;
}
export interface Project {
    id: string;
    name: string;
    description: string;
    baseUrl: string;
    settings: ProjectSettings;
    feishuWebhook?: string;
    ownerId?: string;
    members?: ProjectMember[];
    createdAt: Date;
    updatedAt: Date;
    deleted?: boolean;
}
export interface ProjectSettings {
    headless: boolean;
    slowMo: number;
    screenshot: {
        enabled: boolean;
        onStep: boolean;
        onFailure: boolean;
    };
    timeout: number;
    waitAfter?: number;
}
export interface OneTimeSchedule {
    id: string;
    name: string;
    projectId: string;
    scenarioId: string;
    scenarioName: string;
    executionDate: string;
    cronExpression?: string;
    isExecutionHistory?: boolean;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    feishuWebhook?: string;
    notifyOnSuccess: boolean;
    notifyOnFailure: boolean;
    executedAt?: string;
    lastExecutedAt?: string;
    result?: {
        status: 'passed' | 'failed';
        passedTests: number;
        failedTests: number;
        duration: number;
        executionId?: string;
    };
    error?: string;
    createdAt: string;
    updatedAt: string;
}
export interface ScenarioTestCase {
    id: string;
    loopCount: number;
}
export interface Scenario {
    id: string;
    projectId: string;
    name: string;
    description: string;
    testCases: ScenarioTestCase[];
    createdAt: Date;
    updatedAt: Date;
}
export interface ScenarioExecution {
    id: string;
    projectId: string;
    scenarioId: string;
    scenarioName: string;
    status: 'pending' | 'running' | 'passed' | 'failed' | 'error';
    startTime: Date;
    endTime?: Date;
    duration?: number;
    executionIds: string[];
    totalTests: number;
    passedTests: number;
    failedTests: number;
    error?: string;
    logs: string[];
    context?: Record<string, any>;
}
export interface TestCase {
    id: string;
    projectId: string;
    name: string;
    description: string;
    url: string;
    useRelativeUrl: boolean;
    steps: TestStep[];
    expectedResults: string[];
    testData: Record<string, any>;
    tags: string[];
    dataDriven?: DataDrivenConfig;
    createdAt: Date;
    updatedAt: Date;
}
export interface DataDrivenConfig {
    enabled: boolean;
    dataFiles?: string[];
    dataFile?: string;
    dataRange?: string;
    executionCount?: number;
}
export interface TestStep {
    id: string;
    order: number;
    action: 'navigate' | 'click' | 'fill' | 'select' | 'wait' | 'screenshot' | 'verify' | 'template' | 'saveToContext';
    selector?: string;
    value?: string;
    description: string;
    screenshot?: boolean;
    highlightOnScreenshot?: boolean;
    waitTime?: number;
    waitAfter?: number;
    templateId?: string;
    assertion?: StepAssertion;
}
export interface StepAssertion {
    enabled: boolean;
    type: 'text_contains' | 'text_equals' | 'element_exists' | 'element_visible' | 'element_hidden' | 'attribute_equals' | 'element_enabled' | 'element_disabled' | 'url_contains' | 'title_equals';
    selector?: string;
    value?: string;
    attribute?: string;
    timeout?: number;
}
export interface StepTemplate {
    id: string;
    projectId: string;
    name: string;
    description: string;
    steps: TestStep[];
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface TestExecution {
    id: string;
    projectId: string;
    testCaseId: string;
    testCaseName: string;
    status: 'pending' | 'running' | 'passed' | 'failed' | 'error';
    startTime: Date;
    endTime?: Date;
    duration?: number;
    steps: TestStepResult[];
    screenshots: string[];
    error?: string;
    logs: string[];
    context?: Record<string, any>;
    structuredLogs?: LogEntry[];
    performanceMetrics?: PerformanceMetrics;
    environmentInfo?: EnvironmentInfo;
}
export interface TestStepResult {
    stepId: string;
    order: number;
    action: string;
    status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
    startTime: Date;
    endTime?: Date;
    duration?: number;
    screenshot?: string;
    error?: string;
    actualValue?: string;
}
export interface TestReport {
    id: string;
    projectId: string;
    type: 'test-case' | 'scenario';
    name: string;
    description: string;
    executionIds: string[];
    scenarioExecutionId?: string;
    scenarioName?: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    errorTests: number;
    duration: number;
    createdAt: Date;
    htmlPath?: string;
}
export interface AIConfig {
    enabled: boolean;
    provider: string;
    apiUrl: string;
    apiKey: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
}
export interface TestConfig {
    baseUrl: string;
    headless: boolean;
    slowMo: number;
    screenshot: {
        enabled: boolean;
        onStep: boolean;
        onFailure: boolean;
    };
    timeout: number;
}
export interface SystemConfig {
    ai: AIConfig;
    defaultProjectSettings: ProjectSettings;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export interface PaginationParams {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum UserRole {
    ADMIN = "admin",
    PROJECT_MANAGER = "project_manager",
    TESTER = "tester",
    VIEWER = "viewer"
}
export interface ProjectMember {
    userId: string;
    username: string;
    role: ProjectMemberRole;
    permissions: Permission[];
    joinedAt: Date;
}
export declare enum ProjectMemberRole {
    OWNER = "owner",
    ADMIN = "admin",
    MEMBER = "member",
    GUEST = "guest"
}
export declare enum Permission {
    READ = "read",
    WRITE = "write",
    EXECUTE = "execute",
    MANAGE = "manage"
}
export interface ProjectPermission {
    id: string;
    projectId: string;
    userId: string;
    permission: Permission;
    createdAt: Date;
}
export interface LoginDto {
    username: string;
    password: string;
}
export interface RegisterDto {
    username: string;
    email: string;
    password: string;
}
export interface JwtPayload {
    sub: string;
    username: string;
    role: UserRole;
}
export interface AuthResponse {
    accessToken: string;
    user: {
        id: string;
        username: string;
        email: string;
        role: UserRole;
    };
}
