import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MenuModuleService } from './menu-module.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/generated/prisma/enums';
import {
  CreateMenuDto,
  UpdateMenuDto,
  CreateCategoryDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  CreateModifierGroupDto,
  CreateModifierOptionDto,
  SetOutletPricingDto,
  BulkSetOutletPricingDto,
} from './dto';

@Controller('menus')
@UseGuards(JwtAuthGuard)
export class MenuModuleController {
  constructor(private readonly menuModuleService: MenuModuleService) {}

  // ==================== MENU ENDPOINTS ====================

  @Post('create')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createMenu(@Body() createMenuDto: CreateMenuDto) {
    return this.menuModuleService.createMenu(createMenuDto);
  }

  @Get('list')
  @HttpCode(HttpStatus.OK)
  async getAllMenus(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('restaurantId') restaurantId?: string,
    @Request() req?: any,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const restaurantIdNum = restaurantId ? parseInt(restaurantId, 10) : undefined;
    const userId = req?.user?.userId;
    const userRole = req?.user?.role;

    return this.menuModuleService.getAllMenus(pageNum, limitNum, restaurantIdNum, userId, userRole);
  }

  // ==================== IMAGE ENDPOINTS (must come before :id routes) ====================

  @Get('images')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  async listImages(
    @Query('folder') folder?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const folderPath = folder || 'menu-items';
      const limitNum = limit ? parseInt(limit, 10) : 100;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      const result = await this.menuModuleService['supabase'].listImages(folderPath, limitNum, offsetNum);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Failed to list images',
      };
    }
  }

  @Post('upload-image')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadImage(@UploadedFile() file: any) {
    if (!file) {
      return {
        success: false,
        message: 'No file uploaded',
      };
    }

    try {
      const imageUrl = await this.menuModuleService['supabase'].uploadImage(file);
      return {
        success: true,
        message: 'Image uploaded successfully',
        data: { imageUrl },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Upload failed',
      };
    }
  }

  @Delete('images')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  async deleteImage(@Body('imageUrl') imageUrl: string) {
    if (!imageUrl) {
      return {
        success: false,
        message: 'Image URL is required',
      };
    }

    try {
      await this.menuModuleService['supabase'].deleteImage(imageUrl);
      return {
        success: true,
        message: 'Image deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Failed to delete image',
      };
    }
  }

  // ==================== MENU ID-BASED ENDPOINTS ====================

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getMenuById(@Param('id', ParseIntPipe) id: number, @Request() req?: any) {
    const userId = req?.user?.userId;
    const userRole = req?.user?.role;

    return this.menuModuleService.getMenuById(id, userId, userRole);
  }

  // ==================== MENU UPDATE/DELETE ENDPOINTS ====================

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateMenu(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMenuDto: UpdateMenuDto,
    @Request() req?: any,
  ) {
    const userId = req?.user?.userId;
    const userRole = req?.user?.role;

    return this.menuModuleService.updateMenu(id, updateMenuDto, userId, userRole);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteMenu(@Param('id', ParseIntPipe) id: number) {
    return this.menuModuleService.deleteMenu(id);
  }

  // ==================== CATEGORY ENDPOINTS ====================

  @Post(':id/categories')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.menuModuleService.createCategory(id, createCategoryDto);
  }

  @Put(':id/categories/:categoryId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Body() body: { name: string; displayOrder?: number },
  ) {
    return this.menuModuleService.updateCategory(id, categoryId, body.name, body.displayOrder);
  }

  @Delete(':id/categories/:categoryId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteCategory(
    @Param('id', ParseIntPipe) id: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ) {
    return this.menuModuleService.deleteCategory(id, categoryId);
  }

  // ==================== MENU ITEM ENDPOINTS ====================

  @Post(':id/categories/:categoryId/items')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async createMenuItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Body() createMenuItemDto: CreateMenuItemDto,
  ) {
    return this.menuModuleService.createMenuItem(id, categoryId, createMenuItemDto);
  }

  @Put(':id/items/:itemId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  async updateMenuItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
  ) {
    return this.menuModuleService.updateMenuItem(id, itemId, updateMenuItemDto);
  }

  @Delete(':id/items/:itemId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  async deleteMenuItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.menuModuleService.deleteMenuItem(id, itemId);
  }

  // ==================== MODIFIER GROUP ENDPOINTS ====================

  @Post(':id/items/:itemId/modifiers')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async createModifierGroup(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() createModifierGroupDto: CreateModifierGroupDto,
  ) {
    return this.menuModuleService.createModifierGroup(id, itemId, createModifierGroupDto);
  }

  @Put(':id/modifiers/:modifierId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  async updateModifierGroup(
    @Param('id', ParseIntPipe) id: number,
    @Param('modifierId', ParseIntPipe) modifierId: number,
    @Body() body: { name: string; minSelect?: number; maxSelect?: number },
  ) {
    return this.menuModuleService.updateModifierGroup(id, modifierId, body.name, body.minSelect, body.maxSelect);
  }

  @Delete(':id/modifiers/:modifierId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  async deleteModifierGroup(
    @Param('id', ParseIntPipe) id: number,
    @Param('modifierId', ParseIntPipe) modifierId: number,
  ) {
    return this.menuModuleService.deleteModifierGroup(id, modifierId);
  }

  // ==================== MODIFIER OPTION ENDPOINTS ====================

  @Post(':id/modifiers/:modifierId/options')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async createModifierOption(
    @Param('id', ParseIntPipe) id: number,
    @Param('modifierId', ParseIntPipe) modifierId: number,
    @Body() createModifierOptionDto: CreateModifierOptionDto,
  ) {
    return this.menuModuleService.createModifierOption(id, modifierId, createModifierOptionDto);
  }

  @Put(':id/modifiers/:modifierId/options/:optionId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  async updateModifierOption(
    @Param('id', ParseIntPipe) id: number,
    @Param('modifierId', ParseIntPipe) modifierId: number,
    @Param('optionId', ParseIntPipe) optionId: number,
    @Body() body: { name: string; priceAdjustment: number },
  ) {
    return this.menuModuleService.updateModifierOption(id, modifierId, optionId, body.name, body.priceAdjustment);
  }

  @Delete(':id/modifiers/:modifierId/options/:optionId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  async deleteModifierOption(
    @Param('id', ParseIntPipe) id: number,
    @Param('modifierId', ParseIntPipe) modifierId: number,
    @Param('optionId', ParseIntPipe) optionId: number,
  ) {
    return this.menuModuleService.deleteModifierOption(id, modifierId, optionId);
  }

  // ==================== OUTLET PRICING ENDPOINTS ====================

  @Post(':id/outlets/:outletId/pricing')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  async setOutletPricing(
    @Param('id', ParseIntPipe) id: number,
    @Param('outletId', ParseIntPipe) outletId: number,
    @Body() bulkPricingDto: BulkSetOutletPricingDto,
  ) {
    return this.menuModuleService.setOutletPricing(id, outletId, bulkPricingDto);
  }

  @Get(':id/outlets/:outletId/pricing')
  @HttpCode(HttpStatus.OK)
  async getOutletPricing(
    @Param('id', ParseIntPipe) id: number,
    @Param('outletId', ParseIntPipe) outletId: number,
  ) {
    return this.menuModuleService.getOutletPricing(id, outletId);
  }
}

// ==================== PUBLIC CONTROLLER ====================

@Controller('public/menus')
export class PublicMenuController {
  constructor(private readonly menuModuleService: MenuModuleService) {}

  @Get('outlet/:outletId')
  @HttpCode(HttpStatus.OK)
  async getPublicMenuByOutlet(@Param('outletId', ParseIntPipe) outletId: number) {
    return this.menuModuleService.getPublicMenuByOutlet(outletId);
  }

  @Get('restaurant/:restaurantId')
  @HttpCode(HttpStatus.OK)
  async getPublicMenuByRestaurant(@Param('restaurantId', ParseIntPipe) restaurantId: number) {
    // Get first outlet for this restaurant to fetch menu
    const { PrismaService } = require('../database/prisma.service');
    const prisma = new PrismaService();

    const outlet = await prisma.outlet.findFirst({
      where: { restaurantId, status: 'ACTIVE' },
    });

    if (!outlet) {
      return {
        success: true,
        message: 'No active outlet found for this restaurant',
        data: null,
      };
    }

    return this.menuModuleService.getPublicMenuByOutlet(outlet.id);
  }
}
