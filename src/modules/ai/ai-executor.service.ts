import { Injectable } from '@nestjs/common';
import { DataService } from '../data';
import { AIConfig } from '../../common/interfaces';
import { chromium, Browser, Page } from 'playwright';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface ExecutionStep {
  action: string;
  description: string;
  selector?: string;
  value?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  screenshot?: string;
  error?: string;
}

export interface ExecutionResult {
  success: boolean;
  steps: ExecutionStep[];
  summary: string;
  error?: string;
}

@Injectable()
export class AIExecutorService {
  private browser: Browser | null = null;

  constructor(private readonly dataService: DataService) {}

  private getActiveAIConfig(config: any): AIConfig | null {
    if (!config.aiConfigs || config.aiConfigs.length === 0) {
      if (config.ai) {
        return { ...config.ai, id: 'legacy', name: '旧配置' };
      }
      return null;
    }
    const activeId = config.activeAiConfigId;
    if (!activeId) return null;
    return config.aiConfigs.find((ai: AIConfig) => ai.id === activeId) || null;
  }

  private log(msg: string) {
    console.log('[AIExecutor] ' + msg);
  }

  private errorLog(msg: string) {
    console.error('[AIExecutor] ' + msg);
  }

  async initializeBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: false,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--start-fullscreen'
        ]
      });
    }
    return this.browser;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async executeInstruction(instruction: string): Promise<ExecutionResult> {
    const steps: ExecutionStep[] = [];
    
    try {
      const config = await this.dataService.getSystemConfig();
      const aiConfig = this.getActiveAIConfig(config);
      if (!aiConfig || !aiConfig.enabled || !aiConfig.apiKey) {
        throw new Error('AI服务未启用');
      }

      this.log('开始解析指令...');
      
      const parsedSteps = await this.parseInstructionToSteps(instruction, aiConfig);
      this.log('解析完成，获得 ' + parsedSteps.length + ' 个步骤');
      steps.push(...parsedSteps);

      if (steps.length === 0) {
        throw new Error('未能解析出任何测试步骤');
      }

      this.log('正在启动浏览器...');
      const browser = await this.initializeBrowser();
      this.log('浏览器启动成功');

      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1
      });
      const page = await context.newPage();
      
      // 最大化窗口
      try {
        await page.evaluate(() => {
          if (window.screen) {
            window.moveTo(0, 0);
            window.resizeTo(window.screen.width, window.screen.height);
          }
        });
      } catch (e) {
        // 忽略错误
      }

      for (const step of steps) {
        step.status = 'running';
        this.log('执行步骤: ' + step.action + ' - ' + step.description);
        try {
          await this.executeStep(page, step);
          step.status = 'completed';
          this.log('步骤执行成功: ' + step.action);
        } catch (error: any) {
          step.status = 'failed';
          step.error = error.message;
          this.log('步骤执行失败: ' + error.message);
        }
      }

      const completedCount = steps.filter(s => s.status === 'completed').length;
      const summary = '执行完成：' + completedCount + '/' + steps.length + ' 个步骤成功';

      await context.close();
      
      return { success: completedCount > 0, steps, summary };
    } catch (error: any) {
      this.errorLog('执行失败: ' + error.message);
      return { 
        success: false, 
        steps, 
        summary: '执行失败: ' + error.message,
        error: error.message 
      };
    }
  }

  private async parseInstructionToSteps(instruction: string, aiConfig: AIConfig): Promise<ExecutionStep[]> {
    const prompt = `Break down this task into test steps. Supported actions: navigate, click, fill, select, wait. Return ONLY JSON array.

Task: ${instruction}

Example output: [{"action":"navigate","value":"https://example.com","description":"visit page"},{"action":"click","selector":"button#submit","description":"click submit button"},{"action":"fill","selector":"#username","value":"admin","description":"input username"}]`;

    try {
      this.log('Calling AI...');
      
      const response = await axios.post(
        aiConfig.apiUrl + '/chat/completions',
        {
          model: aiConfig.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0,
          max_tokens: 1000
        },
        {
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': 'Bearer ' + aiConfig.apiKey 
          },
          timeout: 60000
        }
      );

      let content = response.data.choices?.[0]?.message?.content || '';
      this.log('Raw: ' + content.substring(0, 500));

      // 移除think标签和内容 - 多行匹配
      content = content.replace(/[\s\S]*?<\/think>/gis, '');
      // 移除其他标签
      content = content.replace(/```[a-z]*/gi, '').replace(/```/gi, '').trim();
      this.log('After cleanup: ' + content.substring(0, 300));

      // 尝试提取JSON数组
      let steps = null;
      
      const match = content.match(/\[[\s\S]*?\]/);
      if (match) {
        try {
          steps = JSON.parse(match[0]);
        } catch {}
      }
      
      if (!steps) {
        try {
          steps = JSON.parse(content);
        } catch {}
      }
      
      if (!steps || !Array.isArray(steps)) {
        throw new Error('Could not parse JSON from response');
      }
      
      // 映射input到fill
      steps = steps.map((s: any) => {
        if (s.action === 'input') {
          s.action = 'fill';
        }
        return s;
      });
      
      this.log('Parsed steps: ' + steps.length);
      return steps.map((s: any) => ({ ...s, status: 'pending' as const }));
    } catch (error: any) {
      this.errorLog('Failed: ' + error.message);
      throw new Error('AI parse failed: ' + error.message);
    }
  }

  private async executeStep(page: Page, step: ExecutionStep): Promise<void> {
    const selector = step.selector || '';
    const description = step.description || '';
    
    async function tryLocator(locatorFn: () => Promise<any>): Promise<boolean> {
      try {
        await locatorFn();
        return true;
      } catch {
        return false;
      }
    }

    switch (step.action.toLowerCase()) {
      case 'navigate':
        await page.goto(step.value, { waitUntil: 'networkidle', timeout: 10000 });
        await this.takeScreenshot(page, step);
        break;
        
      case 'click': {
        let clicked = false;
        
        // 1. 尝试CSS选择器
        if (selector && await tryLocator(() => page.click(selector, { timeout: 10000 }))) {
          clicked = true;
        }
        
        // 2. 尝试文本选择器 - 从description中提取
        if (!clicked && description) {
          const textMatches = description.match(/["']([^"']+)["']/);
          if (textMatches) {
            if (await tryLocator(() => page.getByText(textMatches[1], { exact: false }).first().click({ timeout: 10000 }))) {
              clicked = true;
            }
          }
          // 尝试点击任何包含关键词的按钮
          if (!clicked) {
            const keywords = ['登录', '添加', '确定', '提交', '保存', '取消', '展开', '点击'];
            for (const kw of keywords) {
              if (description.includes(kw)) {
                if (await tryLocator(() => page.getByRole('button', { name: new RegExp(kw) }).click({ timeout: 10000 }))) {
                  clicked = true;
                  break;
                }
              }
            }
          }
        }
        
        // 3. 尝试点击第一个按钮
        if (!clicked) {
          if (await tryLocator(() => page.locator('button').first().click({ timeout: 10000 }))) {
            clicked = true;
          }
        }
        
        if (!clicked) {
          throw new Error('找不到可点击的元素: ' + description);
        }
        
        await this.takeScreenshot(page, step);
        break;
      }
        
      case 'fill': {
        let filled = false;
        
        if (selector && await tryLocator(() => page.fill(selector, step.value, { timeout: 10000 }))) {
          filled = true;
        }
        
        if (!filled && description) {
          // 尝试按placeholder
          const placeholderMatch = description.match(/(?:在|输入)[^叫到]+叫?["']([^"']+)["']/);
          if (placeholderMatch) {
            if (await tryLocator(() => page.getByPlaceholder(placeholderMatch[1], { exact: false }).fill(step.value, { timeout: 10000 }))) {
              filled = true;
            }
          }
          // 尝试第一个输入框
          if (!filled) {
            if (await tryLocator(() => page.locator('input[type="text"], input:not([type]), textarea').first().fill(step.value, { timeout: 10000 }))) {
              filled = true;
            }
          }
        }
        
        if (!filled) {
          throw new Error('找不到可输入的字段: ' + description);
        }
        
        await this.takeScreenshot(page, step);
        break;
      }
        
      case 'select':
        if (selector) {
          await page.selectOption(selector, step.value, { timeout: 10000 });
        }
        await this.takeScreenshot(page, step);
        break;
        
      case 'wait':
        await page.waitForTimeout(parseInt(step.value) || 1000);
        break;
        
      case 'hover':
        if (selector) {
          await page.hover(selector);
        }
        await this.takeScreenshot(page, step);
        break;
        
      default:
        this.log('未知动作: ' + step.action);
    }
    
    step.result = '执行成功: ' + step.description;
  }

  private async takeScreenshot(page: Page, step: ExecutionStep): Promise<void> {
    try {
      const screenshotDir = path.join(process.cwd(), 'data', 'ai-screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }

      const filename = 'step_' + Date.now() + '.png';
      const filepath = path.join(screenshotDir, filename);
      
      await page.screenshot({ path: filepath, fullPage: true });
      step.screenshot = filename;
    } catch (error: any) {
      this.log('截图失败: ' + error.message);
    }
  }
}
