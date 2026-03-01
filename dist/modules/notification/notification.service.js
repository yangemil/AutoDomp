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
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const data_1 = require("../data");
let NotificationService = NotificationService_1 = class NotificationService {
    constructor(dataService) {
        this.dataService = dataService;
        this.logger = new common_1.Logger(NotificationService_1.name);
    }
    async sendFeishuNotification(webhook, data) {
        if (!webhook) {
            this.logger.warn('飞书Webhook URL未配置，跳过通知');
            return false;
        }
        const statusIcon = data.status === 'passed' ? '✅' : '❌';
        const statusText = data.status === 'passed' ? '通过' : '失败';
        const template = data.status === 'passed' ? 'green' : 'red';
        const message = {
            msg_type: 'interactive',
            card: {
                config: {
                    wide_screen_mode: true,
                },
                header: {
                    title: {
                        tag: 'text',
                        content: `🤖 测试执行通知 - ${statusText}`,
                    },
                    template: template,
                },
                elements: [
                    {
                        tag: 'div',
                        fields: [
                            {
                                is_short: true,
                                text: {
                                    tag: 'lark_md',
                                    content: `**任务名称**\n${data.taskName}`,
                                },
                            },
                            {
                                is_short: true,
                                text: {
                                    tag: 'lark_md',
                                    content: `**场景名称**\n${data.scenarioName}`,
                                },
                            },
                        ],
                    },
                    {
                        tag: 'div',
                        fields: [
                            {
                                is_short: true,
                                text: {
                                    tag: 'lark_md',
                                    content: `**执行状态**\n${statusIcon} ${statusText}`,
                                },
                            },
                            {
                                is_short: true,
                                text: {
                                    tag: 'lark_md',
                                    content: `**执行耗时**\n${(data.duration / 1000).toFixed(1)}秒`,
                                },
                            },
                        ],
                    },
                    {
                        tag: 'div',
                        text: {
                            tag: 'lark_md',
                            content: `**测试结果**\n通过: ${data.passedTests} | 失败: ${data.failedTests}`,
                        },
                    },
                    {
                        tag: 'div',
                        text: {
                            tag: 'lark_md',
                            content: `${data.executionDate ? `**计划执行时间**: ${data.executionDate}` : data.cronExpression ? `**Cron表达式**: ${data.cronExpression}` : ''}${data.executedAt ? `\n**实际执行时间**: ${data.executedAt}` : ''}`,
                        },
                    },
                    {
                        tag: 'action',
                        actions: [
                            {
                                tag: 'button',
                                text: {
                                    tag: 'lark_md',
                                    content: '查看执行详情',
                                },
                                type: 'primary',
                                url: data.executionUrl || '',
                            },
                        ],
                    },
                ],
            },
        };
        try {
            await axios_1.default.post(webhook, message, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000,
            });
            this.logger.log(`飞书通知发送成功: ${data.taskName}`);
            return true;
        }
        catch (error) {
            this.logger.error(`飞书通知发送失败: ${error.message}`);
            return false;
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [data_1.DataService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map