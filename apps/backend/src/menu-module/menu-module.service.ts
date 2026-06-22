import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../storage/supabase.service';
import { ApiResponse, PaginatedResponse, PaginationMeta } from '../common';
import { UserRole } from '../database/generated/prisma/enums';
import {
  CreateMenuDto,
  UpdateMenuDto,
  CreateCategoryDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  CreateModifierGroupDto,
  CreateModifierOptionDto,
  BulkSetOutletPricingDto,
} from './dto';

@Injectable()
export class MenuModuleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  // ==================== MENU CRUD ====================

  async createMenu(createMenuDto: CreateMenuDto): Promise<ApiResponse> {
    try {
      const existingMenu = await this.prisma.menu.findFirst({
        where: {
          restaurantId: createMenuDto.restaurantId,
          name: createMenuDto.name,
        },
      });

      if (existingMenu) {
        throw new ConflictException('Menu with this name already exists for this restaurant');
      }

      await this.prisma.menu.create({
        data: {
          name: createMenuDto.name,
          description: createMenuDto.description,
          restaurantId: createMenuDto.restaurantId,
        },
      });

      return {
        success: true,
        message: 'Menu created successfully',
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Menu creation failed');
    }
  }

  async getAllMenus(
    page: number = 1,
    limit: number = 10,
    restaurantId?: number,
    userId?: number,
    userRole?: string,
  ): Promise<PaginatedResponse<any>> {
    try {
      const skip = (page - 1) * limit;
      let whereClause: any = {};

      if (restaurantId) {
        whereClause.restaurantId = restaurantId;
      }

      // Filter based on user role
      if (userRole === 'RESTAURANT_ADMIN' && userId && !restaurantId) {
        const userRestaurants = await this.prisma.restaurantUser.findMany({
          where: { userId },
          select: { restaurantId: true },
        });
        whereClause.restaurantId = { in: userRestaurants.map((ur) => ur.restaurantId) };
      }

      if (userRole === 'MANAGER' && userId && !restaurantId) {
        const userOutlets = await this.prisma.outletUser.findMany({
          where: { userId },
          select: { outlet: { select: { restaurantId: true } } },
        });
        const restaurantIds = [...new Set(userOutlets.map((uo) => uo.outlet.restaurantId))];
        whereClause.restaurantId = { in: restaurantIds };
      }

      const [menus, total] = await Promise.all([
        this.prisma.menu.findMany({
          where: whereClause,
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                categories: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.menu.count({ where: whereClause }),
      ]);

      const pagination = new PaginationMeta(total, page, limit);

      return {
        success: true,
        message: 'Menus retrieved successfully',
        data: menus.map((menu) => ({
          id: menu.id,
          name: menu.name,
          description: menu.description,
          status: menu.status,
          restaurant: menu.restaurant,
          categoryCount: menu._count.categories,
          createdAt: menu.createdAt,
          updatedAt: menu.updatedAt,
        })),
        pagination,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch menus');
    }
  }

  async getMenuById(id: number, userId?: number, userRole?: string): Promise<ApiResponse<any>> {
    try {
      const menu = await this.prisma.menu.findUnique({
        where: { id },
        include: {
          restaurant: true,
          categories: {
            where: { status: 'ACTIVE' },
            orderBy: { displayOrder: 'asc' },
            include: {
              items: {
                where: { status: 'AVAILABLE' },
                include: {
                  modifiers: {
                    include: {
                      options: {
                        orderBy: { displayOrder: 'asc' },
                      },
                    },
                    orderBy: { displayOrder: 'asc' },
                  },
                },
                orderBy: { id: 'asc' },
              },
            },
          },
        },
      });

      if (!menu) {
        throw new NotFoundException('Menu not found');
      }

      // Check access for non-super admins
      if (userRole && userRole !== 'SUPER_ADMIN' && userId) {
        const hasAccess = await this.verifyRestaurantAccess(menu.restaurantId, userId, userRole);
        if (!hasAccess) {
          throw new BadRequestException('Access denied to this menu');
        }
      }

      return {
        success: true,
        message: 'Menu retrieved successfully',
        data: menu,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch menu');
    }
  }

  async updateMenu(id: number, updateMenuDto: UpdateMenuDto, userId?: number, userRole?: string): Promise<ApiResponse> {
    try {
      const menu = await this.prisma.menu.findUnique({ where: { id } });
      if (!menu) {
        throw new NotFoundException('Menu not found');
      }

      if (userRole === 'RESTAURANT_ADMIN' && userId) {
        const hasAccess = await this.verifyRestaurantAccess(menu.restaurantId, userId, userRole);
        if (!hasAccess) {
          throw new BadRequestException('Access denied to this menu');
        }
      }

      await this.prisma.menu.update({
        where: { id },
        data: {
          ...(updateMenuDto.name && { name: updateMenuDto.name }),
          ...(updateMenuDto.description !== undefined && { description: updateMenuDto.description }),
          ...(updateMenuDto.status && { status: updateMenuDto.status }),
        },
      });

      return {
        success: true,
        message: 'Menu updated successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Menu update failed');
    }
  }

  async deleteMenu(id: number): Promise<ApiResponse> {
    try {
      const menu = await this.prisma.menu.findUnique({ where: { id } });
      if (!menu) {
        throw new NotFoundException('Menu not found');
      }

      // Delete associated images
      const categories = await this.prisma.menuCategory.findMany({
        where: { menuId: id },
        include: { items: true },
      });

      for (const category of categories) {
        for (const item of category.items) {
          if (item.imageUrl) {
            await this.supabase.deleteImage(item.imageUrl);
          }
        }
      }

      await this.prisma.menu.delete({ where: { id } });

      return {
        success: true,
        message: 'Menu deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Menu deletion failed');
    }
  }

  // ==================== CATEGORY CRUD ====================

  async createCategory(menuId: number, createCategoryDto: CreateCategoryDto): Promise<ApiResponse> {
    try {
      const menu = await this.prisma.menu.findUnique({ where: { id: menuId } });
      if (!menu) {
        throw new NotFoundException('Menu not found');
      }

      await this.prisma.menuCategory.create({
        data: {
          menuId,
          name: createCategoryDto.name,
          displayOrder: createCategoryDto.displayOrder ?? 0,
        },
      });

      return {
        success: true,
        message: 'Category created successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Category creation failed');
    }
  }

  async updateCategory(menuId: number, categoryId: number, name: string, displayOrder?: number): Promise<ApiResponse> {
    try {
      const category = await this.prisma.menuCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category || category.menuId !== menuId) {
        throw new NotFoundException('Category not found');
      }

      await this.prisma.menuCategory.update({
        where: { id: categoryId },
        data: { name, ...(displayOrder !== undefined && { displayOrder }) },
      });

      return {
        success: true,
        message: 'Category updated successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Category update failed');
    }
  }

  async deleteCategory(menuId: number, categoryId: number): Promise<ApiResponse> {
    try {
      const category = await this.prisma.menuCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category || category.menuId !== menuId) {
        throw new NotFoundException('Category not found');
      }

      // Delete item images
      const items = await this.prisma.menuItem.findMany({
        where: { categoryId },
      });

      for (const item of items) {
        if (item.imageUrl) {
          await this.supabase.deleteImage(item.imageUrl);
        }
      }

      await this.prisma.menuCategory.delete({ where: { id: categoryId } });

      return {
        success: true,
        message: 'Category deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Category deletion failed');
    }
  }

  // ==================== MENU ITEM CRUD ====================

  async createMenuItem(menuId: number, categoryId: number, createMenuItemDto: CreateMenuItemDto): Promise<ApiResponse> {
    try {
      const category = await this.prisma.menuCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category || category.menuId !== menuId) {
        throw new NotFoundException('Category not found');
      }

      await this.prisma.menuItem.create({
        data: {
          categoryId,
          name: createMenuItemDto.name,
          description: createMenuItemDto.description,
          basePrice: createMenuItemDto.basePrice,
          imageUrl: createMenuItemDto.imageUrl,
          isVegetarian: createMenuItemDto.isVegetarian ?? false,
          isSpicy: createMenuItemDto.isSpicy ?? false,
          preparationTime: createMenuItemDto.preparationTime,
          calories: createMenuItemDto.calories,
          status: createMenuItemDto.status ?? 'AVAILABLE',
        },
      });

      return {
        success: true,
        message: 'Menu item created successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Menu item creation failed');
    }
  }

  async updateMenuItem(menuId: number, itemId: number, updateMenuItemDto: UpdateMenuItemDto): Promise<ApiResponse> {
    try {
      const item = await this.prisma.menuItem.findUnique({
        where: { id: itemId },
        include: { category: true },
      });

      if (!item || item.category.menuId !== menuId) {
        throw new NotFoundException('Menu item not found');
      }

      const oldImageUrl = item.imageUrl;

      await this.prisma.menuItem.update({
        where: { id: itemId },
        data: {
          ...(updateMenuItemDto.name && { name: updateMenuItemDto.name }),
          ...(updateMenuItemDto.description !== undefined && { description: updateMenuItemDto.description }),
          ...(updateMenuItemDto.basePrice && { basePrice: updateMenuItemDto.basePrice }),
          ...(updateMenuItemDto.imageUrl !== undefined && { imageUrl: updateMenuItemDto.imageUrl }),
          ...(updateMenuItemDto.isVegetarian !== undefined && { isVegetarian: updateMenuItemDto.isVegetarian }),
          ...(updateMenuItemDto.isSpicy !== undefined && { isSpicy: updateMenuItemDto.isSpicy }),
          ...(updateMenuItemDto.preparationTime !== undefined && { preparationTime: updateMenuItemDto.preparationTime }),
          ...(updateMenuItemDto.calories !== undefined && { calories: updateMenuItemDto.calories }),
          ...(updateMenuItemDto.status && { status: updateMenuItemDto.status }),
        },
      });

      // Delete old image if replaced
      if (oldImageUrl && updateMenuItemDto.imageUrl && oldImageUrl !== updateMenuItemDto.imageUrl) {
        await this.supabase.deleteImage(oldImageUrl);
      }

      return {
        success: true,
        message: 'Menu item updated successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Menu item update failed');
    }
  }

  async deleteMenuItem(menuId: number, itemId: number): Promise<ApiResponse> {
    try {
      const item = await this.prisma.menuItem.findUnique({
        where: { id: itemId },
        include: { category: true },
      });

      if (!item || item.category.menuId !== menuId) {
        throw new NotFoundException('Menu item not found');
      }

      // Delete image
      if (item.imageUrl) {
        await this.supabase.deleteImage(item.imageUrl);
      }

      await this.prisma.menuItem.delete({ where: { id: itemId } });

      return {
        success: true,
        message: 'Menu item deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Menu item deletion failed');
    }
  }

  // ==================== MODIFIER GROUP CRUD ====================

  async createModifierGroup(menuId: number, itemId: number, createModifierGroupDto: CreateModifierGroupDto): Promise<ApiResponse> {
    try {
      const item = await this.prisma.menuItem.findUnique({
        where: { id: itemId },
        include: { category: true },
      });

      if (!item || item.category.menuId !== menuId) {
        throw new NotFoundException('Menu item not found');
      }

      await this.prisma.modifierGroup.create({
        data: {
          itemId,
          name: createModifierGroupDto.name,
          type: createModifierGroupDto.type,
          required: createModifierGroupDto.required ?? false,
          minSelect: createModifierGroupDto.minSelect ?? 0,
          maxSelect: createModifierGroupDto.maxSelect ?? 1,
          displayOrder: createModifierGroupDto.displayOrder ?? 0,
        },
      });

      return {
        success: true,
        message: 'Modifier group created successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Modifier group creation failed');
    }
  }

  async updateModifierGroup(menuId: number, modifierId: number, name: string, minSelect?: number, maxSelect?: number): Promise<ApiResponse> {
    try {
      const modifier = await this.prisma.modifierGroup.findUnique({
        where: { id: modifierId },
        include: { item: { include: { category: true } } },
      });

      if (!modifier || modifier.item.category.menuId !== menuId) {
        throw new NotFoundException('Modifier group not found');
      }

      await this.prisma.modifierGroup.update({
        where: { id: modifierId },
        data: {
          name,
          ...(minSelect !== undefined && { minSelect }),
          ...(maxSelect !== undefined && { maxSelect }),
        },
      });

      return {
        success: true,
        message: 'Modifier group updated successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Modifier group update failed');
    }
  }

  async deleteModifierGroup(menuId: number, modifierId: number): Promise<ApiResponse> {
    try {
      const modifier = await this.prisma.modifierGroup.findUnique({
        where: { id: modifierId },
        include: { item: { include: { category: true } } },
      });

      if (!modifier || modifier.item.category.menuId !== menuId) {
        throw new NotFoundException('Modifier group not found');
      }

      await this.prisma.modifierGroup.delete({ where: { id: modifierId } });

      return {
        success: true,
        message: 'Modifier group deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Modifier group deletion failed');
    }
  }

  // ==================== MODIFIER OPTION CRUD ====================

  async createModifierOption(menuId: number, modifierGroupId: number, createModifierOptionDto: CreateModifierOptionDto): Promise<ApiResponse> {
    try {
      const modifierGroup = await this.prisma.modifierGroup.findUnique({
        where: { id: modifierGroupId },
        include: { item: { include: { category: true } } },
      });

      if (!modifierGroup || modifierGroup.item.category.menuId !== menuId) {
        throw new NotFoundException('Modifier group not found');
      }

      await this.prisma.modifierOption.create({
        data: {
          modifierGroupId,
          name: createModifierOptionDto.name,
          priceAdjustment: createModifierOptionDto.priceAdjustment,
          isDefault: createModifierOptionDto.isDefault ?? false,
          displayOrder: createModifierOptionDto.displayOrder ?? 0,
        },
      });

      return {
        success: true,
        message: 'Modifier option created successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Modifier option creation failed');
    }
  }

  async updateModifierOption(menuId: number, modifierGroupId: number, optionId: number, name: string, priceAdjustment: number): Promise<ApiResponse> {
    try {
      const option = await this.prisma.modifierOption.findUnique({
        where: { id: optionId },
        include: {
          modifierGroup: {
            include: { item: { include: { category: true } } },
          },
        },
      });

      if (!option || option.modifierGroup.item.category.menuId !== menuId) {
        throw new NotFoundException('Modifier option not found');
      }

      await this.prisma.modifierOption.update({
        where: { id: optionId },
        data: { name, priceAdjustment },
      });

      return {
        success: true,
        message: 'Modifier option updated successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Modifier option update failed');
    }
  }

  async deleteModifierOption(menuId: number, modifierGroupId: number, optionId: number): Promise<ApiResponse> {
    try {
      const option = await this.prisma.modifierOption.findUnique({
        where: { id: optionId },
        include: {
          modifierGroup: {
            include: { item: { include: { category: true } } },
          },
        },
      });

      if (!option || option.modifierGroup.item.category.menuId !== menuId) {
        throw new NotFoundException('Modifier option not found');
      }

      await this.prisma.modifierOption.delete({ where: { id: optionId } });

      return {
        success: true,
        message: 'Modifier option deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Modifier option deletion failed');
    }
  }

  // ==================== OUTLET PRICING ====================

  async setOutletPricing(menuId: number, outletId: number, bulkPricingDto: BulkSetOutletPricingDto): Promise<ApiResponse> {
    try {
      const menu = await this.prisma.menu.findUnique({ where: { id: menuId } });
      if (!menu) {
        throw new NotFoundException('Menu not found');
      }

      const outlet = await this.prisma.outlet.findUnique({
        where: { id: outletId },
      });

      if (!outlet || outlet.restaurantId !== menu.restaurantId) {
        throw new NotFoundException('Outlet not found or does not belong to this menu\'s restaurant');
      }

      // Upsert pricing
      await this.prisma.menuItemOutletPricing.upsert({
        where: {
          menuId_itemId_outletId: {
            menuId,
            itemId: bulkPricingDto.itemId,
            outletId,
          },
        },
        create: {
          menuId,
          itemId: bulkPricingDto.itemId,
          outletId,
          price: bulkPricingDto.price,
          available: bulkPricingDto.available ?? true,
        },
        update: {
          price: bulkPricingDto.price,
          available: bulkPricingDto.available ?? true,
        },
      });

      return {
        success: true,
        message: 'Outlet pricing set successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to set outlet pricing');
    }
  }

  async getOutletPricing(menuId: number, outletId: number): Promise<ApiResponse<any>> {
    try {
      const menu = await this.prisma.menu.findUnique({ where: { id: menuId } });
      if (!menu) {
        throw new NotFoundException('Menu not found');
      }

      const outlet = await this.prisma.outlet.findUnique({
        where: { id: outletId },
      });

      if (!outlet || outlet.restaurantId !== menu.restaurantId) {
        throw new NotFoundException('Outlet not found or does not belong to this menu\'s restaurant');
      }

      const pricing = await this.prisma.menuItemOutletPricing.findMany({
        where: {
          menuId,
          outletId,
        },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              basePrice: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Outlet pricing retrieved successfully',
        data: pricing,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch outlet pricing');
    }
  }

  // ==================== PUBLIC ENDPOINTS ====================

  async getPublicMenuByOutlet(outletId: number): Promise<ApiResponse<any>> {
    try {
      const outlet = await this.prisma.outlet.findUnique({
        where: { id: outletId },
      });

      if (!outlet) {
        throw new NotFoundException('Outlet not found');
      }

      // Get active menu for the restaurant
      const menu = await this.prisma.menu.findFirst({
        where: {
          restaurantId: outlet.restaurantId,
          status: 'ACTIVE',
        },
        include: {
          categories: {
            where: { status: 'ACTIVE' },
            orderBy: { displayOrder: 'asc' },
            include: {
              items: {
                where: { status: 'AVAILABLE' },
                include: {
                  modifiers: {
                    include: {
                      options: {
                        orderBy: { displayOrder: 'asc' },
                      },
                    },
                    orderBy: { displayOrder: 'asc' },
                  },
                  outletPricing: {
                    where: { outletId },
                  },
                },
                orderBy: { id: 'asc' },
              },
            },
          },
        },
      });

      if (!menu) {
        return {
          success: true,
          message: 'No active menu found',
          data: null,
        };
      }

      // Transform data with outlet-specific pricing
      const transformedCategories = menu.categories.map((category) => ({
        ...category,
        items: category.items.map((item) => {
          const outletPrice = item.outletPricing[0];
          const isAvailable = outletPrice ? outletPrice.available : true;
          const price = outletPrice ? outletPrice.price : Number(item.basePrice);

          return {
            id: item.id,
            name: item.name,
            description: item.description,
            price,
            imageUrl: item.imageUrl,
            isVegetarian: item.isVegetarian,
            isSpicy: item.isSpicy,
            preparationTime: item.preparationTime,
            calories: item.calories,
            available: isAvailable,
            modifiers: item.modifiers.map((modifier) => ({
              id: modifier.id,
              name: modifier.name,
              type: modifier.type,
              required: modifier.required,
              minSelect: modifier.minSelect,
              maxSelect: modifier.maxSelect,
              options: modifier.options.map((option) => ({
                id: option.id,
                name: option.name,
                price: Number(option.priceAdjustment),
                isDefault: option.isDefault,
              })),
            })),
          };
        }),
      }));

      return {
        success: true,
        message: 'Menu retrieved successfully',
        data: {
          id: menu.id,
          name: menu.name,
          description: menu.description,
          restaurantId: menu.restaurantId,
          categories: transformedCategories,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch public menu');
    }
  }

  // ==================== HELPER METHODS ====================

  private async verifyRestaurantAccess(restaurantId: number, userId: number, userRole: string): Promise<boolean> {
    if (userRole === 'SUPER_ADMIN') {
      return true;
    }

    if (userRole === 'RESTAURANT_ADMIN') {
      const restaurantUser = await this.prisma.restaurantUser.findUnique({
        where: {
          restaurantId_userId: {
            restaurantId,
            userId,
          },
        },
      });
      return !!restaurantUser;
    }

    if (userRole === 'MANAGER') {
      // Check if user has access to any outlet in this restaurant
      const userOutlets = await this.prisma.outletUser.findMany({
        where: { userId },
        include: { outlet: true },
      });

      return userOutlets.some((uo) => uo.outlet.restaurantId === restaurantId);
    }

    return false;
  }
}
