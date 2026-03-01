"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const web_1 = require("./modules/web");
const data_1 = require("./modules/data");
const ai_1 = require("./modules/ai");
const test_engine_1 = require("./modules/test-engine");
const report_1 = require("./modules/report");
const notification_1 = require("./modules/notification");
const timer_1 = require("./modules/timer");
const logging_1 = require("./modules/logging");
const role_menu_permissions_1 = require("./modules/role-menu-permissions");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'public'),
                serveRoot: '/',
                serveStaticOptions: {
                    index: false,
                },
            }),
            data_1.DataModule,
            ai_1.AIModule,
            test_engine_1.TestEngineModule,
            report_1.ReportModule,
            notification_1.NotificationModule,
            timer_1.TimerModule,
            logging_1.LoggingModule,
            web_1.WebModule,
            role_menu_permissions_1.RoleMenuPermissionsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map