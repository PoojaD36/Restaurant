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
import { OutletModuleService } from './outlet-module.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';

@Controller('outlets')
@UseGuards(JwtAuthGuard)
export class OutletModuleController {
  constructor(private readonly outletModuleService: OutletModuleService) {}

  /**
   * Create a new outlet
   */
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createOutlet(
    @Body() createOutletDto: CreateOutletDto,
    @Request() req?: any,
  ) {
    const requestingUserId = req?.user?.userId;
    const requestingUserRole = req?.user?.role;

    return this.outletModuleService.createOutlet(
      createOutletDto,
      requestingUserId,
      requestingUserRole,
    );
  }

  /**
   * Get all outlets with pagination
   */
  @Get('list')
  async getAllOutlets(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('restaurantId') restaurantId?: string,
    @Request() req?: any,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const restaurantIdNum = restaurantId
      ? parseInt(restaurantId, 10)
      : undefined;
    const userId = req?.user?.userId;
    const userRole = req?.user?.role;

    return this.outletModuleService.getAllOutlets(
      pageNum,
      limitNum,
      restaurantIdNum,
      userId,
      userRole,
    );
  }

  /**
   * Get outlets by restaurant
   */
  @Get('restaurant/:restaurantId')
  async getOutletsByRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Request() req?: any,
  ) {
    const requestingUserId = req?.user?.userId;
    const requestingUserRole = req?.user?.role;

    return this.outletModuleService.getOutletsByRestaurant(
      parseInt(restaurantId),
      requestingUserId,
      requestingUserRole,
    );
  }

  /**
   * Get outlet by ID
   */
  @Get(':id')
  async getOutletById(@Param('id') id: string) {
    return this.outletModuleService.getOutletById(parseInt(id));
  }

  /**
   * Update outlet
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateOutlet(
    @Param('id') id: string,
    @Body() updateOutletDto: UpdateOutletDto,
    @Request() req?: any,
  ) {
    const requestingUserId = req?.user?.userId;
    const requestingUserRole = req?.user?.role;

    return this.outletModuleService.updateOutlet(
      parseInt(id),
      updateOutletDto,
      requestingUserId,
      requestingUserRole,
    );
  }

  /**
   * Delete outlet
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteOutlet(@Param('id') id: string, @Request() req?: any) {
    const requestingUserId = req?.user?.userId;
    const requestingUserRole = req?.user?.role;

    return this.outletModuleService.deleteOutlet(
      parseInt(id),
      requestingUserId,
      requestingUserRole,
    );
  }
}
