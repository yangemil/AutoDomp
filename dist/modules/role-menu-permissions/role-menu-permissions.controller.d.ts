import { Request } from 'express';
interface AuthenticatedRequest extends Request {
    user: {
        role: string;
    };
}
import { RoleMenuPermissionsService, RoleMenuPermissions, RoleMenuPermissionsConfig } from './role-menu-permissions.service';
export declare class RoleMenuPermissionsController {
    private readonly roleMenuPermissionsService;
    constructor(roleMenuPermissionsService: RoleMenuPermissionsService);
    getAllRolePermissions(): RoleMenuPermissionsConfig;
    getRolePermissions(roleId: string): RoleMenuPermissions;
    updateRolePermissions(roleId: string, body: {
        name: string;
        description: string;
        menus: any[];
    }): RoleMenuPermissions;
}
export declare class UserMenuPermissionsController {
    private readonly roleMenuPermissionsService;
    constructor(roleMenuPermissionsService: RoleMenuPermissionsService);
    getUserMenuPermissions(req: AuthenticatedRequest): RoleMenuPermissions;
}
export {};
