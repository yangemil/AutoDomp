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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMenuPermissionsController = exports.RoleMenuPermissionsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const role_menu_permissions_service_1 = require("./role-menu-permissions.service");
let RoleMenuPermissionsController = class RoleMenuPermissionsController {
    constructor(roleMenuPermissionsService) {
        this.roleMenuPermissionsService = roleMenuPermissionsService;
    }
    getAllRolePermissions() {
        return this.roleMenuPermissionsService.getAllRolePermissions();
    }
    getRolePermissions(roleId) {
        const permissions = this.roleMenuPermissionsService.getRolePermissions(roleId);
        if (!permissions) {
            throw new common_1.NotFoundException('角色不存在');
        }
        return permissions;
    }
    updateRolePermissions(roleId, body) {
        return this.roleMenuPermissionsService.updateRolePermissions(roleId, body);
    }
};
exports.RoleMenuPermissionsController = RoleMenuPermissionsController;
__decorate([
    (0, permissions_decorator_1.RequirePermissions)('admin'),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RoleMenuPermissionsController.prototype, "getAllRolePermissions", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)('admin'),
    (0, common_1.Get)(':roleId'),
    __param(0, (0, common_1.Param)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RoleMenuPermissionsController.prototype, "getRolePermissions", null);
__decorate([
    (0, permissions_decorator_1.RequirePermissions)('admin'),
    (0, common_1.Put)(':roleId'),
    __param(0, (0, common_1.Param)('roleId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RoleMenuPermissionsController.prototype, "updateRolePermissions", null);
exports.RoleMenuPermissionsController = RoleMenuPermissionsController = __decorate([
    (0, common_1.Controller)('api/role-menu-permissions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [role_menu_permissions_service_1.RoleMenuPermissionsService])
], RoleMenuPermissionsController);
let UserMenuPermissionsController = class UserMenuPermissionsController {
    constructor(roleMenuPermissionsService) {
        this.roleMenuPermissionsService = roleMenuPermissionsService;
    }
    getUserMenuPermissions(req) {
        const roleId = req.user.role;
        return this.roleMenuPermissionsService.getRolePermissions(roleId);
    }
};
exports.UserMenuPermissionsController = UserMenuPermissionsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserMenuPermissionsController.prototype, "getUserMenuPermissions", null);
exports.UserMenuPermissionsController = UserMenuPermissionsController = __decorate([
    (0, common_1.Controller)('api/user/menu-permissions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [role_menu_permissions_service_1.RoleMenuPermissionsService])
], UserMenuPermissionsController);
//# sourceMappingURL=role-menu-permissions.controller.js.map