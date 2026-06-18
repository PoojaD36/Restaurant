import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { hash, genSalt, compare } from 'bcrypt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserRole, UserStatus } from 'src/database/generated/prisma/enums';
import { authConstants } from './constants/auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Create a new user (only for authenticated Super Admin)
   * Role check is handled by @Roles() decorator and RolesGuard at controller level
   */
  async createUser(
    email: string,
    phone: string,
    password: string,
    firstName: string,
    lastName: string | null | undefined,
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

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Login user with email/phone and password
   */
  async login(identifier: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
      include: {
        password: true,
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account is suspended');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Account is inactive');
    }

    await this.checkAccountLock(user.password);

    const isPasswordValid = await compare(password, user.password.passwordHash);

    if (!isPasswordValid) {
      await this.handleFailedLogin(user.password);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.handleSuccessfulLogin(user.password);

    return this.generateTokens(user);
  }

  /**
   * Validate user for JWT strategy
   */
  async validateUser(userId: number): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        profileImage: true,
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { password: true },
      });

      if (!user || !user.password || user.password.refreshTokenHash !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout user by clearing refresh token
   */
  async logout(userId: number): Promise<void> {
    await this.prisma.userPassword.update({
      where: { userId },
      data: { refreshTokenHash: null, lastLoginAt: new Date() },
    });
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
        refreshTokenHash: null,
      },
    });
  }

  /**
   * Generate JWT tokens for user
   */
  private async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: (this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN') || authConstants.REFRESH_TOKEN_EXPIRES_IN) as any,
    });

    await this.prisma.userPassword.update({
      where: { userId: user.id },
      data: { refreshTokenHash: refreshToken },
    });

    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }

  /**
   * Check if account is locked
   */
  private async checkAccountLock(userPassword: any): Promise<void> {
    if (userPassword.lockedUntil && userPassword.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is locked due to too many failed attempts. Please try again later.');
    }

    if (userPassword.lockedUntil && userPassword.lockedUntil <= new Date() && userPassword.failedAttempts > 0) {
      await this.prisma.userPassword.update({
        where: { id: userPassword.id },
        data: {
          failedAttempts: 0,
          lockedUntil: null,
        },
      });
    }
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(userPassword: any): Promise<void> {
    const maxAttempts = this.configService.get<number>('MAX_LOGIN_ATTEMPTS') || authConstants.MAX_LOGIN_ATTEMPTS;
    const lockDurationMinutes = this.configService.get<number>('LOCK_DURATION_MINUTES') || authConstants.LOCK_DURATION_MINUTES;

    const newFailedAttempts = userPassword.failedAttempts + 1;
    const updateData: any = {
      failedAttempts: newFailedAttempts,
    };

    if (newFailedAttempts >= maxAttempts) {
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + lockDurationMinutes);
      updateData.lockedUntil = lockedUntil;
    }

    await this.prisma.userPassword.update({
      where: { id: userPassword.id },
      data: updateData,
    });
  }

  /**
   * Handle successful login
   */
  private async handleSuccessfulLogin(userPassword: any): Promise<void> {
    await this.prisma.userPassword.update({
      where: { id: userPassword.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });
  }
}
