import { SetMetadata } from '@nestjs/common';
import { Permission } from '../../../common/interfaces';

export const PERMISSIONS_KEY = 'permissions';

export interface RequirePermissionsDecorator {
  role?: string;
  resource?: string;
  permissions?: Permission[];
}

export function RequirePermissions(role: string): any;
export function RequirePermissions(resource: string, permissions: Permission[]): any;
export function RequirePermissions(
  roleOrResource: string,
  permissions?: Permission[],
): any {
  if (permissions === undefined) {
    return SetMetadata(PERMISSIONS_KEY, { role: roleOrResource });
  }
  return SetMetadata(PERMISSIONS_KEY, { resource: roleOrResource, permissions });
}
