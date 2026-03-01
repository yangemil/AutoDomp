import { JwtService } from '@nestjs/jwt';
import { User, LoginDto, RegisterDto, AuthResponse, UserRole } from '../../common/interfaces';
export declare class AuthService {
    private jwtService;
    private users;
    private usersFilePath;
    constructor(jwtService: JwtService);
    private loadUsers;
    private saveUsers;
    private ensureDefaultAdmin;
    validateUser(username: string, password: string): Promise<any>;
    login(loginDto: LoginDto): Promise<AuthResponse>;
    register(registerDto: RegisterDto): Promise<AuthResponse>;
    getUserById(userId: string): Promise<User | null>;
    getAllUsers(): Promise<User[]>;
    updateUserRole(userId: string, role: UserRole): Promise<User | null>;
    deleteUser(userId: string): Promise<boolean>;
    createUser(username: string, email: string, password: string, role: UserRole): Promise<User>;
}
