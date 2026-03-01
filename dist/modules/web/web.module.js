"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebModule = void 0;
const common_1 = require("@nestjs/common");
const api_controller_1 = require("./api.controller");
const view_controller_1 = require("./view.controller");
const data_1 = require("../data");
const ai_1 = require("../ai");
const test_engine_1 = require("../test-engine");
const report_1 = require("../report");
const timer_1 = require("../timer");
const auth_1 = require("../auth");
const permissions_1 = require("../permissions");
let WebModule = class WebModule {
};
exports.WebModule = WebModule;
exports.WebModule = WebModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_1.AuthModule,
            permissions_1.PermissionsModule,
            data_1.DataModule, ai_1.AIModule, test_engine_1.TestEngineModule, report_1.ReportModule, timer_1.TimerModule
        ],
        controllers: [api_controller_1.APIController, view_controller_1.ViewController],
    })
], WebModule);
//# sourceMappingURL=web.module.js.map