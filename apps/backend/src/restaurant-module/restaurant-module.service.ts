import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { RestaurantStatus } from 'src/database/generated/prisma/enums';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { AddRestaurantUserDto } from './dto/add-restaurant-user.dto';

@Injectable()
export class RestaurantModuleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new restaurant and assign admin (Super Admin only)
   */
  async createRestaurant(
    createRestaurantDto: CreateRestaurantDto,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Check if restaurant with same slug exists
      const existingRestaurant = await this.prisma.restaurant.findUnique({
        where: { slug: createRestaurantDto.slug },
      });

      if (existingRestaurant) {
        throw new ConflictException('Restaurant with this slug already exists');
      }

      // Verify admin user exists and is RESTAURANT_ADMIN
      const adminUser = await this.prisma.user.findUnique({
        where: { id: createRestaurantDto.adminId },
      });

      if (!adminUser) {
        throw new BadRequestException('Admin user not found');
      }

      // Create restaurant and add admin to RestaurantUser junction
      await this.prisma.restaurant.create({
        data: {
          name: createRestaurantDto.name,
          slug: createRestaurantDto.slug,
          logo: createRestaurantDto.logo || null,
          description: createRestaurantDto.description || null,
          status: RestaurantStatus.ACTIVE,
          users: {
            create: {
              userId: createRestaurantDto.adminId,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Restaurant created successfully',
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Restaurant creation failed');
    }
  }

  /**
   * Get all restaurants with pagination
   */
  async getAllRestaurants(
    page: number = 1,
    limit: number = 10,
    userId?: number,
    userRole?: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const skip = (page - 1) * limit;

      // For RESTAURANT_ADMIN, only return their restaurants
      const whereClause =
        userRole === 'RESTAURANT_ADMIN' && userId
          ? {
              users: {
                some: {
                  userId: userId,
                },
              },
            }
          : undefined;

      const [restaurants, total] = await Promise.all([
        this.prisma.restaurant.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            description: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                outlets: true,
                users: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        this.prisma.restaurant.count({
          where: whereClause,
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Restaurants retrieved successfully',
        data: restaurants.map((r) => ({
          id: r.id.toString(),
          name: r.name,
          slug: r.slug,
          logo: r.logo,
          description: r.description,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          outletsCount: r._count.outlets,
          usersCount: r._count.users,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error in getAllRestaurants:', error);
      throw new BadRequestException('Failed to fetch restaurants');
    }
  }

  /**
   * Get restaurant by ID with users
   */
  async getRestaurantById(
    id: number,
    userId?: number,
    userRole?: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    try {
      // For RESTAURANT_ADMIN, verify they have access to this restaurant
      if (userRole === 'RESTAURANT_ADMIN' && userId) {
        const hasAccess = await this.prisma.restaurantUser.findUnique({
          where: {
            restaurantId_userId: {
              restaurantId: id,
              userId: userId,
            },
          },
        });

        if (!hasAccess) {
          throw new BadRequestException('Access denied to this restaurant');
        }
      }

      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id },
        include: {
          outlets: {
            select: {
              id: true,
              name: true,
              city: true,
              status: true,
            },
          },
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      if (!restaurant) {
        throw new BadRequestException('Restaurant not found');
      }

      return {
        success: true,
        message: 'Restaurant retrieved successfully',
        data: {
          id: restaurant.id.toString(),
          name: restaurant.name,
          slug: restaurant.slug,
          logo: restaurant.logo,
          description: restaurant.description,
          status: restaurant.status,
          createdAt: restaurant.createdAt.toISOString(),
          updatedAt: restaurant.updatedAt.toISOString(),
          outlets: restaurant.outlets.map((o) => ({
            id: o.id.toString(),
            name: o.name,
            city: o.city,
            status: o.status,
          })),
          users: restaurant.users.map((ru) => ({
            id: ru.user.id.toString(),
            firstName: ru.user.firstName,
            lastName: ru.user.lastName,
            email: ru.user.email,
            phone: ru.user.phone,
            role: ru.user.role,
          })),
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch restaurant');
    }
  }

  /**
   * Update restaurant
   */
  async updateRestaurant(
    id: number,
    updateRestaurantDto: UpdateRestaurantDto,
    userId?: number,
    userRole?: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // For RESTAURANT_ADMIN, verify they have access to this restaurant
      if (userRole === 'RESTAURANT_ADMIN' && userId) {
        const hasAccess = await this.prisma.restaurantUser.findUnique({
          where: {
            restaurantId_userId: {
              restaurantId: id,
              userId: userId,
            },
          },
        });

        if (!hasAccess) {
          throw new BadRequestException('Access denied to this restaurant');
        }
      }

      const existingRestaurant = await this.prisma.restaurant.findUnique({
        where: { id },
      });

      if (!existingRestaurant) {
        throw new BadRequestException('Restaurant not found');
      }

      // Check if new slug conflicts with existing restaurant
      if (
        updateRestaurantDto.slug &&
        updateRestaurantDto.slug !== existingRestaurant.slug
      ) {
        const slugExists = await this.prisma.restaurant.findUnique({
          where: { slug: updateRestaurantDto.slug },
        });

        if (slugExists) {
          throw new ConflictException('Slug already in use');
        }
      }

      await this.prisma.restaurant.update({
        where: { id },
        data: {
          ...(updateRestaurantDto.name && { name: updateRestaurantDto.name }),
          ...(updateRestaurantDto.slug && { slug: updateRestaurantDto.slug }),
          ...(updateRestaurantDto.logo !== undefined && {
            logo: updateRestaurantDto.logo || null,
          }),
          ...(updateRestaurantDto.description !== undefined && {
            description: updateRestaurantDto.description || null,
          }),
        },
      });

      return {
        success: true,
        message: 'Restaurant updated successfully',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException('Restaurant update failed');
    }
  }

  /**
   * Delete restaurant (Super Admin only)
   */
  async deleteRestaurant(id: number): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const existingRestaurant = await this.prisma.restaurant.findUnique({
        where: { id },
      });

      if (!existingRestaurant) {
        throw new BadRequestException('Restaurant not found');
      }

      await this.prisma.restaurant.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Restaurant deleted successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Restaurant deletion failed');
    }
  }

  /**
   * Add user to restaurant
   */
  async addUserToRestaurant(
    restaurantId: number,
    addRestaurantUserDto: AddRestaurantUserDto,
    requestingUserId?: number,
    requestingUserRole?: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // For RESTAURANT_ADMIN, verify they have access to this restaurant
      if (
        requestingUserRole === 'RESTAURANT_ADMIN' &&
        requestingUserId
      ) {
        const hasAccess = await this.prisma.restaurantUser.findUnique({
          where: {
            restaurantId_userId: {
              restaurantId: restaurantId,
              userId: requestingUserId,
            },
          },
        });

        if (!hasAccess) {
          throw new BadRequestException('Access denied to this restaurant');
        }
      }

      // Check if restaurant exists
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
      });

      if (!restaurant) {
        throw new BadRequestException('Restaurant not found');
      }

      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: addRestaurantUserDto.userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Check if user is already in restaurant
      const existingRelation = await this.prisma.restaurantUser.findUnique({
        where: {
          restaurantId_userId: {
            restaurantId: restaurantId,
            userId: addRestaurantUserDto.userId,
          },
        },
      });

      if (existingRelation) {
        throw new ConflictException('User is already in this restaurant');
      }

      // Add user to restaurant
      await this.prisma.restaurantUser.create({
        data: {
          restaurantId: restaurantId,
          userId: addRestaurantUserDto.userId,
        },
      });

      return {
        success: true,
        message: 'User added to restaurant successfully',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to add user to restaurant');
    }
  }

  /**
   * Remove user from restaurant
   */
  async removeUserFromRestaurant(
    restaurantId: number,
    userId: number,
    requestingUserId?: number,
    requestingUserRole?: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // For RESTAURANT_ADMIN, verify they have access to this restaurant
      if (
        requestingUserRole === 'RESTAURANT_ADMIN' &&
        requestingUserId
      ) {
        const hasAccess = await this.prisma.restaurantUser.findUnique({
          where: {
            restaurantId_userId: {
              restaurantId: restaurantId,
              userId: requestingUserId,
            },
          },
        });

        if (!hasAccess) {
          throw new BadRequestException('Access denied to this restaurant');
        }
      }

      // Check if relation exists
      const existingRelation = await this.prisma.restaurantUser.findUnique({
        where: {
          restaurantId_userId: {
            restaurantId: restaurantId,
            userId: userId,
          },
        },
      });

      if (!existingRelation) {
        throw new BadRequestException('User is not in this restaurant');
      }

      await this.prisma.restaurantUser.delete({
        where: {
          restaurantId_userId: {
            restaurantId: restaurantId,
            userId: userId,
          },
        },
      });

      return {
        success: true,
        message: 'User removed from restaurant successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to remove user from restaurant');
    }
  }

  /**
   * Get all users in a restaurant
   */
  async getRestaurantUsers(
    restaurantId: number,
    requestingUserId?: number,
    requestingUserRole?: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: any[];
  }> {
    try {
      // For RESTAURANT_ADMIN, verify they have access to this restaurant
      if (
        requestingUserRole === 'RESTAURANT_ADMIN' &&
        requestingUserId
      ) {
        const hasAccess = await this.prisma.restaurantUser.findUnique({
          where: {
            restaurantId_userId: {
              restaurantId: restaurantId,
              userId: requestingUserId,
            },
          },
        });

        if (!hasAccess) {
          throw new BadRequestException('Access denied to this restaurant');
        }
      }

      // Check if restaurant exists
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
      });

      if (!restaurant) {
        throw new BadRequestException('Restaurant not found');
      }

      const restaurantUsers = await this.prisma.restaurantUser.findMany({
        where: {
          restaurantId: restaurantId,
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
          createdAt: 'asc',
        },
      });

      return {
        success: true,
        message: 'Restaurant users retrieved successfully',
        data: restaurantUsers.map((ru) => ({
          id: ru.user.id.toString(),
          firstName: ru.user.firstName,
          lastName: ru.user.lastName,
          email: ru.user.email,
          phone: ru.user.phone,
          role: ru.user.role,
          status: ru.user.status,
          addedAt: ru.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch restaurant users');
    }
  }

  /**
   * Get restaurants accessible to a user (for dropdowns, etc.)
   * SUPER_ADMIN gets all restaurants, others only get their assigned restaurants
   */
  async getUserRestaurants(
    userId: number,
    userRole?: string,
  ): Promise<{
    success: boolean;
    message: string;
    data: any[];
  }> {
    try {
      // SUPER_ADMIN gets all restaurants
      const whereClause = userRole === 'SUPER_ADMIN'
        ? undefined
        : {
            users: {
              some: {
                userId: userId,
              },
            },
          };

      const restaurants = await this.prisma.restaurant.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          slug: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return {
        success: true,
        message: 'User restaurants retrieved successfully',
        data: restaurants.map((r) => ({
          id: r.id.toString(),
          name: r.name,
          slug: r.slug,
        })),
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch user restaurants');
    }
  }
}
