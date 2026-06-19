import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus, Param, UnauthorizedException, Query } from '@nestjs/common';
import { UserModuleService } from './user-module.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from 'src/database/generated/prisma/enums';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PaginationDto } from './dto/pagination.dto';

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
   * Get all users (Super Admin only) with pagination
   */
  @Get('list')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async getAllUsers(@Query() paginationDto: PaginationDto) {
    return this.userModuleService.getAllUsers(paginationDto.pageValue, paginationDto.limitValue);
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
        changePasswordDto.newPassword,
      );
    }

    // Regular users can only change their own password (requires oldPassword)
    if (!changePasswordDto.oldPassword) {
      throw new UnauthorizedException('Old password is required');
    }

    return this.userModuleService.changePassword(
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
