"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimerModule = void 0;
const common_1 = require("@nestjs/common");
const data_1 = require("../data");
const timer_service_1 = require("./timer.service");
const test_engine_1 = require("../test-engine");
const notification_1 = require("../notification");
const report_1 = require("../report");
let TimerModule = class TimerModule {
};
exports.TimerModule = TimerModule;
exports.TimerModule = TimerModule = __decorate([
    (0, common_1.Module)({
        imports: [data_1.DataModule, test_engine_1.TestEngineModule, notification_1.NotificationModule, report_1.ReportModule],
        providers: [timer_service_1.TimerService],
        exports: [timer_service_1.TimerService],
    })
], TimerModule);
//# sourceMappingURL=timer.module.js.map