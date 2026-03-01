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
export declare class RoleMenuPermissionsService {
    private configFilePath;
    private config;
    constructor();
    private loadConfig;
    private saveConfig;
    getAllRolePermissions(): RoleMenuPermissionsConfig;
    getRolePermissions(roleId: string): RoleMenuPermissions | null;
    updateRolePermissions(roleId: string, permissions: RoleMenuPermissions): RoleMenuPermissions;
    hasMenuPermission(roleId: string, menuId: string): boolean;
    private checkMenuPermission;
}
