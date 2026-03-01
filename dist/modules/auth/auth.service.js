"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const uuid_1 = require("uuid");
const interfaces_1 = require("../../common/interfaces");
let AuthService = class AuthService {
    constructor(jwtService) {
        this.jwtService = jwtService;
        this.users = [];
        this.usersFilePath = 'data/users.json';
        this.loadUsers();
        this.ensureDefaultAdmin();
    }
    loadUsers() {
        const fs = require('fs');
        const path = require('path');
        try {
            const dataPath = path.join(process.cwd(), this.usersFilePath);
            if (fs.existsSync(dataPath)) {
                const content = fs.readFileSync(dataPath, 'utf-8');
                this.users = JSON.parse(content);
            }
        }
        catch (error) {
            console.error('加载用户数据失败:', error);
            this.users = [];
        }
    }
    saveUsers() {
        const fs = require('fs');
        const path = require('path');
        try {
            const dataDir = path.join(process.cwd(), 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            const dataPath = path.join(dataDir, 'users.json');
            fs.writeFileSync(dataPath, JSON.stringify(this.users, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('保存用户数据失败:', error);
        }
    }
    ensureDefaultAdmin() {
        if (this.users.length === 0) {
            const adminPassword = bcrypt.hashSync('admin123', 10);
            const admin = {
                id: (0, uuid_1.v4)(),
                username: 'admin',
                email: 'admin@autodomp.com',
                passwordHash: adminPassword,
                role: interfaces_1.UserRole.ADMIN,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.users.push(admin);
            this.saveUsers();
            console.log('默认管理员账号已创建: admin / admin123');
        }
    }
    async validateUser(username, password) {
        const user = this.users.find((u) => u.username === username);
        if (!user) {
            throw new common_1.UnauthorizedException('用户名或密码错误');
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('用户名或密码错误');
        }
        const { passwordHash, ...result } = user;
        return result;
    }
    async login(loginDto) {
        const user = await this.validateUser(loginDto.username, loginDto.password);
        const payload = {
            sub: user.id,
            username: user.username,
            role: user.role,
        };
        const accessToken = this.jwtService.sign(payload);
        return {
            accessToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        };
    }
    async register(registerDto) {
        const existingUser = this.users.find((u) => u.username === registerDto.username || u.email === registerDto.email);
        if (existingUser) {
            throw new common_1.ConflictException('用户名或邮箱已存在');
        }
        const passwordHash = await bcrypt.hash(registerDto.password, 10);
        const newUser = {
            id: (0, uuid_1.v4)(),
            username: registerDto.username,
            email: registerDto.email,
            passwordHash,
            role: interfaces_1.UserRole.TESTER,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.users.push(newUser);
        this.saveUsers();
        const payload = {
            sub: newUser.id,
            username: newUser.username,
            role: newUser.role,
        };
        const accessToken = this.jwtService.sign(payload);
        return {
            accessToken,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
            },
        };
    }
    async getUserById(userId) {
        const user = this.users.find((u) => u.id === userId);
        if (user) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }
    async getAllUsers() {
        return this.users.map(({ passwordHash, ...user }) => user);
    }
    async updateUserRole(userId, role) {
        const userIndex = this.users.findIndex((u) => u.id === userId);
        if (userIndex === -1) {
            return null;
        }
        this.users[userIndex].role = role;
        this.users[userIndex].updatedAt = new Date();
        this.saveUsers();
        const { passwordHash, ...result } = this.users[userIndex];
        return result;
    }
    async deleteUser(userId) {
        const userIndex = this.users.findIndex((u) => u.id === userId);
        if (userIndex === -1) {
            return false;
        }
        this.users.splice(userIndex, 1);
        this.saveUsers();
        return true;
    }
    async createUser(username, email, password, role) {
        const existingUser = this.users.find((u) => u.username === username || u.email === email);
        if (existingUser) {
            throw new common_1.ConflictException('用户名或邮箱已存在');
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = {
            id: (0, uuid_1.v4)(),
            username,
            email,
            passwordHash,
            role,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.users.push(newUser);
        this.saveUsers();
        const { passwordHash: _, ...result } = newUser;
        return result;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map