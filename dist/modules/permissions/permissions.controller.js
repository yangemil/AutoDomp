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
exports.PermissionsController = void 0;
const common_1 = require("@nestjs/common");
const permissions_service_1 = require("./permissions.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let PermissionsController = class PermissionsController {
    constructor(permissionsService) {
        this.permissionsService = permissionsService;
    }
    async addMember(projectId, body) {
        return await this.permissionsService.addMemberToProject(projectId, body.userId, body.username, body.role, body.permissions);
    }
    async removeMember(projectId, userId) {
        return await this.permissionsService.removeMemberFromProject(projectId, userId);
    }
    async updatePermissions(projectId, userId, body) {
        return await this.permissionsService.updateMemberPermissions(projectId, userId, body.permissions);
    }
    async getMembers(projectId) {
        return await this.permissionsService.getProjectMembers(projectId);
    }
    async getUserProjects(req) {
        return await this.permissionsService.getUserProjects(req.user.userId, req.user.role);
    }
};
exports.PermissionsController = PermissionsController;
__decorate([
    (0, common_1.Post)('projects/:id/members'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "addMember", null);
__decorate([
    (0, common_1.Delete)('projects/:id/members/:userId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Put)('projects/:id/members/:userId/permissions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "updatePermissions", null);
__decorate([
    (0, common_1.Get)('projects/:id/members'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Get)('user/projects'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "getUserProjects", null);
exports.PermissionsController = PermissionsController = __decorate([
    (0, common_1.Controller)('api'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [permissions_service_1.PermissionsService])
], PermissionsController);
//# sourceMappingURL=permissions.controller.js.map