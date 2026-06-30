import { Controller, Post, Get, Put, Delete, Body, UseGuards, Request, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CustomerModuleService } from './customer-module.service';
import { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { AddAddressDto } from './dto/add-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('Customers')
@Controller('customers')
export class CustomerModuleController {
  constructor(private readonly customerService: CustomerModuleService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new customer',
    description: 'Create a new customer account with phone number and password. Returns JWT tokens for authentication.',
  })
  @ApiResponse({
    status: 201,
    description: 'Customer registered successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Customer registered successfully' },
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            customer: {
              type: 'object',
              properties: {
                customerId: { type: 'number', example: 1 },
                phone: { type: 'string', example: '+1234567890' },
                firstName: { type: 'string', example: 'John' },
                lastName: { type: 'string', example: 'Doe' },
                status: { type: 'string', example: 'ACTIVE' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed or phone already registered' })
  async register(@Body() registerDto: RegisterCustomerDto) {
    return this.customerService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login customer',
    description: 'Authenticate a customer with phone number and password. Returns JWT tokens for authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer logged in successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Login successful' },
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            customer: {
              type: 'object',
              properties: {
                customerId: { type: 'number', example: 1 },
                phone: { type: 'string', example: '+1234567890' },
                firstName: { type: 'string', example: 'John' },
                lastName: { type: 'string', example: 'Doe' },
                email: { type: 'string', example: 'john@example.com' },
                status: { type: 'string', example: 'ACTIVE' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials' })
  async login(@Body() loginDto: CustomerLoginDto) {
    return this.customerService.login(loginDto.identifier, loginDto.password);
  }

  @Get('profile')
  @UseGuards(CustomerJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get customer profile',
    description: 'Get the authenticated customer\'s profile information with saved addresses.',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Profile retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            customerId: { type: 'number', example: 1 },
            phone: { type: 'string', example: '+1234567890' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            email: { type: 'string', example: 'john@example.com' },
            status: { type: 'string', example: 'ACTIVE' },
            addresses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  addressType: { type: 'string', example: 'HOME' },
                  addressLine: { type: 'string', example: '123 Main St' },
                  city: { type: 'string', example: 'New York' },
                  state: { type: 'string', example: 'NY' },
                  postalCode: { type: 'string', example: '10001' },
                  isDefault: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async getProfile(@Request() req: any) {
    return this.customerService.getProfile(req.user.customerId);
  }

  @Put('profile')
  @UseGuards(CustomerJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update customer profile',
    description: 'Update the authenticated customer\'s profile information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer profile updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async updateProfile(@Request() req: any, @Body() updateDto: UpdateCustomerDto) {
    return this.customerService.updateProfile(req.user.customerId, updateDto);
  }

  @Post('addresses')
  @UseGuards(CustomerJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add new address',
    description: 'Add a new delivery address to the customer\'s profile. Address will be automatically geocoded.',
  })
  @ApiResponse({
    status: 201,
    description: 'Address added successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed or geocoding failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async addAddress(@Request() req: any, @Body() addressDto: AddAddressDto) {
    return this.customerService.addAddress(req.user.customerId, addressDto);
  }

  @Put('addresses/:addressId')
  @UseGuards(CustomerJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update address',
    description: 'Update an existing address. Address will be re-geocoded if address fields changed.',
  })
  @ApiParam({ name: 'addressId', description: 'Address ID', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Address updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async updateAddress(
    @Request() req: any,
    @Param('addressId') addressId: number,
    @Body() updateDto: UpdateAddressDto,
  ) {
    return this.customerService.updateAddress(req.user.customerId, +addressId, updateDto);
  }

  @Delete('addresses/:addressId')
  @UseGuards(CustomerJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete address',
    description: 'Delete an address from the customer\'s profile.',
  })
  @ApiParam({ name: 'addressId', description: 'Address ID', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Address deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async deleteAddress(@Request() req: any, @Param('addressId') addressId: number) {
    return this.customerService.deleteAddress(req.user.customerId, +addressId);
  }

  @Post('addresses/:addressId/default')
  @UseGuards(CustomerJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set default address',
    description: 'Set an address as the default delivery address.',
  })
  @ApiParam({ name: 'addressId', description: 'Address ID', example: '1' })
  @ApiResponse({
    status: 200,
    description: 'Default address updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async setDefaultAddress(@Request() req: any, @Param('addressId') addressId: number) {
    return this.customerService.setDefaultAddress(req.user.customerId, +addressId);
  }

  @Post('logout')
  @UseGuards(CustomerJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout customer',
    description: 'Logout the customer and invalidate their refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer logged out successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async logout(@Request() req: any) {
    return this.customerService.logout(req.user.customerId);
  }

  @Get('validate')
  @UseGuards(CustomerJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Validate customer token',
    description: 'Validate the customer JWT token and return customer information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async validateCustomer(@Request() req: any) {
    return this.customerService.validateCustomer(req.user.customerId);
  }
}
