import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface MenuItem {
  id: string;
  name: string;
  path?: string;
  items?: MenuItem[];
}

export interface RoleMenuPermissions {
  name: string;
  description: string;
  menus: MenuItem[];
}

export interface RoleMenuPermissionsConfig {
  [roleId: string]: RoleMenuPermissions;
}

@Injectable()
export class RoleMenuPermissionsService {
  private configFilePath = path.join(process.cwd(), 'data/role-menu-permissions.json');
  private config: RoleMenuPermissionsConfig = {};

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    try {
      if (fs.existsSync(this.configFilePath)) {
        const content = fs.readFileSync(this.configFilePath, 'utf-8');
        this.config = JSON.parse(content);
      }
    } catch (error) {
      console.error('加载角色菜单权限配置失败:', error);
      this.config = {};
    }
  }

  private saveConfig() {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(this.configFilePath, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存角色菜单权限配置失败:', error);
      throw error;
    }
  }

  getAllRolePermissions(): RoleMenuPermissionsConfig {
    return this.config;
  }

  getRolePermissions(roleId: string): RoleMenuPermissions | null {
    return this.config[roleId] || null;
  }

  updateRolePermissions(roleId: string, permissions: RoleMenuPermissions): RoleMenuPermissions {
    this.config[roleId] = permissions;
    this.saveConfig();
    return permissions;
  }

  hasMenuPermission(roleId: string, menuId: string): boolean {
    const rolePermissions = this.config[roleId];
    if (!rolePermissions) {
      return false;
    }

    return this.checkMenuPermission(rolePermissions.menus, menuId);
  }

  private checkMenuPermission(menus: MenuItem[], menuId: string): boolean {
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
}
