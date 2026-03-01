"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TimerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimerService = void 0;
const common_1 = require("@nestjs/common");
const data_1 = require("../data");
const test_engine_1 = require("../test-engine");
const notification_service_1 = require("../notification/notification.service");
const report_service_1 = require("../report/report.service");
const uuid_1 = require("uuid");
let TimerService = TimerService_1 = class TimerService {
    constructor(dataService, testEngineService, notificationService, reportService) {
        this.dataService = dataService;
        this.testEngineService = testEngineService;
        this.notificationService = notificationService;
        this.reportService = reportService;
        this.logger = new common_1.Logger(TimerService_1.name);
        this.isRunning = false;
        this.executionQueue = [];
    }
    onModuleInit() {
        this.logger.log('定时任务服务已启动');
        this.recoverPendingTasks();
        this.startScheduler();
    }
    startScheduler() {
        this.logger.log('定时任务调度器已启动，每60秒检查一次');
        setInterval(async () => {
            this.logger.log('开始检查定时任务...');
            await this.checkAndExecute();
        }, 60000);
    }
    async recoverPendingTasks() {
        try {
            const schedules = await this.dataService.getOneTimeSchedules();
            const pending = schedules.filter(s => s.status === 'pending');
            if (pending.length > 0) {
                this.logger.log(`恢复 ${pending.length} 个待执行的定时任务`);
            }
        }
        catch (error) {
            this.logger.error(`恢复待执行任务失败: ${error.message}`);
        }
    }
    async checkAndExecute() {
        try {
            const schedules = await this.dataService.getOneTimeSchedules();
            this.logger.log(`共 ${schedules.length} 个定时任务，待执行: ${schedules.filter(s => s.status === 'pending').length}`);
            const now = new Date();
            const currentTime = now.getTime();
            this.logger.log(`当前时间: ${now.toISOString()}, 检查任务列表`);
            for (const schedule of schedules) {
                if (schedule.status !== 'pending')
                    continue;
                if (schedule.cronExpression) {
                    const cronMatch = this.isCronMatch(schedule.cronExpression, now);
                    const lastExec = schedule.lastExecutedAt ? new Date(schedule.lastExecutedAt).getTime() : 0;
                    const lastExecStr = lastExec ? new Date(lastExec).toLocaleString('zh-CN', { hour12: false }) : '从未';
                    this.logger.log(`Cron任务: ${schedule.name}, 表达式: ${schedule.cronExpression}, 匹配: ${cronMatch}, 上次执行: ${lastExecStr}`);
                    if (cronMatch) {
                        if (currentTime - lastExec >= 60000) {
                            this.executionQueue.push(schedule);
                            this.logger.log(`Cron任务已加入执行队列: ${schedule.name}`);
                        }
                        else {
                            this.logger.log(`跳过（1分钟内已执行）: ${schedule.name}`);
                        }
                    }
                }
                else if (schedule.executionDate) {
                    const executionTime = new Date(schedule.executionDate);
                    if (now >= executionTime) {
                        this.executionQueue.push(schedule);
                        this.logger.log(`一次性任务已加入执行队列: ${schedule.name}`);
                    }
                    else {
                        this.logger.log(`一次性任务未到执行时间: ${schedule.name}, 计划时间: ${executionTime.toISOString()}`);
                    }
                }
            }
            this.executeQueue();
        }
        catch (error) {
            this.logger.error(`检查定时任务失败: ${error.message}`);
        }
    }
    isCronMatch(cron, date) {
        const parts = cron.trim().split(/\s+/);
        if (parts.length !== 5)
            return false;
        const [min, hour, day, month, week] = parts;
        const m = date.getMinutes();
        const h = date.getHours();
        const d = date.getDate();
        const mo = date.getMonth() + 1;
        const w = date.getDay();
        if (!this.matchCronPart(min, m)) {
            this.logger.log(`分钟不匹配: ${min} vs ${m}`);
            return false;
        }
        if (!this.matchCronPart(hour, h)) {
            this.logger.log(`小时不匹配: ${hour} vs ${h}`);
            return false;
        }
        if (!this.matchCronPart(day, d)) {
            this.logger.log(`日期不匹配: ${day} vs ${d}`);
            return false;
        }
        if (!this.matchCronPart(month, mo)) {
            this.logger.log(`月份不匹配: ${month} vs ${mo}`);
            return false;
        }
        if (!this.matchCronPart(week, w)) {
            this.logger.log(`星期不匹配: ${week} vs ${w}`);
            return false;
        }
        return true;
    }
    matchCronPart(part, value) {
        if (part === '*')
            return true;
        const stepMatch = part.match(/^(\d+)\/(\d+)$/);
        if (stepMatch) {
            const [, start, step] = stepMatch;
            return (value - parseInt(start)) % parseInt(step) === 0;
        }
        const rangeMatch = part.match(/^(\d+)-(\d+)$/);
        if (rangeMatch) {
            const [, start, end] = rangeMatch;
            return value >= parseInt(start) && value <= parseInt(end);
        }
        const listMatch = part.match(/^(\d+(,\d+)*)$/);
        if (listMatch) {
            return listMatch[1].split(',').map(n => parseInt(n)).includes(value);
        }
        return parseInt(part) === value;
    }
    async executeQueue() {
        if (this.isRunning || this.executionQueue.length === 0)
            return;
        this.isRunning = true;
        this.logger.log(`开始执行任务队列，当前队列: ${this.executionQueue.length} 个任务`);
        while (this.executionQueue.length > 0) {
            const task = this.executionQueue.shift();
            await this.executeTask(task);
        }
        this.isRunning = false;
    }
    async executeTask(task) {
        this.logger.log(`开始执行定时任务: ${task.name}`);
        const executionRecordId = (0, uuid_1.v4)();
        const executionRecord = {
            ...task,
            id: executionRecordId,
            status: 'running',
            executedAt: undefined,
            result: undefined,
            isExecutionHistory: true,
            updatedAt: new Date().toISOString()
        };
        await this.dataService.saveOneTimeSchedule(executionRecord);
        if (!task.cronExpression) {
            task.status = 'completed';
            task.updatedAt = new Date().toISOString();
            await this.dataService.saveOneTimeSchedule(task);
        }
        try {
            const result = await this.testEngineService.executeScenario(task.scenarioId, {}, task.projectId);
            const execution = Array.isArray(result) ? result[0] : result;
            executionRecord.executedAt = new Date().toISOString();
            executionRecord.result = {
                status: execution.status === 'passed' ? 'passed' : 'failed',
                passedTests: execution.passedTests || 0,
                failedTests: execution.failedTests || 0,
                duration: execution.duration || 0,
                executionId: execution.id
            };
            const finalStatus = execution.status === 'passed' ? 'completed' : 'failed';
            executionRecord.status = finalStatus;
            this.logger.log(`任务执行结果: ${task.name}, status=${finalStatus}, passedTests=${execution.passedTests}, failedTests=${execution.failedTests}`);
            this.logger.log(`飞书配置: webhook=${task.feishuWebhook}, notifyOnSuccess=${task.notifyOnSuccess}, notifyOnFailure=${task.notifyOnFailure}`);
            if (task.feishuWebhook) {
                const shouldNotify = (task.notifyOnSuccess && finalStatus === 'completed') ||
                    (task.notifyOnFailure && finalStatus === 'failed');
                this.logger.log(`飞书通知检查: shouldNotify=${shouldNotify}, finalStatus=${finalStatus}`);
                if (shouldNotify) {
                    try {
                        const executionDateFormatted = task.executionDate
                            ? new Date(task.executionDate).toLocaleString('zh-CN', { hour12: false })
                            : undefined;
                        const executedAtFormatted = executionRecord.executedAt
                            ? new Date(executionRecord.executedAt).toLocaleString('zh-CN', { hour12: false })
                            : undefined;
                        await this.notificationService.sendFeishuNotification(task.feishuWebhook, {
                            taskName: task.name,
                            scenarioName: task.scenarioName,
                            status: executionRecord.result.status,
                            passedTests: executionRecord.result.passedTests,
                            failedTests: executionRecord.result.failedTests,
                            duration: executionRecord.result.duration,
                            executionDate: executionDateFormatted,
                            cronExpression: task.cronExpression,
                            executedAt: executedAtFormatted,
                            executionUrl: `http://localhost:3000/executions/${execution.id}`
                        });
                        this.logger.log(`飞书通知已发送: ${task.name}`);
                    }
                    catch (notifyError) {
                        this.logger.error(`飞书通知发送失败: ${notifyError.message}`);
                    }
                }
            }
            if (task.cronExpression) {
                task.lastExecutedAt = new Date().toISOString();
                task.status = 'pending';
                this.logger.log(`Cron任务状态保持pending: ${task.name}`);
            }
        }
        catch (error) {
            this.logger.error(`任务执行失败: ${error.message}`);
            executionRecord.status = 'failed';
            executionRecord.error = error.message;
        }
        executionRecord.updatedAt = new Date().toISOString();
        await this.dataService.saveOneTimeSchedule(executionRecord);
        this.logger.log(`定时任务执行记录已保存: ${executionRecord.id}, 状态: ${executionRecord.status}`);
        if (executionRecord.result?.executionId) {
            try {
                this.logger.log(`开始生成测试报告: ${task.name}, 场景执行ID: ${executionRecord.result.executionId}`);
                const scenarioExec = await this.dataService.getScenarioExecution(executionRecord.result.executionId);
                if (scenarioExec) {
                    const report = await this.reportService.generateScenarioReport(scenarioExec);
                    this.logger.log(`测试报告已生成: ${report.id}, 名称: ${report.name}`);
                }
                else {
                    this.logger.warn(`场景执行记录不存在: ${executionRecord.result.executionId}`);
                }
            }
            catch (reportError) {
                this.logger.error(`生成测试报告失败: ${reportError.message}`);
            }
        }
    }
    async createSchedule(schedule) {
        const newSchedule = {
            id: (0, uuid_1.v4)(),
            name: schedule.name,
            projectId: schedule.projectId,
            scenarioId: schedule.scenarioId,
            scenarioName: schedule.scenarioName,
            executionDate: schedule.executionDate,
            status: 'pending',
            feishuWebhook: schedule.feishuWebhook,
            notifyOnSuccess: schedule.notifyOnSuccess ?? true,
            notifyOnFailure: schedule.notifyOnFailure ?? true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await this.dataService.saveOneTimeSchedule(newSchedule);
        return newSchedule;
    }
    async getSchedules() {
        return this.dataService.getOneTimeSchedules();
    }
    async getSchedule(id) {
        return this.dataService.getOneTimeSchedule(id);
    }
    async updateSchedule(id, updates) {
        const schedule = await this.dataService.getOneTimeSchedule(id);
        if (!schedule)
            return null;
        const updated = { ...schedule, ...updates, updatedAt: new Date().toISOString() };
        await this.dataService.saveOneTimeSchedule(updated);
        return updated;
    }
    async deleteSchedule(id) {
        return this.dataService.deleteOneTimeSchedule(id);
    }
    async cancelSchedule(id) {
        const schedule = await this.dataService.getOneTimeSchedule(id);
        if (!schedule)
            return null;
        if (schedule.status !== 'pending') {
            throw new Error('只能取消待执行的任务');
        }
        schedule.status = 'cancelled';
        schedule.updatedAt = new Date().toISOString();
        await this.dataService.saveOneTimeSchedule(schedule);
        return schedule;
    }
    async runNow(id) {
        const schedule = await this.dataService.getOneTimeSchedule(id);
        if (!schedule)
            return null;
        if (schedule.status !== 'pending') {
            throw new Error('只能执行待执行的任务');
        }
        this.executionQueue.push(schedule);
        this.executeQueue();
        return schedule;
    }
};
exports.TimerService = TimerService;
exports.TimerService = TimerService = TimerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [data_1.DataService,
        test_engine_1.TestEngineService,
        notification_service_1.NotificationService,
        report_service_1.ReportService])
], TimerService);
//# sourceMappingURL=timer.service.js.map