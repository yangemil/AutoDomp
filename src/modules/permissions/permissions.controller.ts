import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permission, ProjectMemberRole } from '../../common/interfaces';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post('projects/:id/members')
  async addMember(
    @Param('id') projectId: string,
    @Body() body: { userId: string; username: string; role: ProjectMemberRole; permissions: Permission[] },
  ) {
    return await this.permissionsService.addMemberToProject(
      projectId,
      body.userId,
      body.username,
      body.role,
      body.permissions,
    );
  }

  @Delete('projects/:id/members/:userId')
  async removeMember(@Param('id') projectId: string, @Param('userId') userId: string) {
    return await this.permissionsService.removeMemberFromProject(projectId, userId);
  }

  @Put('projects/:id/members/:userId/permissions')
  async updatePermissions(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
    @Body() body: { permissions: Permission[] },
  ) {
    return await this.permissionsService.updateMemberPermissions(projectId, userId, body.permissions);
  }

  @Get('projects/:id/members')
  async getMembers(@Param('id') projectId: string) {
    return await this.permissionsService.getProjectMembers(projectId);
  }

  @Get('user/projects')
  async getUserProjects(@Request() req) {
    return await this.permissionsService.getUserProjects(req.user.userId, req.user.role);
  }
}
