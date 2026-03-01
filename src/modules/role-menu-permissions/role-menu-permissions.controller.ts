import { Controller, Get, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RoleMenuPermissionsService, RoleMenuPermissions, RoleMenuPermissionsConfig } from './role-menu-permissions.service';

@Controller('api/role-menu-permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoleMenuPermissionsController {
  constructor(private readonly roleMenuPermissionsService: RoleMenuPermissionsService) {}

  @RequirePermissions('admin')
  @Get()
  getAllRolePermissions() {
    return this.roleMenuPermissionsService.getAllRolePermissions();
  }

  @RequirePermissions('admin')
  @Get(':roleId')
  getRolePermissions(@Param('roleId') roleId: string) {
    const permissions = this.roleMenuPermissionsService.getRolePermissions(roleId);
    if (!permissions) {
      throw new Error('角色不存在');
    }
    return permissions;
  }

  @RequirePermissions('admin')
  @Put(':roleId')
  updateRolePermissions(
    @Param('roleId') roleId: string,
    @Body() body: { name: string; description: string; menus: any[] },
  ) {
    return this.roleMenuPermissionsService.updateRolePermissions(roleId, body);
  }
}

@Controller('api/user/menu-permissions')
@UseGuards(JwtAuthGuard)
export class UserMenuPermissionsController {
  constructor(private readonly roleMenuPermissionsService: RoleMenuPermissionsService) {}

  @Get()
  getUserMenuPermissions(@Req() req: any) {
    const roleId = req.user.role;
    return this.roleMenuPermissionsService.getRolePermissions(roleId);
  }
}
