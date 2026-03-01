import { Permission } from '../../../common/interfaces';
export declare const PERMISSIONS_KEY = "permissions";
export interface RequirePermissionsDecorator {
    role?: string;
    resource?: string;
    permissions?: Permission[];
}
export declare function RequirePermissions(role: string): any;
export declare function RequirePermissions(resource: string, permissions: Permission[]): any;
