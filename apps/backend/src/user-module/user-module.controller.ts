import { Controller, Post, Get, Put, Delete, Body, UseGuards, Request, HttpCode, HttpStatus, Param, UnauthorizedException, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
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

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserModuleController {
  constructor(private readonly userModuleService: UserModuleService) {}

  @Post('create')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Create a new user with specified role. Only accessible by SUPER_ADMIN.',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not SUPER_ADMIN' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userModuleService.createUser(createUserDto);
  }

  @Get('list')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get all users',
    description: 'Get paginated list of all users (excluding Super Admin). Only accessible by SUPER_ADMIN.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not SUPER_ADMIN' })
  async getAllUsers(@Query() getUserDto: GetUserDto) {
    return this.userModuleService.getAllUsers(getUserDto);
  }

  @Get('assignable')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN)
  @ApiOperation({
    summary: 'Get assignable users',
    description: 'Get list of users that can be assigned to restaurants/outlets (MANAGER, CHEF, DELIVERY_AGENT). Accessible by SUPER_ADMIN and RESTAURANT_ADMIN.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Assignable users retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getAssignableUsers(@Query() getUserDto: GetUserDto) {
    return this.userModuleService.getAssignableUsers(getUserDto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change password',
    description: 'Change user password. SUPER_ADMIN can change any user\'s password without old password. Other users must provide their old password.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid old password' })
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

  @Get('profile')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Get the authenticated user\'s profile information.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  async getProfile(@Request() req: any) {
    return this.userModuleService.getUserById(req.user.userId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Get a specific user by ID. Only accessible by SUPER_ADMIN.',
  })
  @ApiParam({ name: 'id', description: 'User ID', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not SUPER_ADMIN' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string) {
    return this.userModuleService.getUserById(parseInt(id));
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user',
    description: 'Update a user\'s information. Only accessible by SUPER_ADMIN.',
  })
  @ApiParam({ name: 'id', description: 'User ID', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not SUPER_ADMIN' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userModuleService.updateUser(parseInt(id), updateUserDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Delete a user. Only accessible by SUPER_ADMIN.',
  })
  @ApiParam({ name: 'id', description: 'User ID', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not SUPER_ADMIN' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string) {
    return this.userModuleService.deleteUser(parseInt(id));
  }
}
