import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { OutletStatus } from 'src/database/generated/prisma/enums';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { ApiResponse, PaginatedResponse } from '../common';

@Injectable()
export class OutletModuleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user has access to restaurant (for RESTAURANT_ADMIN)
   */
  private async verifyRestaurantAccess(
    restaurantId: number,
    userId: number,
  ): Promise<boolean> {
    const restaurantUser = await this.prisma.restaurantUser.findUnique({
      where: {
        restaurantId_userId: {
          restaurantId: restaurantId,
          userId: userId,
        },
      },
    });

    return !!restaurantUser;
  }

  /**
   * Create a new outlet
   */
  async createOutlet(
    createOutletDto: CreateOutletDto,
    requestingUserId?: number,
    requestingUserRole?: string,
  ): Promise<ApiResponse> {
    try {
      // For RESTAURANT_ADMIN, verify they have access to the restaurant
      if (
        requestingUserRole === 'RESTAURANT_ADMIN' &&
        requestingUserId
      ) {
        const hasAccess = await this.verifyRestaurantAccess(
          createOutletDto.restaurantId,
          requestingUserId,
        );

        if (!hasAccess) {
          throw new BadRequestException('Access denied to this restaurant');
        }
      }

      // Verify restaurant exists
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: createOutletDto.restaurantId },
      });

      if (!restaurant) {
        throw new BadRequestException('Restaurant not found');
      }

      await this.prisma.outlet.create({
        data: {
          restaurantId: createOutletDto.restaurantId,
          name: createOutletDto.name,
          phone: createOutletDto.phone || null,
          email: createOutletDto.email || null,
          addressLine1: createOutletDto.addressLine1,
          addressLine2: createOutletDto.addressLine2 || null,
          city: createOutletDto.city,
          state: createOutletDto.state,
          country: createOutletDto.country,
          postalCode: createOutletDto.postalCode,
          latitude: createOutletDto.latitude
            ? parseFloat(createOutletDto.latitude)
            : null,
          longitude: createOutletDto.longitude
            ? parseFloat(createOutletDto.longitude)
            : null,
          openingTime: createOutletDto.openingTime || null,
          closingTime: createOutletDto.closingTime || null,
          status: OutletStatus.ACTIVE,
        },
      });

      return {
        success: true,
        message: 'Outlet created successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Outlet creation failed');
    }
  }

  /**
   * Get all outlets with pagination and optional restaurant filter
   */
  async getAllOutlets(
    page: number = 1,
    limit: number = 10,
    restaurantId?: number,
    userId?: number,
    userRole?: string,
  ): Promise<PaginatedResponse<any>> {
    try {
      const skip = (page - 1) * limit;

      let whereClause: any = {};

      // Filter by restaurant if provided
      if (restaurantId) {
        whereClause.restaurantId = restaurantId;
      }

      // For RESTAURANT_ADMIN, only show outlets from their restaurants
      if (userRole === 'RESTAURANT_ADMIN' && userId && !restaurantId) {
        const userRestaurants = await this.prisma.restaurantUser.findMany({
          where: { userId },
          select: { restaurantId: true },
        });

        whereClause.restaurantId = {
          in: userRestaurants.map((ur) => ur.restaurantId),
        };
      }

      const [outlets, total] = await Promise.all([
        this.prisma.outlet.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            city: true,
            state: true,
            country: true,
            postalCode: true,
            openingTime: true,
            closingTime: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            restaurant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        this.prisma.outlet.count({
          where: whereClause,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Outlets retrieved successfully',
        data: outlets.map((o) => ({
          id: o.id.toString(),
          name: o.name,
          phone: o.phone,
          email: o.email,
          city: o.city,
          state: o.state,
          country: o.country,
          postalCode: o.postalCode,
          openingTime: o.openingTime,
          closingTime: o.closingTime,
          status: o.status,
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
          restaurant: {
            id: o.restaurant.id.toString(),
            name: o.restaurant.name,
            slug: o.restaurant.slug,
          },
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error in getAllOutlets:', error);
      throw new BadRequestException('Failed to fetch outlets');
    }
  }

  /**
   * Get outlet by ID
   */
  async getOutletById(id: number): Promise<ApiResponse<any>> {
    try {
      const outlet = await this.prisma.outlet.findUnique({
        where: { id },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      if (!outlet) {
        throw new BadRequestException('Outlet not found');
      }

      return {
        success: true,
        message: 'Outlet retrieved successfully',
        data: {
          id: outlet.id.toString(),
          name: outlet.name,
          phone: outlet.phone,
          email: outlet.email,
          addressLine1: outlet.addressLine1,
          addressLine2: outlet.addressLine2,
          city: outlet.city,
          state: outlet.state,
          country: outlet.country,
          postalCode: outlet.postalCode,
          latitude: outlet.latitude?.toString(),
          longitude: outlet.longitude?.toString(),
          openingTime: outlet.openingTime,
          closingTime: outlet.closingTime,
          status: outlet.status,
          createdAt: outlet.createdAt.toISOString(),
          updatedAt: outlet.updatedAt.toISOString(),
          restaurant: {
            id: outlet.restaurant.id.toString(),
            name: outlet.restaurant.name,
            slug: outlet.restaurant.slug,
          },
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch outlet');
    }
  }

  /**
   * Update outlet
   */
  async updateOutlet(
    id: number,
    updateOutletDto: UpdateOutletDto,
    requestingUserId?: number,
    requestingUserRole?: string,
  ): Promise<ApiResponse> {
    try {
      const existingOutlet = await this.prisma.outlet.findUnique({
        where: { id },
      });

      if (!existingOutlet) {
        throw new BadRequestException('Outlet not found');
      }

      // For RESTAURANT_ADMIN, verify they have access to the restaurant
      if (
        requestingUserRole === 'RESTAURANT_ADMIN' &&
        requestingUserId
      ) {
        const hasAccess = await this.verifyRestaurantAccess(
          existingOutlet.restaurantId,
          requestingUserId,
        );

        if (!hasAccess) {
          throw new BadRequestException('Access denied to this outlet');
        }
      }

      await this.prisma.outlet.update({
        where: { id },
        data: {
          ...(updateOutletDto.name && { name: updateOutletDto.name }),
          ...(updateOutletDto.phone !== undefined && {
            phone: updateOutletDto.phone || null,
          }),
          ...(updateOutletDto.email !== undefined && {
            email: updateOutletDto.email || null,
          }),
          ...(updateOutletDto.addressLine1 && {
            addressLine1: updateOutletDto.addressLine1,
          }),
          ...(updateOutletDto.addressLine2 !== undefined && {
            addressLine2: updateOutletDto.addressLine2 || null,
          }),
          ...(updateOutletDto.city && { city: updateOutletDto.city }),
          ...(updateOutletDto.state && { state: updateOutletDto.state }),
          ...(updateOutletDto.country && { country: updateOutletDto.country }),
          ...(updateOutletDto.postalCode && {
            postalCode: updateOutletDto.postalCode,
          }),
          ...(updateOutletDto.latitude !== undefined && {
            latitude: updateOutletDto.latitude
              ? parseFloat(updateOutletDto.latitude)
              : null,
          }),
          ...(updateOutletDto.longitude !== undefined && {
            longitude: updateOutletDto.longitude
              ? parseFloat(updateOutletDto.longitude)
              : null,
          }),
          ...(updateOutletDto.openingTime !== undefined && {
            openingTime: updateOutletDto.openingTime || null,
          }),
          ...(updateOutletDto.closingTime !== undefined && {
            closingTime: updateOutletDto.closingTime || null,
          }),
        },
      });

      return {
        success: true,
        message: 'Outlet updated successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Outlet update failed');
    }
  }

  /**
   * Delete outlet
   */
  async deleteOutlet(
    id: number,
    requestingUserId?: number,
    requestingUserRole?: string,
  ): Promise<ApiResponse> {
    try {
      const existingOutlet = await this.prisma.outlet.findUnique({
        where: { id },
      });

      if (!existingOutlet) {
        throw new BadRequestException('Outlet not found');
      }

      // For RESTAURANT_ADMIN, verify they have access to the restaurant
      if (
        requestingUserRole === 'RESTAURANT_ADMIN' &&
        requestingUserId
      ) {
        const hasAccess = await this.verifyRestaurantAccess(
          existingOutlet.restaurantId,
          requestingUserId,
        );

        if (!hasAccess) {
          throw new BadRequestException('Access denied to this outlet');
        }
      }

      await this.prisma.outlet.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Outlet deleted successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Outlet deletion failed');
    }
  }

  /**
   * Get all outlets for a specific restaurant
   */
  async getOutletsByRestaurant(
    restaurantId: number,
    requestingUserId?: number,
    requestingUserRole?: string,
  ): Promise<ApiResponse<any[]>> {
    try {
      // For RESTAURANT_ADMIN, verify they have access to the restaurant
      if (
        requestingUserRole === 'RESTAURANT_ADMIN' &&
        requestingUserId
      ) {
        const hasAccess = await this.verifyRestaurantAccess(
          restaurantId,
          requestingUserId,
        );

        if (!hasAccess) {
          throw new BadRequestException('Access denied to this restaurant');
        }
      }

      // Verify restaurant exists
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
      });

      if (!restaurant) {
        throw new BadRequestException('Restaurant not found');
      }

      const outlets = await this.prisma.outlet.findMany({
        where: {
          restaurantId: restaurantId,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          city: true,
          state: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        success: true,
        message: 'Outlets retrieved successfully',
        data: outlets.map((o) => ({
          id: o.id.toString(),
          name: o.name,
          phone: o.phone,
          city: o.city,
          state: o.state,
          status: o.status,
          createdAt: o.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch outlets');
    }
  }
}
