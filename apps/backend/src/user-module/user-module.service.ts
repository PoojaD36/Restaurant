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
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS') || authConstants.BCRYPT_ROUNDS;
    const salt = await genSalt(saltRounds);
    const passwordHash = await hash(password, salt);

    const user = await this.prisma.user.create({
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
      include: {
        password: true,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get all users excluding superadmin with limited details
   */
  async getAllUsers(): Promise<any[]> {
    const users = await this.prisma.user.findMany({
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
    });

    return users.map(user => ({
      id: user.id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    }));
  }

  /**
   * Change user password
   */
  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
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
  async getUserById(userId: number): Promise<any> {
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
    };
  }

  // Placeholder methods for future CRUD operations
  findAll() {
    return this.getAllUsers();
  }

  findOne(id: number) {
    return this.getUserById(id);
  }
}
