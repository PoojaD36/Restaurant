import { Controller, Post, Get, Put, Delete, Body, UseGuards, Request, HttpCode, HttpStatus, Param, UnauthorizedException, Query } from '@nestjs/common';
import { UserModuleService } from './user-module.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from 'src/database/generated/prisma/enums';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common';
import { GetUserDto } from './dto/get-user.dto';

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
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userModuleService.createUser(createUserDto);
  }

  /**
   * Get all users (Super Admin only) with pagination
   */
  @Get('list')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async getAllUsers(@Query() getUserDto: GetUserDto) {
    return this.userModuleService.getAllUsers(getUserDto);
  }

  /**
   * Get assignable users (Manager, Chef, Delivery Agent)
   * Accessible by Super Admin and Restaurant Admin
   */
  @Get('assignable')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN)
  async getAssignableUsers(@Query() getUserDto: GetUserDto) {
    return this.userModuleService.getAssignableUsers(getUserDto);
  }

  /**
   * Change password (Any authenticated user)
   */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    // Super Admin can change any user's password
    if (req.user.role === UserRole.SUPER_ADMIN && changePasswordDto.userId) {
      return this.userModuleService.changeUserPassword(
        changePasswordDto.userId,
        changePasswordDto,
      );
    }

    // Regular users can only change their own password (requires oldPassword)
    if (!changePasswordDto.oldPassword) {
      throw new UnauthorizedException('Old password is required');
    }

    return this.userModuleService.changePassword(
      req.user.userId,
      changePasswordDto,
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

  /**
   * Update user (Super Admin only)
   */
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userModuleService.updateUser(parseInt(id), updateUserDto);
  }

  /**
   * Delete user (Super Admin only)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    return this.userModuleService.deleteUser(parseInt(id));
  }
}
