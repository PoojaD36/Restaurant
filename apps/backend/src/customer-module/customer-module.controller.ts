import { Controller, Post, Get, Put, Delete, Body, UseGuards, Request, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CustomerModuleService } from './customer-module.service';
import { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { AddAddressDto } from './dto/add-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomerModuleController {
  constructor(private readonly customerService: CustomerModuleService) {}

  /**
   * Register new customer
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterCustomerDto) {
    return this.customerService.register(registerDto);
  }

  /**
   * Login customer
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: CustomerLoginDto) {
    return this.customerService.login(loginDto.identifier, loginDto.password);
  }

  /**
   * Get current customer profile with addresses
   */
  @UseGuards(CustomerJwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.customerService.getProfile(req.customerId);
  }

  /**
   * Update customer profile
   */
  @UseGuards(CustomerJwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req: any, @Body() updateDto: UpdateCustomerDto) {
    return this.customerService.updateProfile(req.customerId, updateDto);
  }

  /**
   * Add address to customer
   */
  @UseGuards(CustomerJwtAuthGuard)
  @Post('addresses')
  @HttpCode(HttpStatus.CREATED)
  async addAddress(@Request() req: any, @Body() addressDto: AddAddressDto) {
    return this.customerService.addAddress(req.customerId, addressDto);
  }

  /**
   * Update customer address
   */
  @UseGuards(CustomerJwtAuthGuard)
  @Put('addresses/:addressId')
  async updateAddress(
    @Request() req: any,
    @Param('addressId') addressId: number,
    @Body() updateDto: UpdateAddressDto,
  ) {
    return this.customerService.updateAddress(req.customerId, +addressId, updateDto);
  }

  /**
   * Delete customer address
   */
  @UseGuards(CustomerJwtAuthGuard)
  @Delete('addresses/:addressId')
  async deleteAddress(@Request() req: any, @Param('addressId') addressId: number) {
    return this.customerService.deleteAddress(req.customerId, +addressId);
  }

  /**
   * Set default address
   */
  @UseGuards(CustomerJwtAuthGuard)
  @Post('addresses/:addressId/default')
  @HttpCode(HttpStatus.OK)
  async setDefaultAddress(@Request() req: any, @Param('addressId') addressId: number) {
    return this.customerService.setDefaultAddress(req.customerId, +addressId);
  }

  /**
   * Logout customer
   */
  @UseGuards(CustomerJwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any) {
    return this.customerService.logout(req.customerId);
  }

  /**
   * Validate customer endpoint (for JWT strategy)
   */
  @UseGuards(CustomerJwtAuthGuard)
  @Get('validate')
  async validateCustomer(@Request() req: any) {
    return this.customerService.validateCustomer(req.customerId);
  }
}
