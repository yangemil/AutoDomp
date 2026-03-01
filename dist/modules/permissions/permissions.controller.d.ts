import { PermissionsService } from './permissions.service';
import { Permission, ProjectMemberRole } from '../../common/interfaces';
export declare class PermissionsController {
    private readonly permissionsService;
    constructor(permissionsService: PermissionsService);
    addMember(projectId: string, body: {
        userId: string;
        username: string;
        role: ProjectMemberRole;
        permissions: Permission[];
    }): Promise<import("../../common/interfaces").Project>;
    removeMember(projectId: string, userId: string): Promise<import("../../common/interfaces").Project>;
    updatePermissions(projectId: string, userId: string, body: {
        permissions: Permission[];
    }): Promise<import("../../common/interfaces").Project>;
    getMembers(projectId: string): Promise<import("../../common/interfaces").ProjectMember[]>;
    getUserProjects(req: any): Promise<import("../../common/interfaces").Project[]>;
}
