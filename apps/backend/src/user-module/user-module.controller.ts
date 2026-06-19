import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { UserModuleService } from './user-module.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from 'src/database/generated/prisma/enums';

class CreateUserDto {
  email!: string;
  phone!: string;
  password!: string;
  firstName!: string;
  lastName?: string;
  role!: UserRole;
}

class ChangePasswordDto {
  oldPassword!: string;
  newPassword!: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserModuleController {
  constructor(private readonly userModuleService: UserModuleService) {}

  /**
   * Create a new user (Super Admin only)
   */
  @Post('create')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userModuleService.createUser(
      createUserDto.email,
      createUserDto.phone,
      createUserDto.password,
      createUserDto.firstName,
      createUserDto.lastName || null,
      createUserDto.role,
    );
  }

  /**
   * Get all users (Super Admin only)
   */
  @Get('list')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async getAllUsers() {
    return this.userModuleService.getAllUsers();
  }

  /**
   * Change password (Any authenticated user)
   */
  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.userModuleService.changePassword(
      req.user.userId,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  /**
   * Get current user profile
   */
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.userModuleService.getUserById(req.user.userId);
  }

  /**
   * Get user by ID (Super Admin only)
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async getUserById(@Param('id') id: string) {
    return this.userModuleService.getUserById(parseInt(id));
  }
}
