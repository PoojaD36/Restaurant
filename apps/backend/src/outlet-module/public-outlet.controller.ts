import { Controller, Get, Query, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { OutletModuleService } from './outlet-module.service';

/**
 * Public controller for outlet listing
 * No authentication required for these endpoints
 */
@Controller('public/outlets')
export class PublicOutletController {
  constructor(private readonly outletModuleService: OutletModuleService) {}

  /**
   * Get all active outlets with pagination (public access)
   */
  @Get('list')
  @HttpCode(HttpStatus.OK)
  async getAllOutlets(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('restaurantId') restaurantId?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const restaurantIdNum = restaurantId ? parseInt(restaurantId, 10) : undefined;

    return this.outletModuleService.getPublicOutlets(pageNum, limitNum, restaurantIdNum);
  }

  /**
   * Get outlet by ID (public access)
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getOutletById(@Param('id') id: string) {
    return this.outletModuleService.getOutletById(parseInt(id));
  }
}
