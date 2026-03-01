import { Controller, Post, Body, Get, Put, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, UserRole, Permission } from '../../common/interfaces';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/permissions.decorator';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return await this.authService.getUserById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('users', [Permission.MANAGE])
  @Get('users')
  async getAllUsers() {
    return await this.authService.getAllUsers();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('users', [Permission.MANAGE])
  @Post('users')
  async createUser(@Body() body: { username: string; email: string; password: string; role: UserRole }) {
    return await this.authService.createUser(body.username, body.email, body.password, body.role);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('users', [Permission.MANAGE])
  @Put('users/:userId/role')
  async updateUserRole(@Param('userId') userId: string, @Body() body: { role: UserRole }) {
    return await this.authService.updateUserRole(userId, body.role);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('users', [Permission.MANAGE])
  @Delete('users/:userId')
  async deleteUser(@Param('userId') userId: string) {
    return await this.authService.deleteUser(userId);
  }
}
