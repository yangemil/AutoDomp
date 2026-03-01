import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as exphbs from 'express-handlebars';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));
  
  // 静态文件
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/',
    index: false,
  });
  app.useStaticAssets(join(process.cwd(), 'data'), {
    prefix: '/data',
  });
  
  // 配置 Handlebars 模板引擎
  const hbs = exphbs.create({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: join(__dirname, '..', 'views', 'layouts'),
    partialsDir: join(__dirname, '..', 'views', 'components'),
    helpers: {
      formatDate: function(date: any) {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleString('zh-CN');
      },
      formatDuration: function(duration: any) {
        if (!duration) return '-';
        return (duration / 1000).toFixed(2) + ' 秒';
      },
      calculatePassRate: function(total: any, passed: any) {
        if (total === 0) return '0.00';
        return ((passed / total) * 100).toFixed(2);
      },
      join: function(array: any, separator: string) {
        if (!array || !Array.isArray(array)) return '';
        return array.join(separator);
      },
      eq: function(a: any, b: any, options: any) {
        if (arguments.length === 2) {
          return a === b;
        }
        return a === b ? options.fn(this) : options.inverse(this);
      },
      ifEq: function(a: any, b: any, options: any) {
        return a === b ? options.fn(this) : options.inverse(this);
      },
      isSelected: function(a: any, b: any, options: any) {
        return a === b ? ' selected' : '';
      },
      needsSelector: function(assertion: any) {
        if (!assertion || !assertion.type) return 'none';
        const needsSelectorTypes = ['element_exists', 'element_visible', 'element_hidden', 'attribute_equals', 'element_enabled', 'element_disabled', 'text_contains', 'text_equals'];
        return needsSelectorTypes.includes(assertion.type) ? 'block' : 'none';
      },
      needsValue: function(assertion: any) {
        if (!assertion || !assertion.type) return 'none';
        const needsValueTypes = ['text_contains', 'text_equals', 'attribute_equals', 'url_contains', 'title_equals'];
        return needsValueTypes.includes(assertion.type) ? 'block' : 'none';
      },
      needsAttribute: function(assertion: any) {
        if (!assertion || !assertion.type) return 'none';
        return assertion.type === 'attribute_equals' ? 'block' : 'none';
      },
      neq: function(a: any, b: any, options: any) {
        return a !== b ? options.fn(this) : options.inverse(this);
      },
      addOne: function(num: any) {
        return parseInt(num) + 1;
      },
      filterCount: function(array: any, status: string) {
        if (!array || !Array.isArray(array)) return 0;
        return array.filter((item: any) => item.status === status).length;
      },
      uppercase: function(str: any) {
        return str ? str.toUpperCase() : '';
      },
      calcPercent: function(value: any, total: any) {
        if (!value || !total) return 0;
        return (value / total * 100).toFixed(1);
      },
    },
  });
  
  app.engine('hbs', hbs.engine);
  app.set('view engine', 'hbs');
  app.set('views', join(__dirname, '..', 'views'));
  
  app.enableCors();
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`
   ========================================================
   
      AutoDOMP Web自动化测试平台已启动！
      
      访问地址: http://localhost:${port}
      
   ========================================================
   `);
}

bootstrap();
