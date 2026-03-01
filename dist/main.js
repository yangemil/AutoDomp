"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const exphbs = require("express-handlebars");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
    }));
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'public'), {
        prefix: '/',
        index: false,
    });
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'data'), {
        prefix: '/data',
    });
    const hbs = exphbs.create({
        extname: '.hbs',
        defaultLayout: 'main',
        layoutsDir: (0, path_1.join)(__dirname, '..', 'views', 'layouts'),
        partialsDir: (0, path_1.join)(__dirname, '..', 'views', 'components'),
        helpers: {
            formatDate: function (date) {
                if (!date)
                    return '-';
                const d = new Date(date);
                return d.toLocaleString('zh-CN');
            },
            formatDuration: function (duration) {
                if (!duration)
                    return '-';
                return (duration / 1000).toFixed(2) + ' 秒';
            },
            calculatePassRate: function (total, passed) {
                if (total === 0)
                    return '0.00';
                return ((passed / total) * 100).toFixed(2);
            },
            join: function (array, separator) {
                if (!array || !Array.isArray(array))
                    return '';
                return array.join(separator);
            },
            eq: function (a, b, options) {
                if (arguments.length === 2) {
                    return a === b;
                }
                return a === b ? options.fn(this) : options.inverse(this);
            },
            ifEq: function (a, b, options) {
                return a === b ? options.fn(this) : options.inverse(this);
            },
            isSelected: function (a, b, options) {
                return a === b ? ' selected' : '';
            },
            needsSelector: function (assertion) {
                if (!assertion || !assertion.type)
                    return 'none';
                const needsSelectorTypes = ['element_exists', 'element_visible', 'element_hidden', 'attribute_equals', 'element_enabled', 'element_disabled', 'text_contains', 'text_equals'];
                return needsSelectorTypes.includes(assertion.type) ? 'block' : 'none';
            },
            needsValue: function (assertion) {
                if (!assertion || !assertion.type)
                    return 'none';
                const needsValueTypes = ['text_contains', 'text_equals', 'attribute_equals', 'url_contains', 'title_equals'];
                return needsValueTypes.includes(assertion.type) ? 'block' : 'none';
            },
            needsAttribute: function (assertion) {
                if (!assertion || !assertion.type)
                    return 'none';
                return assertion.type === 'attribute_equals' ? 'block' : 'none';
            },
            neq: function (a, b, options) {
                return a !== b ? options.fn(this) : options.inverse(this);
            },
            addOne: function (num) {
                return parseInt(num) + 1;
            },
            filterCount: function (array, status) {
                if (!array || !Array.isArray(array))
                    return 0;
                return array.filter((item) => item.status === status).length;
            },
            uppercase: function (str) {
                return str ? str.toUpperCase() : '';
            },
            calcPercent: function (value, total) {
                if (!value || !total)
                    return 0;
                return (value / total * 100).toFixed(1);
            },
        },
    });
    app.engine('hbs', hbs.engine);
    app.set('view engine', 'hbs');
    app.set('views', (0, path_1.join)(__dirname, '..', 'views'));
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
//# sourceMappingURL=main.js.map