import { Injectable, Logger } from '@nestjs/common';

export interface HtmlFormField {
  name: string;
  type: 'input' | 'select' | 'textarea';
  selector: string;
  id?: string;
  nameAttr?: string;
  placeholder?: string;
  options?: string[];
}

export interface ParsedStep {
  action: 'fill' | 'select' | 'click' | 'wait' | 'navigate';
  fieldName?: string;
  value?: string;
  selector?: string;
  description: string;
}

@Injectable()
export class HtmlParserService {
  private readonly logger = new Logger(HtmlParserService.name);

  parseHtml(html: string): HtmlFormField[] {
    const fields: HtmlFormField[] = [];
    
    const labelMap = new Map<string, string>();
    const labelRegex = /<label[^>]*for=["']([^"']+)["'][^>]*>([^<]*)<\/label>/gi;
    let match;
    while ((match = labelRegex.exec(html)) !== null) {
      labelMap.set(match[1], match[2].trim());
    }
    
    const cleanHtml = html.replace(/<!---->/g, '');
    
    // 使用form-item作为基本单元解析
    const formItemPattern = /<div[^>]*class="[^"]*el-form-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
    let fieldIndex = 0;
    
    while ((match = formItemPattern.exec(cleanHtml)) !== null) {
      const itemContent = match[1];
      fieldIndex++;
      
      const labelMatch = /<label[^>]*>([^<]*)<\/label>/i.exec(itemContent);
      const labelText = labelMatch ? labelMatch[1].trim() : '';
      
      const labelForMatch = /<label[^>]*for=["']([^"']+)["'][^>]*>/i.exec(itemContent);
      const labelFor = labelForMatch ? labelForMatch[1] : '';
      
      // 使用:nth-of-type来区分同类型的多个输入框
      const inputMatch = /<input([^>]*)>/i.exec(itemContent);
      if (inputMatch) {
        const attrs = this.parseAttributes('<input' + inputMatch[1] + '>');
        if (attrs.type === 'hidden' || attrs.type === 'submit' || attrs.type === 'button') {
          continue;
        }
        
        let fieldName = labelText || labelMap.get(attrs.id) || attrs.name || attrs.placeholder || '未知字段';
        
        // 生成更精确的选择器
        let selector = this.generateSelectorFromAttrs(attrs);
        if (!attrs.id && !attrs.name && !attrs.placeholder) {
          selector = `input:nth-of-type(${fieldIndex})`;
        }
        
        fields.push({
          name: fieldName,
          type: 'input',
          selector,
          id: attrs.id,
          nameAttr: attrs.name,
          placeholder: attrs.placeholder
        });
        continue;
      }
      
      // 查找select
      const selectMatch = /<select([^>]*)>([\s\S]*?)<\/select>/i.exec(itemContent);
      if (selectMatch) {
        const attrs = this.parseAttributes('<select' + selectMatch[1] + '>');
        const options = this.extractOptions(selectMatch[2]);
        
        let fieldName = labelText || labelMap.get(attrs.id) || attrs.name || '未知选择';
        
        let selector = this.generateSelectorFromAttrs(attrs);
        if (!attrs.id && !attrs.name) {
          selector = `select:nth-of-type(${fieldIndex})`;
        }
        
        fields.push({
          name: fieldName,
          type: 'select',
          selector,
          id: attrs.id,
          nameAttr: attrs.name,
          options
        });
        continue;
      }
    }
    
    if (fields.length === 0) {
      const inputRegex = /<input[^>]*>/gi;
      let idx = 0;
      while ((match = inputRegex.exec(cleanHtml)) !== null) {
        idx++;
        const attrs = this.parseAttributes(match[0]);
        if (attrs.type === 'hidden' || attrs.type === 'submit' || attrs.type === 'button') {
          continue;
        }
        const fieldName = attrs.name || attrs.placeholder || '未知字段';
        fields.push({
          name: fieldName,
          type: 'input',
          selector: this.generateSelectorFromAttrs(attrs),
          id: attrs.id,
          nameAttr: attrs.name,
          placeholder: attrs.placeholder
        });
      }
      
      const selectRegex = /<select[^>]*>([\s\S]*?)<\/select>/gi;
      while ((match = selectRegex.exec(cleanHtml)) !== null) {
        const openTag = match[0].replace(/<\/select>[\s\S]*/, '');
        const attrs = this.parseAttributes(openTag);
        const options = this.extractOptions(match[1]);
        fields.push({
          name: attrs.name || '未知选择',
          type: 'select',
          selector: this.generateSelectorFromAttrs(attrs),
          id: attrs.id,
          nameAttr: attrs.name,
          options
        });
      }
    }
    
