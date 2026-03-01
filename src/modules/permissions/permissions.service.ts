import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ProjectMember, ProjectMemberRole, Permission, Project } from '../../common/interfaces';
import { DataService } from '../data';

@Injectable()
export class PermissionsService {
  constructor(private readonly dataService: DataService) {}

  async addMemberToProject(
    projectId: string,
    userId: string,
    username: string,
    role: ProjectMemberRole,
    permissions: Permission[],
  ): Promise<Project> {
    const project = await this.dataService.getProject(projectId);
    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    if (!project.members) {
      project.members = [];
    }

    // 检查用户是否已经是成员
    const existingMember = project.members.find((m) => m.userId === userId);
    if (existingMember) {
      // 更新现有成员
      existingMember.role = role;
      existingMember.permissions = permissions;
    } else {
      // 添加新成员
      project.members.push({
        userId,
        username,
        role,
        permissions,
        joinedAt: new Date(),
      });
    }

    await this.dataService.saveProject(project);
    return project;
  }

  async removeMemberFromProject(projectId: string, userId: string): Promise<Project> {
    const project = await this.dataService.getProject(projectId);
    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    if (!project.members) {
      throw new NotFoundException('项目没有成员');
    }

    project.members = project.members.filter((m) => m.userId !== userId);
    await this.dataService.saveProject(project);
    return project;
  }

  async updateMemberPermissions(
    projectId: string,
    userId: string,
    permissions: Permission[],
  ): Promise<Project> {
    const project = await this.dataService.getProject(projectId);
    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    if (!project.members) {
      throw new NotFoundException('项目没有成员');
    }

    const member = project.members.find((m) => m.userId === userId);
    if (!member) {
      throw new NotFoundException('成员不存在');
    }

    member.permissions = permissions;
    await this.dataService.saveProject(project);
    return project;
  }

  async checkPermission(
    userId: string,
    projectId: string,
    requiredPermission: Permission,
  ): Promise<boolean> {
    const project = await this.dataService.getProject(projectId);
    if (!project) {
      return false;
    }

    // 项目所有者拥有所有权限
    if (project.ownerId === userId) {
      return true;
    }

    if (!project.members) {
      return false;
    }

    const member = project.members.find((m) => m.userId === userId);
    if (!member) {
      return false;
    }

    // 检查角色权限
    if (member.role === ProjectMemberRole.ADMIN || member.role === ProjectMemberRole.OWNER) {
      return true;
    }

    // 检查具体权限
    return member.permissions.includes(requiredPermission);
  }

  async getUserProjects(userId: string, userRole: string): Promise<Project[]> {
    const allProjects = await this.dataService.getProjects();

    if (userRole === 'admin') {
      return allProjects;
    }

    // 过滤出用户有权限的项目
    return allProjects.filter((project) => {
      if (project.ownerId === userId) {
        return true;
      }

      if (!project.members) {
        return false;
      }

      return project.members.some((m) => m.userId === userId);
    });
  }

  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const project = await this.dataService.getProject(projectId);
    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    return project.members || [];
  }
}
