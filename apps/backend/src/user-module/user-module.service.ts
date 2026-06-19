import { Injectable, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { hash, genSalt, compare } from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UserRole, UserStatus } from 'src/database/generated/prisma/enums';
import { authConstants } from '../auth/constants/auth.constants';

@Injectable()
export class UserModuleService {
  constructor(
    private readonly prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Create a new user (Super Admin only - role check at controller level)
   */
  async createUser(
    email: string,
    phone: string,
    password: string,
    firstName: string,
    lastName: string | null,
    role: UserRole,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS') || authConstants.BCRYPT_ROUNDS;
      const salt = await genSalt(saltRounds);
      const passwordHash = await hash(password, salt);

      await this.prisma.user.create({
        data: {
          email,
          phone,
          firstName,
          lastName,
          role,
          status: UserStatus.ACTIVE,
          password: {
            create: {
              passwordHash,
            },
          },
        },
      });

      return {
        success: true,
        message: 'User created successfully',
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('User creation failed');
    }
  }

  /**
   * Get all users excluding superadmin with limited details and pagination
   */
  async getAllUsers(page: number = 1, limit: number = 10): Promise<{
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

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where: {
            role: {
              not: UserRole.SUPER_ADMIN,
            },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        this.prisma.user.count({
          where: {
            role: {
              not: UserRole.SUPER_ADMIN,
            },
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Users retrieved successfully',
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw new BadRequestException('Failed to fetch users');
    }
  }

  /**
   * Change user password (with old password verification)
   * For regular users changing their own password
   */
  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const userPassword = await this.prisma.userPassword.findUnique({
        where: { userId },
      });

      if (!userPassword) {
        throw new BadRequestException('User password not found');
      }

      const isOldPasswordValid = await compare(oldPassword, userPassword.passwordHash);

      if (!isOldPasswordValid) {
        throw new UnauthorizedException('Old password is incorrect');
      }

      await this.updateUserPassword(userId, newPassword);

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Password change failed');
    }
  }

  /**
   * Change user password (admin reset - no old password needed)
   * For Super Admin changing another user's password
   */
  async changeUserPassword(userId: number, newPassword: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await this.updateUserPassword(userId, newPassword);

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      throw new BadRequestException('Password reset failed');
    }
  }

  /**
   * Shared password update logic
   */
  private async updateUserPassword(userId: number, newPassword: string): Promise<void> {
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS') || authConstants.BCRYPT_ROUNDS;
    const salt = await genSalt(saltRounds);
    const newPasswordHash = await hash(newPassword, salt);

    await this.prisma.userPassword.update({
      where: { userId },
      data: {
        passwordHash: newPasswordHash,
        passwordChangedAt: new Date(),
        refreshTokenHash: null, // Invalidate all sessions after password change
      },
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          profileImage: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      return {
        success: true,
        message: 'User retrieved successfully',
        data: {
          id: user.id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          profileImage: user.profileImage,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch user');
    }
  }

  // Placeholder methods for future CRUD operations
  findAll() {
    return this.getAllUsers();
  }

  findOne(id: number) {
    return this.getUserById(id);
  }
}
