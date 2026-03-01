import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, RequirePermissionsDecorator } from '../decorators/permissions.decorator';
import { Permission } from '../../../common/interfaces';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<RequirePermissionsDecorator>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (requiredPermissions.role) {
      return user.role === requiredPermissions.role;
    }

    if (requiredPermissions.resource && requiredPermissions.permissions) {
      if (user.role === 'admin') {
        return true;
      }

      const userPermissions = request.userPermissions || [];
      return requiredPermissions.permissions.some((permission) =>
        userPermissions.includes(permission),
      );
    }

    return true;
  }
}
