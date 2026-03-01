import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, LoginDto, RegisterDto, AuthResponse, JwtPayload, UserRole } from '../../common/interfaces';

@Injectable()
export class AuthService {
  private users: User[] = [];
  private usersFilePath = 'data/users.json';

  constructor(private jwtService: JwtService) {
    this.loadUsers();
    this.ensureDefaultAdmin();
  }

  private loadUsers() {
    const fs = require('fs');
    const path = require('path');

    try {
      const dataPath = path.join(process.cwd(), this.usersFilePath);
      if (fs.existsSync(dataPath)) {
        const content = fs.readFileSync(dataPath, 'utf-8');
        this.users = JSON.parse(content);
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
      this.users = [];
    }
  }

  private saveUsers() {
    const fs = require('fs');
    const path = require('path');

    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const dataPath = path.join(dataDir, 'users.json');
      fs.writeFileSync(dataPath, JSON.stringify(this.users, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存用户数据失败:', error);
    }
  }

  private ensureDefaultAdmin() {
    if (this.users.length === 0) {
      const adminPassword = bcrypt.hashSync('admin123', 10);
      const admin: User = {
        id: uuidv4(),
        username: 'admin',
        email: 'admin@autodomp.com',
        passwordHash: adminPassword,
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.push(admin);
      this.saveUsers();
      console.log('默认管理员账号已创建: admin / admin123');
    }
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = this.users.find((u) => u.username === username);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    const payload: JwtPayload = {
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

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = this.users.find(
      (u) => u.username === registerDto.username || u.email === registerDto.email,
    );

    if (existingUser) {
      throw new ConflictException('用户名或邮箱已存在');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const newUser: User = {
      id: uuidv4(),
      username: registerDto.username,
      email: registerDto.email,
      passwordHash,
      role: UserRole.TESTER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.push(newUser);
    this.saveUsers();

    const payload: JwtPayload = {
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

  async getUserById(userId: string): Promise<User | null> {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      const { passwordHash, ...result } = user;
      return result as any;
    }
    return null;
  }

  async getAllUsers(): Promise<User[]> {
    return this.users.map(({ passwordHash, ...user }) => user as any);
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User | null> {
    const userIndex = this.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return null;
    }

    this.users[userIndex].role = role;
    this.users[userIndex].updatedAt = new Date();
    this.saveUsers();

    const { passwordHash, ...result } = this.users[userIndex];
    return result as any;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const userIndex = this.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return false;
    }

    this.users.splice(userIndex, 1);
    this.saveUsers();
    return true;
  }

  async createUser(username: string, email: string, password: string, role: UserRole): Promise<User> {
    const existingUser = this.users.find(
      (u) => u.username === username || u.email === email,
    );

    if (existingUser) {
      throw new ConflictException('用户名或邮箱已存在');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: uuidv4(),
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
    return result as any;
  }
}
