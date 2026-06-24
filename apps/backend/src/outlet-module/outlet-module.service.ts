import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { OutletStatus } from 'src/database/generated/prisma/enums';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { AddOutletUserDto } from './dto/add-outlet-user.dto';
import { ApiResponse, PaginatedResponse, PaginationMeta } from '../common';
import { GeocodingService } from '../common';

@Injectable()
export class OutletModuleService {
  private readonly logger = new Logger(OutletModuleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geocodingService: GeocodingService,
  ) {}

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
   * Auto-add RESTAURANT_ADMIN and MANAGER users from restaurant to outlet
   * Called when creating a new outlet
   */
  private async autoAddOversightUsersToOutlet(
    outletId: number,
    restaurantId: number,
  ): Promise<void> {
    const oversightUsers = await this.prisma.restaurantUser.findMany({
      where: {
        restaurantId,
        user: {
          role: {
            in: ['RESTAURANT_ADMIN', 'MANAGER'],
          },
        },
      },
      select: {
        userId: true,
      },
    });

    if (oversightUsers.length > 0) {
      await this.prisma.outletUser.createMany({
        data: oversightUsers.map((ou) => ({
          outletId,
          userId: ou.userId,
        })),
        skipDuplicates: true,
      });
    }
  }

  /**
   * Create a new outlet with automatic geocoding
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

      // Build full address for geocoding
      const fullAddress = this.geocodingService.buildFullAddress({
        addressLine1: createOutletDto.addressLine1,
        addressLine2: createOutletDto.addressLine2,
        city: createOutletDto.city,
        state: createOutletDto.state,
        country: createOutletDto.country,
        postalCode: createOutletDto.postalCode,
      });

      let latitude: number;
      let longitude: number;

      // Check if user provided manual coordinates
      const manualCoordsProvided =
        (createOutletDto.latitude !== undefined && createOutletDto.latitude !== null && createOutletDto.latitude !== '') ||
        (createOutletDto.longitude !== undefined && createOutletDto.longitude !== null && createOutletDto.longitude !== '');

      if (manualCoordsProvided) {
        // Use manually provided coordinates
        if (!createOutletDto.latitude || createOutletDto.latitude === '') {
          throw new BadRequestException('Latitude is required when providing manual coordinates');
        }
        if (!createOutletDto.longitude || createOutletDto.longitude === '') {
          throw new BadRequestException('Longitude is required when providing manual coordinates');
        }
        latitude = parseFloat(createOutletDto.latitude);
        longitude = parseFloat(createOutletDto.longitude);
        this.logger.log(`Using manually provided coordinates for outlet: ${latitude}, ${longitude}`);
      } else {
        // Geocode address to get coordinates
        try {
          const coords = await this.geocodingService.geocodeAddress(fullAddress);
          latitude = coords.latitude;
          longitude = coords.longitude;
          this.logger.log(`Geocoded outlet address: ${fullAddress} -> ${latitude}, ${longitude}`);
        } catch (geocodeError) {
          this.logger.error(`Geocoding failed for outlet: ${fullAddress}. Error: ${geocodeError}`);
          throw new BadRequestException('Unable to geocode address. Please provide a valid address or manual coordinates.');
        }
      }

      const outlet = await this.prisma.outlet.create({
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
          latitude,
          longitude,
          openingTime: createOutletDto.openingTime || null,
          closingTime: createOutletDto.closingTime || null,
          status: OutletStatus.ACTIVE,
        },
      });

      await this.autoAddOversightUsersToOutlet(
        outlet.id,
        createOutletDto.restaurantId,
      );

      return {
        success: true,
        message: 'Outlet created successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Outlet creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Outlet creation failed';
      throw new BadRequestException(`${errorMessage}`);
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

      const pagination = new PaginationMeta(total, page, limit);

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
        pagination,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch outlets: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch outlets';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Get public outlets (no authentication required)
   * Only returns ACTIVE outlets for customer browsing
   */
  async getPublicOutlets(
    page: number = 1,
    limit: number = 10,
    restaurantId?: number,
  ): Promise<PaginatedResponse<any>> {
    try {
      const skip = (page - 1) * limit;

      let whereClause: any = {
        status: OutletStatus.ACTIVE,
      };

      if (restaurantId) {
        whereClause.restaurantId = restaurantId;
      }

      const [outlets, total] = await Promise.all([
        this.prisma.outlet.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            addressLine1: true,
            city: true,
            state: true,
            country: true,
            postalCode: true,
            latitude: true,
            longitude: true,
            openingTime: true,
            closingTime: true,
            status: true,
            restaurant: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
          skip,
          take: limit,
        }),
        this.prisma.outlet.count({
          where: whereClause,
        }),
      ]);

      const pagination = new PaginationMeta(total, page, limit);

