import { Module } from '@nestjs/common';
import { RoleMenuPermissionsController, UserMenuPermissionsController } from './role-menu-permissions.controller';
import { RoleMenuPermissionsService } from './role-menu-permissions.service';

@Module({
  controllers: [RoleMenuPermissionsController, UserMenuPermissionsController],
  providers: [RoleMenuPermissionsService],
  exports: [RoleMenuPermissionsService],
})
export class RoleMenuPermissionsModule {}
