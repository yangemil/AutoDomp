import { Injectable, Logger } from '@nestjs/common';
import { DataService } from '../data';
import { TestReport, TestExecution, ScenarioExecution } from '../../common/interfaces';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(private readonly dataService: DataService) {}

  async generateScenarioReport(scenarioExecution: ScenarioExecution): Promise<TestReport> {
    this.logger.log(`开始生成场景报告: ${scenarioExecution.scenarioName}, 执行数: ${scenarioExecution.executionIds.length}`);
    
    const executions: TestExecution[] = [];
    
    for (const id of scenarioExecution.executionIds) {
      const execution = await this.dataService.getExecution(id);
      if (execution) {
        executions.push(execution);
      } else {
        this.logger.warn(`未找到执行记录: ${id}`);
      }
    }

    this.logger.log(`找到 ${executions.length} 条执行记录`);

    const report: TestReport = {
      id: uuidv4(),
      projectId: scenarioExecution.projectId,
      type: 'scenario',
      name: `场景报告 - ${scenarioExecution.scenarioName}`,
      description: `场景: ${scenarioExecution.scenarioName} 的测试报告`,
      executionIds: scenarioExecution.executionIds,
      scenarioExecutionId: scenarioExecution.id,
      scenarioName: scenarioExecution.scenarioName,
      totalTests: scenarioExecution.totalTests,
      passedTests: scenarioExecution.passedTests,
      failedTests: scenarioExecution.failedTests,
      errorTests: 0,
      duration: scenarioExecution.duration || 0,
      createdAt: new Date()
    };

    const htmlContent = this.generateScenarioHTML(report, executions, scenarioExecution);
    const htmlFilename = `scenario_report_${report.id}.html`;
    const htmlPath = this.dataService.getScenarioReportHtmlPath(scenarioExecution.projectId, htmlFilename);
    
    this.logger.log(`保存HTML报告到: ${htmlPath}`);
    
    const BOM = '\uFEFF';
    fs.writeFileSync(htmlPath, BOM + htmlContent, 'utf-8');
    report.htmlPath = htmlFilename;

    this.logger.log(`保存报告JSON到数据库`);
    await this.dataService.saveReport(report);
    
    this.logger.log(`场景报告生成完成: ${report.id}`);
    return report;
  }

  async generateReport(projectId: string, executionIds: string[], name?: string, description?: string): Promise<TestReport> {
    const executions: TestExecution[] = [];
    
    for (const id of executionIds) {
      const execution = await this.dataService.getExecution(id);
      if (execution) {
        executions.push(execution);
      }
    }

    if (executions.length === 0) {
      throw new Error('没有找到有效的测试执行记录');
    }

    const report: TestReport = {
      id: uuidv4(),
      projectId,
      type: 'test-case',
      name: name || `测试报告 ${new Date().toLocaleString('zh-CN')}`,
      description: description || '自动化测试报告',
      executionIds,
      totalTests: executions.length,
      passedTests: executions.filter(e => e.status === 'passed').length,
      failedTests: executions.filter(e => e.status === 'failed').length,
      errorTests: executions.filter(e => e.status === 'error').length,
      duration: executions.reduce((sum, e) => sum + (e.duration || 0), 0),
      createdAt: new Date()
    };

    const htmlContent = this.generateHTML(report, executions);
    const htmlFilename = `report_${report.id}.html`;
    const htmlPath = this.dataService.getReportHtmlPath(projectId, htmlFilename);
    
    // 确保使用UTF-8编码，添加BOM以避免某些浏览器编码识别问题
    const BOM = '\uFEFF';
    fs.writeFileSync(htmlPath, BOM + htmlContent, 'utf-8');
    report.htmlPath = htmlFilename;

    await this.dataService.saveReport(report);
    
    return report;
  }

  private generateHTML(report: TestReport, executions: TestExecution[]): string {
    const passRate = report.totalTests > 0 
      ? ((report.passedTests / report.totalTests) * 100).toFixed(2) 
      : '0.00';

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f5f7fa;
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .stat-card h3 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .stat-card p {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .stat-card.total h3 { color: #667eea; }
        .stat-card.passed h3 { color: #10b981; }
        .stat-card.failed h3 { color: #ef4444; }
        .stat-card.error h3 { color: #f59e0b; }
        
        .progress-bar {
            background: #e5e7eb;
            border-radius: 20px;
            height: 30px;
            overflow: hidden;
            margin-bottom: 30px;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
            transition: width 0.5s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        
        .executions {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .execution {
            border-bottom: 1px solid #e5e7eb;
            padding: 20px;
        }
        
        .execution:last-child {
            border-bottom: none;
        }
        
        .execution-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .execution-name {
            font-size: 1.2em;
            font-weight: 600;
        }
        
        .execution-status {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-passed { background: #d1fae5; color: #065f46; }
        .status-failed { background: #fee2e2; color: #991b1b; }
        .status-error { background: #fef3c7; color: #92400e; }
        
        .execution-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            color: #666;
            font-size: 0.9em;
        }
        
        .steps {
            margin-top: 15px;
        }
        
        .step {
            background: #f9fafb;
            padding: 12px;
            border-radius: 5px;
            margin-top: 10px;
            font-size: 0.9em;
        }
        
        .step-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        
        .step-status {
            font-weight: 600;
        }
        
        .step-status.passed { color: #10b981; }
        .step-status.failed { color: #ef4444; }
        
        .screenshot {
            margin-top: 10px;
        }
        
        .screenshot img {
            max-width: 100%;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .logs {
            background: #1f2937;
            color: #10b981;
            padding: 15px;
            border-radius: 5px;
            margin-top: 10px;
            font-family: 'Courier New', monospace;
            font-size: 0.85em;
            max-height: 200px;
            overflow-y: auto;
        }
        
        .logs pre {
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            color: #666;
            font-size: 0.9em;
        }
        
        @media print {
            .container { max-width: 100%; }
            .header { break-inside: avoid; }
            .execution { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${report.name}</h1>
            <p>${report.description}</p>
            <p style="margin-top: 10px; font-size: 0.9em;">生成时间: ${new Date(report.createdAt).toLocaleString('zh-CN')}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card total">
                <h3>${report.totalTests}</h3>
                <p>总测试数</p>
            </div>
            <div class="stat-card passed">
                <h3>${report.passedTests}</h3>
                <p>通过</p>
            </div>
            <div class="stat-card failed">
                <h3>${report.failedTests}</h3>
                <p>失败</p>
            </div>
            <div class="stat-card error">
                <h3>${report.errorTests}</h3>
                <p>错误</p>
            </div>
        </div>
        
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${passRate}%">
                通过率: ${passRate}%
            </div>
        </div>
        
        <div class="executions">
            ${executions.map(execution => this.renderExecution(execution)).join('')}
        </div>
        
        <div class="footer">
            <p>AutoDOMP - AI驱动的Web自动化测试平台</p>
            <p>总耗时: ${(report.duration / 1000).toFixed(2)} 秒</p>
        </div>
    </div>
</body>
</html>`;
  }

  private renderExecution(execution: TestExecution): string {
    return `
    <div class="execution">
        <div class="execution-header">
            <div class="execution-name">${execution.testCaseName}</div>
            <span class="execution-status status-${execution.status}">${this.getStatusText(execution.status)}</span>
        </div>
        
        <div class="execution-meta">
            <div>开始时间: ${new Date(execution.startTime).toLocaleString('zh-CN')}</div>
            <div>耗时: ${((execution.duration || 0) / 1000).toFixed(2)} 秒</div>
            <div>步骤数: ${execution.steps.length}</div>
        </div>
        
        ${execution.steps.length > 0 ? `
        <div class="steps">
            <h4>执行步骤</h4>
            ${execution.steps.map(step => this.renderStep(step)).join('')}
        </div>
        ` : ''}
        
        ${execution.error ? `
        <div style="margin-top: 10px; padding: 10px; background: #fee2e2; border-radius: 5px; color: #991b1b;">
            <strong>错误信息:</strong> ${execution.error}
        </div>
        ` : ''}
        
        ${execution.logs && execution.logs.length > 0 ? `
        <div class="logs">
            <pre>${execution.logs.join('\n')}</pre>
        </div>
        ` : ''}
    </div>`;
  }

  private renderStep(step: any): string {
    const selector = step.selector ? `: ${step.selector}` : '';
    const value = step.value ? `: ${step.value}` : '';
    
    return `
    <div class="step">
        <div class="step-header">
            <span>执行步骤 ${step.order}: ${step.description || step.action}${selector}${value}</span>
            <span class="step-status ${step.status}">${this.getStatusText(step.status)}</span>
        </div>
        <div>耗时: ${((step.duration || 0) / 1000).toFixed(2)} 秒</div>
        ${step.error ? `<div style="color: #ef4444; margin-top: 5px;">错误: ${step.error}</div>` : ''}
        ${step.screenshot ? `
        <div class="screenshot">
            <img src="/data/screenshots/${step.screenshot}" alt="步骤 ${step.order} 截图" onclick="window.open(this.src)" style="cursor: pointer;">
        </div>` : ''}
    </div>`;
  }

  private getStatusText(status: string): string {
    const statusMap = {
      pending: '待执行',
      running: '执行中',
      passed: '通过',
      failed: '失败',
      error: '错误',
      skipped: '跳过'
    };
    return statusMap[status] || status;
  }

  private generateScenarioHTML(report: TestReport, executions: TestExecution[], scenarioExecution: ScenarioExecution): string {
    const passRate = report.totalTests > 0 
      ? ((report.passedTests / report.totalTests) * 100).toFixed(2) 
      : '0.00';

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; color: #333; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px; margin-bottom: 30px; }
        .header h1 { font-size: 2em; margin-bottom: 10px; }
        .scenario-badge { background: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 20px; font-size: 0.9em; margin-top: 10px; display: inline-block; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .stat-card h3 { font-size: 2.5em; margin-bottom: 10px; }
        .stat-card.total h3 { color: #667eea; }
        .stat-card.passed h3 { color: #10b981; }
        .stat-card.failed h3 { color: #ef4444; }
        .progress-bar { background: #e5e7eb; border-radius: 20px; height: 30px; overflow: hidden; margin-bottom: 30px; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #10b981 0%, #059669 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
        .test-case { background: white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; overflow: hidden; }
        .test-case-header { padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
        .test-case-name { font-size: 1.2em; font-weight: 600; }
        .test-case-status { padding: 5px 15px; border-radius: 20px; font-weight: 600; }
        .status-passed { background: #d1fae5; color: #065f46; }
        .status-failed { background: #fee2e2; color: #991b1b; }
        .test-case-meta { padding: 15px 20px; background: #f9fafb; display: flex; gap: 20px; color: #666; font-size: 0.9em; }
        .test-case-steps { padding: 20px; }
        .step { background: #f9fafb; padding: 12px; border-radius: 5px; margin-top: 10px; font-size: 0.9em; }
        .step-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .step-status.passed { color: #10b981; }
        .step-status.failed { color: #ef4444; }
        .screenshot img { max-width: 100%; border-radius: 5px; margin-top: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; }
        .logs { background: #1f2937; color: #10b981; padding: 15px; border-radius: 5px; margin-top: 10px; font-family: 'Courier New', monospace; font-size: 0.85em; max-height: 200px; overflow-y: auto; }
        .logs pre { margin: 0; white-space: pre-wrap; word-wrap: break-word; }
        .footer { text-align: center; padding: 30px; color: #666; font-size: 0.9em; }
        @media print { .container { max-width: 100%; } .header { break-inside: avoid; } .test-case { break-inside: avoid; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${report.name}</h1>
            <p>${report.description}</p>
            <div class="scenario-badge">场景测试报告</div>
            <p style="margin-top: 10px; font-size: 0.9em;">生成时间: ${new Date(report.createdAt).toLocaleString('zh-CN')}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card total">
                <h3>${report.totalTests}</h3>
                <p>总测试数</p>
            </div>
            <div class="stat-card passed">
                <h3>${report.passedTests}</h3>
                <p>通过</p>
            </div>
            <div class="stat-card failed">
                <h3>${report.failedTests}</h3>
                <p>失败</p>
            </div>
        </div>
        
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${passRate}%">
                通过率: ${passRate}%
            </div>
        </div>
        
        <h2 style="margin-bottom: 20px;">测试用例执行详情</h2>
        
        ${executions.map(execution => this.renderTestCaseExecution(execution)).join('')}
        
        <div class="footer">
            <p>AutoDOMP - AI驱动的Web自动化测试平台</p>
            <p>总耗时: ${(report.duration / 1000).toFixed(2)} 秒</p>
        </div>
    </div>
</body>
</html>`;
  }

  private renderTestCaseExecution(execution: TestExecution): string {
    return `
    <div class="test-case">
        <div class="test-case-header">
            <div class="test-case-name">${execution.testCaseName || '测试用例'}</div>
            <span class="test-case-status status-${execution.status}">${this.getStatusText(execution.status)}</span>
        </div>
        <div class="test-case-meta">
            <div>开始时间: ${new Date(execution.startTime).toLocaleString('zh-CN')}</div>
            <div>耗时: ${((execution.duration || 0) / 1000).toFixed(2)} 秒</div>
            <div>步骤数: ${execution.steps?.length || 0}</div>
        </div>
        ${execution.steps && execution.steps.length > 0 ? `
        <div class="test-case-steps">
            <h4>执行步骤</h4>
            ${execution.steps.map(step => this.renderStep(step)).join('')}
        </div>
        ` : ''}
        ${execution.error ? `
        <div style="margin: 20px; padding: 10px; background: #fee2e2; border-radius: 5px; color: #991b1b;">
            <strong>错误信息:</strong> ${execution.error}
        </div>
        ` : ''}
        ${execution.logs && execution.logs.length > 0 ? `
        <div class="logs" style="margin: 20px;">
            <pre>${execution.logs.join('\n')}</pre>
        </div>
        ` : ''}
    </div>`;
  }
}
