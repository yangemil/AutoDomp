import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { DataService } from '../data';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly dataService: DataService) {}

  async sendFeishuNotification(
    webhook: string,
    data: {
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
    }
  ): Promise<boolean> {
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
      await axios.post(webhook, message, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      this.logger.log(`飞书通知发送成功: ${data.taskName}`);
      return true;
    } catch (error) {
      this.logger.error(`飞书通知发送失败: ${error.message}`);
      return false;
    }
  }
}
