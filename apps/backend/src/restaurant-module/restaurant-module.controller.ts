import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { RestaurantModuleService } from './restaurant-module.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from 'src/database/generated/prisma/enums';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { AddRestaurantUserDto } from './dto/add-restaurant-user.dto';

@Controller('restaurants')
@UseGuards(JwtAuthGuard)
export class RestaurantModuleController {
  constructor(
    private readonly restaurantModuleService: RestaurantModuleService,
  ) {}

  /**
   * Create a new restaurant (Super Admin only)
   */
  @Post('create')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createRestaurant(@Body() createRestaurantDto: CreateRestaurantDto) {
    return this.restaurantModuleService.createRestaurant(createRestaurantDto);
  }

  /**
   * Get all restaurants with pagination
   */
  @Get('list')
  async getAllRestaurants(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req?: any,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const userId = req?.user?.userId;
    const userRole = req?.user?.role;

    return this.restaurantModuleService.getAllRestaurants(
      pageNum,
      limitNum,
      userId,
      userRole,
    );
  }

  /**
   * Get user's restaurants (for dropdowns)
   */
  @Get('my-restaurants')
  async getMyRestaurants(@Request() req: any) {
    return this.restaurantModuleService.getUserRestaurants(
      req.user.userId,
      req.user.role,
    );
  }

  /**
   * Get restaurant by ID
   */
  @Get(':id')
  async getRestaurantById(@Param('id') id: string, @Request() req?: any) {
    const userId = req?.user?.userId;
    const userRole = req?.user?.role;

    return this.restaurantModuleService.getRestaurantById(
      parseInt(id),
      userId,
      userRole,
    );
  }

  /**
   * Update restaurant
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateRestaurant(
    @Param('id') id: string,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
    @Request() req?: any,
  ) {
    const userId = req?.user?.userId;
    const userRole = req?.user?.role;

    return this.restaurantModuleService.updateRestaurant(
      parseInt(id),
      updateRestaurantDto,
      userId,
      userRole,
    );
  }

  /**
   * Delete restaurant (Super Admin only)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteRestaurant(@Param('id') id: string) {
    return this.restaurantModuleService.deleteRestaurant(parseInt(id));
  }

  /**
   * Add user to restaurant
   */
  @Post(':id/users')
  @HttpCode(HttpStatus.CREATED)
  async addUserToRestaurant(
    @Param('id') id: string,
    @Body() addRestaurantUserDto: AddRestaurantUserDto,
    @Request() req?: any,
  ) {
    const requestingUserId = req?.user?.userId;
    const requestingUserRole = req?.user?.role;

    return this.restaurantModuleService.addUserToRestaurant(
      parseInt(id),
      addRestaurantUserDto,
      requestingUserId,
      requestingUserRole,
    );
  }

  /**
   * Remove user from restaurant
   */
  @Delete(':id/users/:userId')
  @HttpCode(HttpStatus.OK)
  async removeUserFromRestaurant(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req?: any,
  ) {
    const requestingUserId = req?.user?.userId;
    const requestingUserRole = req?.user?.role;

    return this.restaurantModuleService.removeUserFromRestaurant(
      parseInt(id),
      parseInt(userId),
      requestingUserId,
      requestingUserRole,
    );
  }

  /**
   * Get all users in a restaurant
   */
  @Get(':id/users')
  async getRestaurantUsers(@Param('id') id: string, @Request() req?: any) {
    const requestingUserId = req?.user?.userId;
    const requestingUserRole = req?.user?.role;

    return this.restaurantModuleService.getRestaurantUsers(
      parseInt(id),
      requestingUserId,
      requestingUserRole,
    );
  }
}