      return {
        success: true,
        message: 'Outlets retrieved successfully',
        data: outlets.map((o) => ({
          id: o.id.toString(),
          name: o.name,
          phone: o.phone,
          email: o.email,
          addressLine1: o.addressLine1,
          city: o.city,
          state: o.state,
          country: o.country,
          postalCode: o.postalCode,
          latitude: parseFloat(o.latitude.toString()),
          longitude: parseFloat(o.longitude.toString()),
          openingTime: o.openingTime,
          closingTime: o.closingTime,
          status: o.status,
          restaurant: {
            id: o.restaurant.id.toString(),
            name: o.restaurant.name,
            slug: o.restaurant.slug,
            logo: o.restaurant.logo,
          },
        })),
        pagination,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch public outlets: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch public outlets';
      throw new BadRequestException(`${errorMessage}`);
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
      this.logger.error(`Failed to fetch outlet: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch outlet';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Update outlet with automatic geocoding if address changes
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

      // Check if any address fields have changed
      const addressFieldsChanged =
        (updateOutletDto.addressLine1 && updateOutletDto.addressLine1 !== existingOutlet.addressLine1) ||
        (updateOutletDto.addressLine2 !== undefined && updateOutletDto.addressLine2 !== existingOutlet.addressLine2) ||
        (updateOutletDto.city && updateOutletDto.city !== existingOutlet.city) ||
        (updateOutletDto.state && updateOutletDto.state !== existingOutlet.state) ||
        (updateOutletDto.country && updateOutletDto.country !== existingOutlet.country) ||
        (updateOutletDto.postalCode && updateOutletDto.postalCode !== existingOutlet.postalCode);

      // Convert Decimal to number for existing coordinates
      let latitude = parseFloat(existingOutlet.latitude.toString());
      let longitude = parseFloat(existingOutlet.longitude.toString());

      // Check if user provided manual coordinates
      const manualCoordsProvided =
        (updateOutletDto.latitude !== undefined && updateOutletDto.latitude !== null && updateOutletDto.latitude !== '') ||
        (updateOutletDto.longitude !== undefined && updateOutletDto.longitude !== null && updateOutletDto.longitude !== '');

      if (manualCoordsProvided) {
        // Use manually provided coordinates
        if (updateOutletDto.latitude && updateOutletDto.latitude !== '') {
          latitude = parseFloat(updateOutletDto.latitude);
        }
        if (updateOutletDto.longitude && updateOutletDto.longitude !== '') {
          longitude = parseFloat(updateOutletDto.longitude);
        }
        this.logger.log(`Using manually provided coordinates: ${latitude}, ${longitude}`);
      } else if (addressFieldsChanged) {
        // Re-geocode if address fields changed and no manual coordinates provided
        const fullAddress = this.geocodingService.buildFullAddress({
          addressLine1: updateOutletDto.addressLine1 || existingOutlet.addressLine1,
          addressLine2: (updateOutletDto.addressLine2 !== undefined ? updateOutletDto.addressLine2 : existingOutlet.addressLine2) || undefined,
          city: updateOutletDto.city || existingOutlet.city,
          state: updateOutletDto.state || existingOutlet.state,
          country: updateOutletDto.country || existingOutlet.country,
          postalCode: updateOutletDto.postalCode || existingOutlet.postalCode,
        });

        try {
          const coords = await this.geocodingService.geocodeAddress(fullAddress);
          latitude = coords.latitude;
          longitude = coords.longitude;
          this.logger.log(`Re-geocoded outlet address: ${fullAddress} -> ${latitude}, ${longitude}`);
        } catch (geocodeError) {
          this.logger.error(`Geocoding failed for outlet update: ${fullAddress}. Error: ${geocodeError}`);
          throw new BadRequestException('Unable to geocode address. Please provide a valid address or manual coordinates.');
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
          // Update coordinates if:
          // 1. Manual coordinates were provided, OR
          // 2. Address fields changed (auto-geocoded)
          ...((manualCoordsProvided || addressFieldsChanged) && {
            latitude,
            longitude,
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
      this.logger.error(`Outlet update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Outlet update failed';
      throw new BadRequestException(`${errorMessage}`);
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
      this.logger.error(`Outlet deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Outlet deletion failed';
      throw new BadRequestException(`${errorMessage}`);
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
      this.logger.error(`Failed to fetch outlets by restaurant: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch outlets by restaurant';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Get all users in an outlet
   */
  async getOutletUsers(
    outletId: number,
    requestingUserId?: number,
    requestingUserRole?: string,
  ): Promise<ApiResponse<any[]>> {
    try {
      const outlet = await this.prisma.outlet.findUnique({
        where: { id: outletId },
        include: { restaurant: true },
      });

      if (!outlet) {
        throw new BadRequestException('Outlet not found');
      }

      if (
        requestingUserRole === 'RESTAURANT_ADMIN' &&
        requestingUserId
      ) {
        const hasAccess = await this.verifyRestaurantAccess(
          outlet.restaurantId,
          requestingUserId,
        );

        if (!hasAccess) {
          throw new BadRequestException('Access denied to this outlet');
        }
      }

      const outletUsers = await this.prisma.outletUser.findMany({
        where: {
          outletId,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              role: true,
              status: true,
            },
          },
        },
        orderBy: {
          user: {
            role: 'asc',
          },
        },
      });

      return {
        success: true,
        message: 'Outlet users retrieved successfully',
        data: outletUsers.map((ou) => ({
          id: ou.user.id.toString(),
          firstName: ou.user.firstName,
          lastName: ou.user.lastName,
          email: ou.user.email,
          phone: ou.user.phone,
          role: ou.user.role,
          status: ou.user.status,
          addedAt: ou.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to fetch outlet users: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch outlet users';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Get users available for manual outlet assignment
   * Returns CHEF and DELIVERY_AGENT users who are in the restaurant but not yet in this outlet
   */
  async getAvailableOutletUsers(
    outletId: number,
    requestingUserId?: number,
    requestingUserRole?: string,
  ): Promise<ApiResponse<any[]>> {
    try {
      const outlet = await this.prisma.outlet.findUnique({
        where: { id: outletId },
      });

      if (!outlet) {
        throw new BadRequestException('Outlet not found');
      }

      if (
        requestingUserRole === 'RESTAURANT_ADMIN' &&
        requestingUserId
      ) {
        const hasAccess = await this.verifyRestaurantAccess(
          outlet.restaurantId,
          requestingUserId,
        );

        if (!hasAccess) {
          throw new BadRequestException('Access denied to this outlet');
        }
      }

      const existingOutletUsers = await this.prisma.outletUser.findMany({
        where: { outletId },
        select: { userId: true },
      });
      const existingUserIds = new Set(existingOutletUsers.map((ou) => ou.userId));

      const availableUsers = await this.prisma.restaurantUser.findMany({
        where: {
          restaurantId: outlet.restaurantId,
          userId: { notIn: Array.from(existingUserIds) },
          user: {
            role: {
              in: ['CHEF', 'DELIVERY_AGENT'],
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              status: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Available users retrieved successfully',
        data: availableUsers.map((ru) => ({
          id: ru.user.id.toString(),
          firstName: ru.user.firstName,
          lastName: ru.user.lastName,
          email: ru.user.email,
          role: ru.user.role,
          status: ru.user.status,
        })),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to fetch available users: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch available users';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Add user to outlet (manual assignment for CHEF/DELIVERY_AGENT)
   */
  async addUserToOutlet(
    outletId: number,
    addOutletUserDto: AddOutletUserDto,
    requestingUserId?: number,
    requestingUserRole?: string,
  ): Promise<ApiResponse> {
    try {
      const outlet = await this.prisma.outlet.findUnique({
        where: { id: outletId },
        include: { restaurant: true },
      });

      if (!outlet) {
        throw new BadRequestException('Outlet not found');
      }

      if (
        requestingUserRole === 'RESTAURANT_ADMIN' &&
        requestingUserId
      ) {
        const hasAccess = await this.verifyRestaurantAccess(
          outlet.restaurantId,
          requestingUserId,
        );

        if (!hasAccess) {
          throw new BadRequestException('Access denied to this outlet');
        }
      }

      const user = await this.prisma.user.findUnique({
        where: { id: addOutletUserDto.userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const restaurantUser = await this.prisma.restaurantUser.findUnique({
        where: {
          restaurantId_userId: {
            restaurantId: outlet.restaurantId,
            userId: addOutletUserDto.userId,
          },
        },
      });

      if (!restaurantUser) {
        throw new BadRequestException(
          'User must be added to the restaurant first',
        );
      }

      const existingRelation = await this.prisma.outletUser.findUnique({
        where: {
          outletId_userId: {
            outletId,
            userId: addOutletUserDto.userId,
          },
        },
      });

      if (existingRelation) {
        throw new ConflictException('User is already in this outlet');
      }

      await this.prisma.outletUser.create({
        data: {
          outletId,
          userId: addOutletUserDto.userId,
        },
      });

      return {
        success: true,
        message: 'User added to outlet successfully',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Failed to add user to outlet: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to add user to outlet';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Remove user from outlet
   */
  async removeUserFromOutlet(
    outletId: number,
    userId: number,
    requestingUserId?: number,
    requestingUserRole?: string,
  ): Promise<ApiResponse> {
    try {
      const outlet = await this.prisma.outlet.findUnique({
        where: { id: outletId },
      });

      if (!outlet) {
        throw new BadRequestException('Outlet not found');
      }

      if (
        requestingUserRole === 'RESTAURANT_ADMIN' &&
        requestingUserId
      ) {
        const hasAccess = await this.verifyRestaurantAccess(
          outlet.restaurantId,
          requestingUserId,
        );

        if (!hasAccess) {
          throw new BadRequestException('Access denied to this outlet');
        }
      }

      const existingRelation = await this.prisma.outletUser.findUnique({
        where: {
          outletId_userId: {
            outletId,
            userId,
          },
        },
      });

      if (!existingRelation) {
        throw new BadRequestException('User is not in this outlet');
      }

      await this.prisma.outletUser.delete({
        where: {
          outletId_userId: {
            outletId,
            userId,
          },
        },
      });

      return {
        success: true,
        message: 'User removed from outlet successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to remove user from outlet: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove user from outlet';
      throw new BadRequestException(`${errorMessage}`);
    }
  }
}
