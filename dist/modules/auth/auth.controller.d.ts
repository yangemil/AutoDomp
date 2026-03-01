import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, UserRole } from '../../common/interfaces';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<import("../../common/interfaces").AuthResponse>;
    register(registerDto: RegisterDto): Promise<import("../../common/interfaces").AuthResponse>;
    getProfile(req: any): Promise<import("../../common/interfaces").User>;
    getAllUsers(): Promise<import("../../common/interfaces").User[]>;
    createUser(body: {
        username: string;
        email: string;
        password: string;
        role: UserRole;
    }): Promise<import("../../common/interfaces").User>;
    updateUserRole(userId: string, body: {
        role: UserRole;
    }): Promise<import("../../common/interfaces").User>;
    deleteUser(userId: string): Promise<boolean>;
}
