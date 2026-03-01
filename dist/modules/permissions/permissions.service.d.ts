import { ProjectMember, ProjectMemberRole, Permission, Project } from '../../common/interfaces';
import { DataService } from '../data';
export declare class PermissionsService {
    private readonly dataService;
    constructor(dataService: DataService);
    addMemberToProject(projectId: string, userId: string, username: string, role: ProjectMemberRole, permissions: Permission[]): Promise<Project>;
    removeMemberFromProject(projectId: string, userId: string): Promise<Project>;
    updateMemberPermissions(projectId: string, userId: string, permissions: Permission[]): Promise<Project>;
    checkPermission(userId: string, projectId: string, requiredPermission: Permission): Promise<boolean>;
    getUserProjects(userId: string, userRole: string): Promise<Project[]>;
    getProjectMembers(projectId: string): Promise<ProjectMember[]>;
}
