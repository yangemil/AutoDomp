"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LoggingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const interfaces_1 = require("./interfaces");
let LoggingService = LoggingService_1 = class LoggingService {
    constructor() {
        this.logger = new common_1.Logger(LoggingService_1.name);
        this.logBuffer = new Map();
    }
    log(level, message, context) {
        const logEntry = {
            id: (0, uuid_1.v4)(),
            timestamp: new Date().toISOString(),
            level,
            message,
            ...context
        };
        this.logger.log(`[${level.toUpperCase()}] ${message}`);
        return logEntry;
    }
    logTestExecution(executionId, level, message, metadata) {
        const logEntry = this.log(level, message);
        logEntry.executionId = executionId;
        logEntry.metadata = metadata;
        this.addToBuffer(executionId, logEntry);
        return logEntry;
    }
    logStepExecution(executionId, stepOrder, level, message, metadata) {
        const logEntry = this.log(level, message);
        logEntry.executionId = executionId;
        logEntry.stepOrder = stepOrder;
        logEntry.metadata = metadata;
        this.addToBuffer(executionId, logEntry);
        return logEntry;
    }
    logError(executionId, error, context, metadata) {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            type: error.constructor.name
        };
        return this.logStepExecution(executionId, context?.stepOrder || 0, interfaces_1.LogLevel.ERROR, `执行错误: ${error.message}`, {
            ...metadata,
            error: errorInfo
        });
    }
    addToBuffer(executionId, logEntry) {
        if (!this.logBuffer.has(executionId)) {
            this.logBuffer.set(executionId, []);
        }
        this.logBuffer.get(executionId)?.push(logEntry);
    }
    getExecutionLogs(executionId, filters) {
        const logs = this.logBuffer.get(executionId) || [];
        if (!filters) {
            return logs;
        }
        return logs.filter(log => {
            if (filters.level && log.level !== filters.level) {
                return false;
            }
            if (filters.stepOrder !== undefined && log.stepOrder !== filters.stepOrder) {
                return false;
            }
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
    clearExecutionLogs(executionId) {
        this.logBuffer.delete(executionId);
    }
    searchLogs(query) {
        const allLogs = [];
        for (const logs of this.logBuffer.values()) {
            allLogs.push(...logs);
        }
        let results = allLogs;
        if (query.executionIds && query.executionIds.length > 0) {
            results = results.filter(log => log.executionId && query.executionIds.includes(log.executionId));
        }
        if (query.level && query.level.length > 0) {
            results = results.filter(log => query.level.includes(log.level));
        }
        if (query.dateRange) {
            results = results.filter(log => {
                const timestamp = new Date(log.timestamp);
                return timestamp >= query.dateRange.start && timestamp <= query.dateRange.end;
            });
        }
        if (query.searchText) {
            const searchTerms = query.searchText.toLowerCase().split(' ');
            results = results.filter(log => {
                const message = log.message.toLowerCase();
                return searchTerms.every(term => message.includes(term));
            });
        }
        const maxResults = query.maxResults || 100;
        const finalResults = results.slice(0, maxResults);
        const aggregations = this.calculateAggregations(finalResults);
        return {
            total: allLogs.length,
            logs: finalResults,
            aggregations
        };
    }
    calculateAggregations(logs) {
        const byLevel = {
            debug: 0,
            info: 0,
            warn: 0,
            error: 0,
            critical: 0
        };
        const byExecution = {};
        logs.forEach(log => {
            byLevel[log.level]++;
            if (log.executionId) {
                byExecution[log.executionId] = (byExecution[log.executionId] || 0) + 1;
            }
        });
        return { byLevel, byExecution };
    }
    exportLogsJSON(executionId) {
        const logs = this.getExecutionLogs(executionId);
        return JSON.stringify(logs, null, 2);
    }
    exportLogsCSV(executionId) {
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
        return '\uFEFF' + csvContent;
    }
};
exports.LoggingService = LoggingService;
exports.LoggingService = LoggingService = LoggingService_1 = __decorate([
    (0, common_1.Injectable)()
], LoggingService);
//# sourceMappingURL=logging.service.js.map