    return fields;
  }

  parseSteps(steps: string[], fields: HtmlFormField[]): ParsedStep[] {
    return steps.map((step, index) => this.parseSingleStep(step, fields, index + 1));
  }

  private parseSingleStep(step: string, fields: HtmlFormField[], order: number): ParsedStep {
    const trimmedStep = step.trim();
    
    const fillMatch = trimmedStep.match(/向(.+?)填写(.+)/) || trimmedStep.match(/向(.+?)输入(.+)/);
    if (fillMatch) {
      const fieldName = fillMatch[1].trim();
      const value = fillMatch[2].trim();
      const field = this.findField(fieldName, fields);
      return {
        action: 'fill',
        fieldName,
        value,
        selector: field?.selector,
        description: `填写${fieldName}`
      };
    }
    
    const selectMatch = trimmedStep.match(/^(.+?)选择(.+)/);
    if (selectMatch) {
      const fieldName = selectMatch[1].trim();
      const value = selectMatch[2].trim();
      const field = this.findField(fieldName, fields);
      return {
        action: 'select',
        fieldName,
        value,
        selector: field?.selector,
        description: `${fieldName}选择${value}`
      };
    }
    
    const clickMatch = trimmedStep.match(/点击(.+?)(按钮|链接)?$/);
    if (clickMatch) {
      const buttonName = clickMatch[1].trim();
      return {
        action: 'click',
        fieldName: buttonName,
        selector: this.findButtonSelector(buttonName),
        description: `点击${buttonName}`
      };
    }
    
    const waitMatch = trimmedStep.match(/等待(\d+)秒/);
    if (waitMatch) {
      const seconds = parseInt(waitMatch[1], 10);
      return {
        action: 'wait',
        value: String(seconds * 1000),
        description: `等待${waitMatch[1]}秒`
      };
    }
    
    return {
      action: 'navigate',
      description: trimmedStep
    };
  }

  private findField(name: string, fields: HtmlFormField[]): HtmlFormField | undefined {
    const lowerName = name.toLowerCase();
    return fields.find(f => 
      f.name.toLowerCase().includes(lowerName) || 
      lowerName.includes(f.name.toLowerCase())
    );
  }

  private findButtonSelector(buttonName: string): string {
    const lowerName = buttonName.toLowerCase();
    if (lowerName.includes('确定') || lowerName.includes('确认') || lowerName.includes('ok')) {
      return 'button:has-text("确定"), button:has-text("确认"), .el-button--primary';
    }
    if (lowerName.includes('取消')) {
      return 'button:has-text("取消")';
    }
    if (lowerName.includes('提交')) {
      return 'button:has-text("提交"), input[type="submit"]';
    }
    return `button:has-text("${buttonName}")`;
  }

  private parseAttributes(tag: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const attrRegex = /([a-zA-Z-]+)=["']([^"']*)["']/g;
    let match;
    while ((match = attrRegex.exec(tag)) !== null) {
      attrs[match[1]] = match[2];
    }
    return attrs;
  }

  private generateSelectorFromAttrs(attrs: Record<string, string>): string {
    if (attrs.id) return `#${attrs.id}`;
    if (attrs.name) return `[name="${attrs.name}"]`;
    if (attrs.placeholder) return `[placeholder="${attrs.placeholder}"]`;
    if (attrs.class && !attrs.class.includes('el-')) {
      return `.${attrs.class.split(' ').join('.')}`;
    }
    return 'input';
  }

  private extractOptions(optionsHtml: string): string[] {
    const options: string[] = [];
    const optionRegex = /<option[^>]*>([^<]*)<\/option>/gi;
    let match;
    while ((match = optionRegex.exec(optionsHtml)) !== null) {
      const text = match[1].replace(/<[^>]*>/g, '').trim();
      if (text) options.push(text);
    }
    return options;
  }
}
