"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestEngineModule = void 0;
const common_1 = require("@nestjs/common");
const test_engine_service_1 = require("./test-engine.service");
const data_1 = require("../data");
const ai_1 = require("../ai");
const logging_1 = require("../logging");
let TestEngineModule = class TestEngineModule {
};
exports.TestEngineModule = TestEngineModule;
exports.TestEngineModule = TestEngineModule = __decorate([
    (0, common_1.Module)({
        imports: [data_1.DataModule, ai_1.AIModule, logging_1.LoggingModule],
        providers: [test_engine_service_1.TestEngineService],
        exports: [test_engine_service_1.TestEngineService],
    })
], TestEngineModule);
//# sourceMappingURL=test-engine.module.js.map