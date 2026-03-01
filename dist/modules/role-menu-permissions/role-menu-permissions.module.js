"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleMenuPermissionsModule = void 0;
const common_1 = require("@nestjs/common");
const role_menu_permissions_controller_1 = require("./role-menu-permissions.controller");
const role_menu_permissions_service_1 = require("./role-menu-permissions.service");
let RoleMenuPermissionsModule = class RoleMenuPermissionsModule {
};
exports.RoleMenuPermissionsModule = RoleMenuPermissionsModule;
exports.RoleMenuPermissionsModule = RoleMenuPermissionsModule = __decorate([
    (0, common_1.Module)({
        controllers: [role_menu_permissions_controller_1.RoleMenuPermissionsController, role_menu_permissions_controller_1.UserMenuPermissionsController],
        providers: [role_menu_permissions_service_1.RoleMenuPermissionsService],
        exports: [role_menu_permissions_service_1.RoleMenuPermissionsService],
    })
], RoleMenuPermissionsModule);
//# sourceMappingURL=role-menu-permissions.module.js.map