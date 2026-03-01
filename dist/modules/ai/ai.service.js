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
var AIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const common_1 = require("@nestjs/common");
const data_1 = require("../data");
const uuid_1 = require("uuid");
const axios_1 = require("axios");
let AIService = AIService_1 = class AIService {
    constructor(dataService) {
        this.dataService = dataService;
        this.logger = new common_1.Logger(AIService_1.name);
    }
    async generateTestCase(description, baseUrl) {
        const config = await this.dataService.getSystemConfig();
        if (!config.ai.enabled || !config.ai.apiKey) {
            throw new Error('AI服务未启用或API密钥未配置');
        }
        const prompt = this.buildPrompt(description, baseUrl);
        const aiResponse = await this.callAI(prompt, config.ai);
        return this.parseAIToTestCase(aiResponse, description);
    }
    async generateTestData(fields) {
        const config = await this.dataService.getSystemConfig();
        if (!config.ai.enabled || !config.ai.apiKey) {
            throw new Error('AI服务未启用或API密钥未配置');
        }
        const prompt = `请为以下字段生成测试数据：
字段列表：${fields.join(', ')}

要求：
1. 生成正常值、边界值、异常值等多种测试数据
2. 以JSON格式返回
3. 格式：{"字段名": {"valid": "正常值", "invalid": ["异常值1", "异常值2"]}}

只返回JSON数据，不要其他说明。`;
        const response = await this.callAI(prompt, config.ai);
        try {
            return JSON.parse(response);
        }
        catch (error) {
            this.logger.error('解析测试数据失败:', error);
            return {};
        }
    }
    buildPrompt(description, baseUrl) {
        const urlHint = baseUrl ? `\n基础URL: ${baseUrl}（使用相对路径）` : '';
        return `你是一个Web自动化测试专家。请根据以下描述生成测试用例：

用户描述：
${description}${urlHint}

请生成完整的测试用例，包含：
1. 测试名称
2. 测试描述
3. URL（使用相对路径，如 /login）
4. 测试步骤（每个步骤包括：动作类型、选择器、值、描述）
   - 动作类型包括：navigate(导航)、click(点击)、fill(填充)、select(选择)、wait(等待)、screenshot(截图)、verify(验证)
   - 选择器使用CSS选择器或文本选择器
5. 预期结果
6. 测试标签

以JSON格式返回，格式如下：
{
  "name": "测试用例名称",
  "description": "测试用例描述",
  "url": "/path",
  "steps": [
    {
      "action": "navigate",
      "value": "/login",
      "description": "访问登录页面",
      "screenshot": false
    },
    {
      "action": "fill",
      "selector": "input[name='username']",
      "value": "testuser",
      "description": "填写用户名",
      "screenshot": false
    }
  ],
  "expectedResults": ["预期结果1", "预期结果2"],
  "tags": ["标签1", "标签2"]
}

只返回JSON数据，不要其他说明。`;
    }
    async callAI(prompt, aiConfig) {
        try {
            const response = await axios_1.default.post(`${aiConfig.apiUrl}/chat/completions`, {
                model: aiConfig.model,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的Web自动化测试工程师，擅长编写测试用例和测试数据。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: aiConfig.temperature || 0.7,
                max_tokens: aiConfig.maxTokens || 2000
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${aiConfig.apiKey}`
                },
                timeout: 60000
            });
            return response.data.choices[0].message.content.trim();
        }
        catch (error) {
            this.logger.error('调用AI服务失败:', error.message);
            throw new Error(`AI服务调用失败: ${error.message}`);
        }
    }
    parseAIToTestCase(aiResponse, originalDescription) {
        let parsedData;
        try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsedData = JSON.parse(jsonMatch[0]);
            }
            else {
                throw new Error('未找到有效的JSON数据');
            }
        }
        catch (error) {
            this.logger.error('解析AI响应失败:', error);
            throw new Error('AI响应格式错误，无法解析为测试用例');
        }
        const testCase = {
            id: (0, uuid_1.v4)(),
            projectId: '',
            name: parsedData.name || '未命名测试用例',
            description: parsedData.description || originalDescription,
            url: parsedData.url || '',
            useRelativeUrl: true,
            steps: (parsedData.steps || []).map((step, index) => ({
                id: (0, uuid_1.v4)(),
                order: index + 1,
                action: step.action || 'navigate',
                selector: step.selector,
                value: step.value,
                description: step.description || '',
                screenshot: step.screenshot || false,
                waitTime: step.waitTime
            })),
            expectedResults: parsedData.expectedResults || [],
            testData: {},
            tags: parsedData.tags || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        return testCase;
    }
    async testConnection(aiConfig) {
        if (!aiConfig.apiKey) {
            return { success: false, message: 'API密钥未配置' };
        }
        try {
            await this.callAI('你好，这是一个测试连接。', aiConfig);
            return { success: true, message: 'AI服务连接成功' };
        }
        catch (error) {
            return { success: false, message: error.message };
        }
    }
    async generateSelector(description, pageHtml) {
        const config = await this.dataService.getSystemConfig();
        if (!config.ai.enabled || !config.ai.apiKey) {
            throw new Error('AI服务未启用或API密钥未配置');
        }
        const prompt = `你是一个Web自动化测试专家。根据用户描述的元素，找出最佳的CSS选择器或Playwright选择器。

用户描述: ${description}

要求:
1. 返回简洁、稳定的CSS选择器或Playwright选择器
2. 优先使用class、id、文本等稳定属性
3. 避免使用动态生成的ID
4. 如果是按钮或链接，优先使用text=选择器
5. 直接返回选择器字符串，不要其他解释

示例:
- 用户说"点击提交按钮" -> 返回 "text=提交" 或 "button:has-text('提交')"
- 用户说"点击登录输入框" -> 返回 "input[name='username']" 或 "#username"
- 用户说"点击商品分类下拉框" -> 返回 ".el-cascader" 或 "[placeholder='请选择']"

直接返回选择器:`;
        const aiResponse = await this.callAI(prompt, config.ai);
        return aiResponse.trim();
    }
    async optimizeSelector(elementInfo) {
        const config = await this.dataService.getSystemConfig();
        if (!config.ai.enabled || !config.ai.apiKey) {
            throw new Error('AI服务未启用或API密钥未配置');
        }
        const prompt = `你是一个Web自动化测试专家，擅长生成稳定可靠的CSS选择器。

元素信息:
- 标签: ${elementInfo.tag}
- ID: ${elementInfo.id || '(无)'}
- Name: ${elementInfo.name || '(无)'}
- Class: ${elementInfo.className || '(无)'}
- Placeholder: ${elementInfo.placeholder || '(无)'}
- Type: ${elementInfo.type || '(无)'}
- 元素文本: ${elementInfo.text || '(无)'}
- 用户描述: ${elementInfo.description || '(无)'}

请根据以下规则生成最稳定的CSS选择器:

1. 优先级: id > name > data-* > 其他属性 > class组合
2. 如果有id，直接使用 #id 选择器
3. 如果有name，使用 [name="xxx"] 选择器
4. 优先使用单一稳定属性，避免使用nth-child
5. 避免使用动态生成的class
6. 如果是按钮或链接，可以考虑使用文本选择器

直接返回JSON格式，不要其他内容:
{
  "selector": "最稳定的选择器",
  "reason": "选择这个选择器的理由（20字以内）",
  "stability": 1-5的评级数字
}`;
        const aiResponse = await this.callAI(prompt, config.ai);
        try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        }
        catch (error) {
            this.logger.error('解析AI响应失败:', error);
        }
        return {
            selector: elementInfo.id ? `#${elementInfo.id}` : elementInfo.name ? `[name="${elementInfo.name}"]` : elementInfo.tag,
            reason: '基于元素属性推断',
            stability: 3
        };
    }
};
exports.AIService = AIService;
exports.AIService = AIService = AIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [data_1.DataService])
], AIService);
//# sourceMappingURL=ai.service.js.map