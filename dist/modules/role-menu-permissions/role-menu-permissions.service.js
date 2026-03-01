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
exports.RoleMenuPermissionsService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
let RoleMenuPermissionsService = class RoleMenuPermissionsService {
    constructor() {
        this.configFilePath = path.join(process.cwd(), 'data/role-menu-permissions.json');
        this.config = {};
        this.loadConfig();
    }
    loadConfig() {
        try {
            if (fs.existsSync(this.configFilePath)) {
                const content = fs.readFileSync(this.configFilePath, 'utf-8');
                this.config = JSON.parse(content);
            }
        }
        catch (error) {
            console.error('加载角色菜单权限配置失败:', error);
            this.config = {};
        }
    }
    saveConfig() {
        try {
            const dataDir = path.join(process.cwd(), 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(this.configFilePath, JSON.stringify(this.config, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('保存角色菜单权限配置失败:', error);
            throw error;
        }
    }
    getAllRolePermissions() {
        return this.config;
    }
    getRolePermissions(roleId) {
        return this.config[roleId] || null;
    }
    updateRolePermissions(roleId, permissions) {
        this.config[roleId] = permissions;
        this.saveConfig();
        return permissions;
    }
    hasMenuPermission(roleId, menuId) {
        const rolePermissions = this.config[roleId];
        if (!rolePermissions) {
            return false;
        }
        return this.checkMenuPermission(rolePermissions.menus, menuId);
    }
    checkMenuPermission(menus, menuId) {
        for (const menu of menus) {
            if (menu.id === menuId) {
                return true;
            }
            if (menu.items && this.checkMenuPermission(menu.items, menuId)) {
                return true;
            }
        }
        return false;
    }
};
exports.RoleMenuPermissionsService = RoleMenuPermissionsService;
exports.RoleMenuPermissionsService = RoleMenuPermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RoleMenuPermissionsService);
//# sourceMappingURL=role-menu-permissions.service.js.map