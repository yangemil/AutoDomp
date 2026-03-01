import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  LogLevel,
  LogEntry,
  LogContext,
  LogMetadata,
  ErrorInfo,
  LogFilters,
  LogSearchQuery,
  LogSearchResult
} from './interfaces';

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);
  private logBuffer: Map<string, LogEntry[]> = new Map(); // 按executionId缓存日志

  /**
   * 记录结构化日志
   */
  log(level: LogLevel, message: string, context?: LogContext): LogEntry {
    const logEntry: LogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context
    };

    this.logger.log(`[${level.toUpperCase()}] ${message}`);
    return logEntry;
  }

  /**
   * 记录测试执行专用日志
   */
  logTestExecution(
    executionId: string,
    level: LogLevel,
    message: string,
    metadata?: LogMetadata
  ): LogEntry {
    const logEntry = this.log(level, message);
    logEntry.executionId = executionId;
    logEntry.metadata = metadata;

    // 缓存日志到内存
    this.addToBuffer(executionId, logEntry);

    return logEntry;
  }

  /**
   * 记录步骤执行日志
   */
  logStepExecution(
    executionId: string,
    stepOrder: number,
    level: LogLevel,
    message: string,
    metadata?: LogMetadata
  ): LogEntry {
    const logEntry = this.log(level, message);
    logEntry.executionId = executionId;
    logEntry.stepOrder = stepOrder;
    logEntry.metadata = metadata;

    this.addToBuffer(executionId, logEntry);

    return logEntry;
  }

  /**
   * 记录错误日志
   */
  logError(
    executionId: string,
    error: Error,
    context?: Partial<LogContext> & { stepOrder?: number; },
    metadata?: LogMetadata
  ): LogEntry {
    const errorInfo: ErrorInfo = {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
    };

    return this.logStepExecution(
      executionId,
      context?.stepOrder || 0,
      LogLevel.ERROR,
      `执行错误: ${error.message}`,
      {
        ...metadata,
        error: errorInfo
      }
    );
  }

  /**
   * 添加日志到缓存
   */
  private addToBuffer(executionId: string, logEntry: LogEntry): void {
    if (!this.logBuffer.has(executionId)) {
      this.logBuffer.set(executionId, []);
    }
    this.logBuffer.get(executionId)?.push(logEntry);
  }

  /**
   * 获取执行的所有日志
   */
  getExecutionLogs(executionId: string, filters?: LogFilters): LogEntry[] {
    const logs = this.logBuffer.get(executionId) || [];

    if (!filters) {
      return logs;
    }

    return logs.filter(log => {
      // 按级别过滤
      if (filters.level && log.level !== filters.level) {
        return false;
      }

      // 按步骤过滤
      if (filters.stepOrder !== undefined && log.stepOrder !== filters.stepOrder) {
        return false;
      }

      // 按时间范围过滤
      if (filters.startDate || filters.endDate) {
        const timestamp = new Date(log.timestamp);
        if (filters.startDate && timestamp < filters.startDate) {
          return false;
        }
        if (filters.endDate && timestamp > filters.endDate) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 清除缓存的日志
   */
  clearExecutionLogs(executionId: string): void {
    this.logBuffer.delete(executionId);
  }

  /**
   * 搜索日志
   */
  searchLogs(query: LogSearchQuery): LogSearchResult {
    const allLogs: LogEntry[] = [];

    // 从缓存中收集所有日志
    for (const logs of this.logBuffer.values()) {
      allLogs.push(...logs);
    }

    let results = allLogs;

    // 按执行ID过滤
    if (query.executionIds && query.executionIds.length > 0) {
      results = results.filter(log =>
        log.executionId && query.executionIds!.includes(log.executionId)
      );
    }

    // 按级别过滤
    if (query.level && query.level.length > 0) {
      results = results.filter(log => query.level!.includes(log.level));
    }

    // 按时间范围过滤
    if (query.dateRange) {
      results = results.filter(log => {
        const timestamp = new Date(log.timestamp);
        return timestamp >= query.dateRange!.start && timestamp <= query.dateRange!.end;
      });
    }

    // 文本搜索
    if (query.searchText) {
      const searchTerms = query.searchText.toLowerCase().split(' ');
      results = results.filter(log => {
        const message = log.message.toLowerCase();
        return searchTerms.every(term => message.includes(term));
      });
    }

    // 限制结果数量
    const maxResults = query.maxResults || 100;
    const finalResults = results.slice(0, maxResults);

    // 计算聚合统计
    const aggregations = this.calculateAggregations(finalResults);

    return {
      total: allLogs.length,
      logs: finalResults,
      aggregations
    };
  }

  /**
   * 计算聚合统计
   */
  private calculateAggregations(logs: LogEntry[]): LogSearchResult['aggregations'] {
    const byLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      critical: 0
    };

    const byExecution: Record<string, number> = {};

    logs.forEach(log => {
      byLevel[log.level]++;
      if (log.executionId) {
        byExecution[log.executionId] = (byExecution[log.executionId] || 0) + 1;
      }
    });

    return { byLevel, byExecution };
  }

  /**
   * 导出日志为JSON格式
   */
  exportLogsJSON(executionId: string): string {
    const logs = this.getExecutionLogs(executionId);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * 导出日志为CSV格式
   */
  exportLogsCSV(executionId: string): string {
    const logs = this.getExecutionLogs(executionId);

    const headers = ['ID', 'Timestamp', 'Level', 'Message', 'Step Order', 'Duration (ms)'];
    const rows = logs.map(log => [
      log.id,
      log.timestamp,
      log.level,
      log.message,
      log.stepOrder || '',
      log.metadata?.duration || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return '\uFEFF' + csvContent; // 添加BOM以支持Excel中文显示
  }
}
