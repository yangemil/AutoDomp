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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const interfaces_1 = require("../../common/interfaces");
const data_1 = require("../data");
let PermissionsService = class PermissionsService {
    constructor(dataService) {
        this.dataService = dataService;
    }
    async addMemberToProject(projectId, userId, username, role, permissions) {
        const project = await this.dataService.getProject(projectId);
        if (!project) {
            throw new common_1.NotFoundException('项目不存在');
        }
        if (!project.members) {
            project.members = [];
        }
        const existingMember = project.members.find((m) => m.userId === userId);
        if (existingMember) {
            existingMember.role = role;
            existingMember.permissions = permissions;
        }
        else {
            project.members.push({
                userId,
                username,
                role,
                permissions,
                joinedAt: new Date(),
            });
        }
        await this.dataService.saveProject(project);
        return project;
    }
    async removeMemberFromProject(projectId, userId) {
        const project = await this.dataService.getProject(projectId);
        if (!project) {
            throw new common_1.NotFoundException('项目不存在');
        }
        if (!project.members) {
            throw new common_1.NotFoundException('项目没有成员');
        }
        project.members = project.members.filter((m) => m.userId !== userId);
        await this.dataService.saveProject(project);
        return project;
    }
    async updateMemberPermissions(projectId, userId, permissions) {
        const project = await this.dataService.getProject(projectId);
        if (!project) {
            throw new common_1.NotFoundException('项目不存在');
        }
        if (!project.members) {
            throw new common_1.NotFoundException('项目没有成员');
        }
        const member = project.members.find((m) => m.userId === userId);
        if (!member) {
            throw new common_1.NotFoundException('成员不存在');
        }
        member.permissions = permissions;
        await this.dataService.saveProject(project);
        return project;
    }
    async checkPermission(userId, projectId, requiredPermission) {
        const project = await this.dataService.getProject(projectId);
        if (!project) {
            return false;
        }
        if (project.ownerId === userId) {
            return true;
        }
        if (!project.members) {
            return false;
        }
        const member = project.members.find((m) => m.userId === userId);
        if (!member) {
            return false;
        }
        if (member.role === interfaces_1.ProjectMemberRole.ADMIN || member.role === interfaces_1.ProjectMemberRole.OWNER) {
            return true;
        }
        return member.permissions.includes(requiredPermission);
    }
    async getUserProjects(userId, userRole) {
        const allProjects = await this.dataService.getProjects();
        if (userRole === 'admin') {
            return allProjects;
        }
        return allProjects.filter((project) => {
            if (project.ownerId === userId) {
                return true;
            }
            if (!project.members) {
                return false;
            }
            return project.members.some((m) => m.userId === userId);
        });
    }
    async getProjectMembers(projectId) {
        const project = await this.dataService.getProject(projectId);
        if (!project) {
            throw new common_1.NotFoundException('项目不存在');
        }
        return project.members || [];
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [data_1.DataService])
], PermissionsService);
//# sourceMappingURL=permissions.service.js.map