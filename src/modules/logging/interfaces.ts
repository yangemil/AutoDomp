/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 'debug',      // 调试信息：详细的内部状态
  INFO = 'info',        // 一般信息：测试开始、完成等
  WARN = 'warn',        // 警告：非致命问题，如重试
  ERROR = 'error',      // 错误：测试失败、断言错误
  CRITICAL = 'critical' // 严重错误：系统崩溃、无法恢复
}

/**
 * 日志条目结构
 */
export interface LogEntry {
  id: string;                    // 唯一日志ID
  timestamp: string;             // ISO 8601时间戳
  level: LogLevel;               // 日志级别
  message: string;               // 日志消息
  executionId?: string;          // 关联的执行ID
  stepOrder?: number;            // 步骤序号
  context?: LogContext;          // 执行上下文
  metadata?: LogMetadata;        // 额外元数据
}

/**
 * 日志上下文信息
 */
export interface LogContext {
  traceId?: string;              // 分布式追踪ID（用于跨服务追踪）
  spanId?: string;               // 当前跨度ID
  projectId?: string;            // 项目ID
  scenarioId?: string;           // 场景ID
  testCaseId?: string;           // 测试用例ID
  userId?: string;               // 操作用户ID
  environment?: string;          // 环境标识
}

/**
 * 日志元数据
 */
export interface LogMetadata {
  duration?: number;             // 操作耗时（毫秒）
  selector?: string;             // 使用的CSS选择器
  element?: string;              // 交互的元素描述
  action?: string;               // 执行的动作类型
  value?: string;                // 输入的值
  error?: ErrorInfo;             // 错误详情
  screenshot?: string;           // 关联的截图文件名
  url?: string;                  // 当前页面URL
  pageTitle?: string;            // 当前页面标题
}

/**
 * 错误详情
 */
export interface ErrorInfo {
  message: string;               // 错误消息
  stack?: string;                // 错误堆栈
  code?: string;                 // 错误代码（如 TIMEOUT, ASSERTION_FAILED）
  type?: string;                 // 错误类型
}

/**
 * 日志过滤条件
 */
export interface LogFilters {
  level?: LogLevel;              // 按级别过滤
  startDate?: Date;              // 开始时间
  endDate?: Date;                // 结束时间
  stepOrder?: number;            // 按步骤过滤
  includeMetadata?: boolean;     // 是否包含元数据
}

/**
 * 日志搜索查询
 */
export interface LogSearchQuery {
  searchText?: string;           // 搜索文本
  level?: LogLevel[];            // 多级别过滤
  dateRange?: { start: Date; end: Date };  // 时间范围
  executionIds?: string[];       // 执行ID列表
  maxResults?: number;           // 最大结果数
}

/**
 * 日志搜索结果
 */
export interface LogSearchResult {
  total: number;                 // 总匹配数
  logs: LogEntry[];              // 日志列表
  aggregations?: {               // 聚合统计
    byLevel: Record<LogLevel, number>;     // 按级别统计
    byExecution: Record<string, number>;   // 按执行统计
  };
}
