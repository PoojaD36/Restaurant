import { Injectable, UnauthorizedException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { hash, compare } from 'bcrypt';
import { CustomerJwtPayload } from './interfaces/customer-jwt-payload.interface';
import { CustomerStatus } from 'src/database/generated/prisma/enums';
import { customerAuthConstants } from './constants/customer-auth.constants';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { AddAddressDto } from './dto/add-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { GeocodingService } from '../common';

@Injectable()
export class CustomerModuleService {
  private readonly logger = new Logger(CustomerModuleService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private geocodingService: GeocodingService,
  ) {}

  /**
   * Register new customer
   */
  async register(registerDto: RegisterCustomerDto): Promise<{
    success: boolean;
    message: string;
    accessToken: string;
    refreshToken: string;
    customer: any;
  }> {
    try {
      const { firstName, lastName, email, phone, password } = registerDto;

      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          OR: [
            ...(email ? [{ email }] : []),
            { phone },
          ],
        },
      });

      if (existingCustomer) {
        if (existingCustomer.email === email) {
          throw new ConflictException('Email already registered');
        }
        if (existingCustomer.phone === phone) {
          throw new ConflictException('Phone number already registered');
        }
      }

      const passwordHash = await hash(
        password,
        this.configService.get<number>('BCRYPT_ROUNDS') || customerAuthConstants.BCRYPT_ROUNDS,
      );

      const customer = await this.prisma.customer.create({
        data: {
          firstName,
          lastName,
          email: email || null,
          phone,
          status: CustomerStatus.ACTIVE,
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

      const tokens = await this.generateTokens(customer);

      const { password: _, ...customerWithoutPassword } = customer;

      return {
        success: true,
        message: 'Registration successful',
        ...tokens,
        customer: customerWithoutPassword,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Login customer with email/phone and password
   */
  async login(identifier: string, password: string): Promise<{
    success: boolean;
    message: string;
    accessToken: string;
    refreshToken: string;
    customer: any;
  }> {
    try {
      const customer = await this.prisma.customer.findFirst({
        where: {
          OR: [
            { email: identifier },
            { phone: identifier },
          ],
        },
        include: {
          password: true,
        },
      });

      if (!customer || !customer.password) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (customer.status === CustomerStatus.BLOCKED) {
        throw new UnauthorizedException('Account is blocked');
      }

      if (customer.status === CustomerStatus.INACTIVE) {
        throw new UnauthorizedException('Account is inactive');
      }

      await this.checkAccountLock(customer.password);

      const isPasswordValid = await compare(password, customer.password.passwordHash);

      if (!isPasswordValid) {
        await this.handleFailedLogin(customer.password);
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.handleSuccessfulLogin(customer.password);

      const tokens = await this.generateTokens(customer);

      return {
        success: true,
        message: 'Login successful',
        ...tokens,
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          profileImage: customer.profileImage,
          status: customer.status,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      throw new UnauthorizedException(`${errorMessage}`);
    }
  }

  /**
   * Validate customer for JWT strategy
   */
  async validateCustomer(customerId: number): Promise<{
    success: boolean;
    message: string;
    customer: any;
  }> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profileImage: true,
          status: true,
        },
      });

      if (!customer || customer.status !== CustomerStatus.ACTIVE) {
        throw new UnauthorizedException('Customer not found or inactive');
      }

      return {
        success: true,
        message: 'Customer validated successfully',
        customer,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Customer validation failed');
    }
  }

  /**
   * Get customer profile with addresses
   */
  async getProfile(customerId: number): Promise<{
    success: boolean;
    message: string;
    customer: any;
  }> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          addresses: {
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
          },
        },
      });

      if (!customer) {
        throw new UnauthorizedException('Customer not found');
      }

      return {
        success: true,
        message: 'Profile retrieved successfully',
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          profileImage: customer.profileImage,
          status: customer.status,
          addresses: customer.addresses,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve profile';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Update customer profile
   */
  async updateProfile(customerId: number, updateDto: UpdateCustomerDto): Promise<{
    success: boolean;
    message: string;
    customer: any;
  }> {
    try {
      const customer = await this.prisma.customer.update({
        where: { id: customerId },
        data: updateDto,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profileImage: true,
          status: true,
        },
      });

      return {
        success: true,
        message: 'Profile updated successfully',
        customer,
      };
    } catch (error) {
      this.logger.error(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Add address to customer with automatic geocoding
   */
  async addAddress(customerId: number, addressDto: AddAddressDto): Promise<{
    success: boolean;
    message: string;
    address: any;
  }> {
    try {
      if (addressDto.isDefault) {
        await this.prisma.customerAddress.updateMany({
          where: { customerId },
          data: { isDefault: false },
        });
      }

      // Build full address for geocoding
      const fullAddress = this.geocodingService.buildFullAddress({
        addressLine1: addressDto.addressLine1,
        addressLine2: addressDto.addressLine2,
        city: addressDto.city,
        state: addressDto.state,
        country: addressDto.country,
        postalCode: addressDto.postalCode,
      });

      // Geocode address to get coordinates (required field)
      let latitude: number;
      let longitude: number;

      try {
        const coords = await this.geocodingService.geocodeAddress(fullAddress);
        latitude = coords.latitude;
        longitude = coords.longitude;
        this.logger.log(`Geocoded customer address: ${fullAddress} -> ${latitude}, ${longitude}`);
      } catch (geocodeError) {
        this.logger.error(`Geocoding failed for customer address: ${fullAddress}. Error: ${geocodeError}`);
        throw new BadRequestException('Unable to geocode address. Please provide a valid address.');
      }

      const address = await this.prisma.customerAddress.create({
        data: {
          label: addressDto.label,
          name: addressDto.name,
          phone: addressDto.phone,
          addressLine1: addressDto.addressLine1,
          addressLine2: addressDto.addressLine2 || null,
          city: addressDto.city,
          state: addressDto.state,
          country: addressDto.country,
          postalCode: addressDto.postalCode,
          latitude,
          longitude,
          isDefault: addressDto.isDefault || false,
          customerId,
        },
      });

      return {
        success: true,
        message: 'Address added successfully',
        address,
      };
    } catch (error) {
      // Re-throw HTTP exceptions directly without wrapping
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to add address. Error: ${error}`, error?.['stack']);
      throw new BadRequestException(`Failed to add address: ${error?.['message'] || error}`);
    }
  }

  /**
   * Update customer address with automatic geocoding if address changes
   */
  async updateAddress(
    customerId: number,
    addressId: number,
    updateDto: UpdateAddressDto,
  ): Promise<{
    success: boolean;
    message: string;
    address: any;
  }> {
    try {
      const address = await this.prisma.customerAddress.findFirst({
        where: {
          id: addressId,
          customerId,
        },
      });

      if (!address) {
        throw new UnauthorizedException('Address not found');
      }

      if (updateDto.isDefault) {
        await this.prisma.customerAddress.updateMany({
          where: { customerId },
          data: { isDefault: false },
        });
      }

      // Check if any address fields have changed
      const addressFieldsChanged =
        (updateDto.addressLine1 && updateDto.addressLine1 !== address.addressLine1) ||
        (updateDto.addressLine2 !== undefined && updateDto.addressLine2 !== address.addressLine2) ||
        (updateDto.city && updateDto.city !== address.city) ||
        (updateDto.state && updateDto.state !== address.state) ||
        (updateDto.country && updateDto.country !== address.country) ||
        (updateDto.postalCode && updateDto.postalCode !== address.postalCode);

      let latitude = parseFloat(address.latitude.toString());
      let longitude = parseFloat(address.longitude.toString());

      // Re-geocode if address fields changed
      if (addressFieldsChanged) {
        const fullAddress = this.geocodingService.buildFullAddress({
          addressLine1: updateDto.addressLine1 || address.addressLine1,
          addressLine2: (updateDto.addressLine2 !== undefined ? updateDto.addressLine2 : address.addressLine2) || undefined,
          city: updateDto.city || address.city,
          state: updateDto.state || address.state,
          country: updateDto.country || address.country,
          postalCode: updateDto.postalCode || address.postalCode,
        });

        try {
          const coords = await this.geocodingService.geocodeAddress(fullAddress);
          latitude = coords.latitude;
          longitude = coords.longitude;
          this.logger.log(`Re-geocoded customer address: ${fullAddress} -> ${latitude}, ${longitude}`);
        } catch (geocodeError) {
          this.logger.error(`Geocoding failed for customer address update: ${fullAddress}. Error: ${geocodeError}`);
          throw new BadRequestException('Unable to geocode address. Please provide a valid address.');
        }
      }

      const updatedAddress = await this.prisma.customerAddress.update({
        where: { id: addressId },
        data: {
          ...(updateDto.label !== undefined && { label: updateDto.label }),
          ...(updateDto.name !== undefined && { name: updateDto.name }),
          ...(updateDto.phone !== undefined && { phone: updateDto.phone }),
          ...(updateDto.addressLine1 && { addressLine1: updateDto.addressLine1 }),
          ...(updateDto.addressLine2 !== undefined && { addressLine2: updateDto.addressLine2 || null }),
          ...(updateDto.city && { city: updateDto.city }),
          ...(updateDto.state && { state: updateDto.state }),
          ...(updateDto.country && { country: updateDto.country }),
          ...(updateDto.postalCode && { postalCode: updateDto.postalCode }),
          ...(updateDto.isDefault !== undefined && { isDefault: updateDto.isDefault }),
          // Always update coordinates if address changed
          ...(addressFieldsChanged && {
            latitude,
            longitude,
          }),
        },
      });

      return {
        success: true,
        message: 'Address updated successfully',
        address: updatedAddress,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update address: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to update address';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Delete customer address
   */
  async deleteAddress(customerId: number, addressId: number): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const address = await this.prisma.customerAddress.findFirst({
        where: {
          id: addressId,
          customerId,
        },
      });

      if (!address) {
        throw new UnauthorizedException('Address not found');
      }

      await this.prisma.customerAddress.delete({
        where: { id: addressId },
      });

      return {
        success: true,
        message: 'Address deleted successfully',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Failed to delete address: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete address';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Set default address
   */
  async setDefaultAddress(customerId: number, addressId: number): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const address = await this.prisma.customerAddress.findFirst({
        where: {
          id: addressId,
          customerId,
        },
      });

      if (!address) {
        throw new UnauthorizedException('Address not found');
      }

      await this.prisma.$transaction([
        this.prisma.customerAddress.updateMany({
          where: { customerId },
          data: { isDefault: false },
        }),
        this.prisma.customerAddress.update({
          where: { id: addressId },
          data: { isDefault: true },
        }),
      ]);

      return {
        success: true,
        message: 'Default address updated successfully',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Failed to set default address: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to set default address';
      throw new BadRequestException(`${errorMessage}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{
    success: boolean;
    message: string;
    accessToken: string;
    refreshToken: string;
    customer: any;
  }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const customer = await this.prisma.customer.findUnique({
        where: { id: payload.sub },
        include: { password: true },
      });

      if (!customer || !customer.password || customer.password.refreshTokenHash !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(customer);

      return {
        success: true,
        message: 'Token refreshed successfully',
        ...tokens,
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          profileImage: customer.profileImage,
          status: customer.status,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      throw new UnauthorizedException(`${errorMessage}`);
    }
  }

  /**
   * Logout customer by clearing refresh token
   */
  async logout(customerId: number): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await this.prisma.customerPassword.update({
        where: { customerId },
        data: { refreshTokenHash: null },
      });

      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error) {
      this.logger.error(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      throw new UnauthorizedException(`${errorMessage}`);
    }
  }

  /**
   * Generate JWT tokens for customer
   */
  private async generateTokens(customer: any): Promise<{ accessToken: string; refreshToken: string; customer: any }> {
    try {
      const payload: CustomerJwtPayload = {
        sub: customer.id,
        email: customer.email || undefined,
        phone: customer.phone,
        type: 'customer',
      };

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('CUSTOMER_JWT_SECRET') || customerAuthConstants.JWT_SECRET,
        expiresIn: (this.configService.get<string>('CUSTOMER_REFRESH_TOKEN_EXPIRES_IN') || customerAuthConstants.REFRESH_TOKEN_EXPIRES_IN) as any,
      });

      await this.prisma.customerPassword.update({
        where: { customerId: customer.id },
        data: { refreshTokenHash: refreshToken },
      });

      return {
        accessToken,
        refreshToken,
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          profileImage: customer.profileImage,
          status: customer.status,
        },
      };
    } catch (error) {
      this.logger.error(`Token generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Token generation failed';
      throw new UnauthorizedException(`${errorMessage}`);
    }
  }

  /**
   * Check if account is locked
   */
  private async checkAccountLock(customerPassword: any): Promise<void> {
    try {
      if (customerPassword.lockedUntil && customerPassword.lockedUntil > new Date()) {
        throw new UnauthorizedException('Account is locked due to too many failed attempts. Please try again later.');
      }

      if (customerPassword.lockedUntil && customerPassword.lockedUntil <= new Date() && customerPassword.failedAttempts > 0) {
        await this.prisma.customerPassword.update({
          where: { id: customerPassword.id },
          data: {
            failedAttempts: 0,
            lockedUntil: null,
          },
        });
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Account lock check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Account lock check failed';
      throw new UnauthorizedException(`${errorMessage}`);
    }
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(customerPassword: any): Promise<void> {
    try {
      const maxAttempts = this.configService.get<number>('CUSTOMER_MAX_LOGIN_ATTEMPTS') || customerAuthConstants.MAX_LOGIN_ATTEMPTS;
      const lockDurationMinutes = this.configService.get<number>('CUSTOMER_LOCK_DURATION_MINUTES') || customerAuthConstants.LOCK_DURATION_MINUTES;

      const newFailedAttempts = customerPassword.failedAttempts + 1;
      const updateData: any = {
        failedAttempts: newFailedAttempts,
      };

      if (newFailedAttempts >= maxAttempts) {
        const lockedUntil = new Date();
        lockedUntil.setMinutes(lockedUntil.getMinutes() + lockDurationMinutes);
        updateData.lockedUntil = lockedUntil;
      }

      await this.prisma.customerPassword.update({
        where: { id: customerPassword.id },
        data: updateData,
      });
    } catch (error) {
      this.logger.error(`Failed login tracking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed login tracking failed';
      throw new UnauthorizedException(`${errorMessage}`);
    }
  }

  /**
   * Handle successful login
   */
  private async handleSuccessfulLogin(customerPassword: any): Promise<void> {
    try {
      await this.prisma.customerPassword.update({
        where: { id: customerPassword.id },
        data: {
          failedAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Login tracking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error && error.stack) {
        this.logger.debug(`Error stack: ${error.stack}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Login tracking failed';
      throw new UnauthorizedException(`${errorMessage}`);
    }
  }
}
