import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { CartModuleService } from './cart-module.service';
import { AddCartItemDto, UpdateCartItemDto, GetCartDto } from './dto/cart-item.dto';
import { CustomerJwtAuthGuard } from '../customer-module/guards/customer-jwt-auth.guard';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    email: string;
    phone: string;
    type: string;
  };
}

@Controller('customers/cart')
@UseGuards(CustomerJwtAuthGuard)
export class CartModuleController {
  constructor(private readonly cartService: CartModuleService) {}

  /**
   * Get customer's cart for a specific outlet
   * GET /customers/cart?outletId=123
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getCart(@Req() req: AuthenticatedRequest, @Query('outletId') outletId: string) {
    const customerId = req.user.sub;

    if (!outletId) {
      // Return all carts if no outlet specified
      const carts = await this.cartService.getAllCustomerCarts(customerId);
      return {
        success: true,
        data: carts,
      };
    }

    const cart = await this.cartService.getCustomerCart(customerId, parseInt(outletId));

    return {
      success: true,
      data: cart,
    };
  }

  /**
   * Add item to cart (or update if exists)
   * POST /customers/cart/items
   */
  @Post('items')
  @HttpCode(HttpStatus.OK)
  async addCartItem(@Req() req: AuthenticatedRequest, @Body() dto: AddCartItemDto) {
    const customerId = req.user.sub;

    const cart = await this.cartService.addOrUpdateCartItem(customerId, dto);

    return {
      success: true,
      message: 'Item added to cart successfully',
      data: cart,
    };
  }

  /**
   * Update cart item quantity
   * PUT /customers/cart/items/:id
   */
  @Put('items/:id')
  @HttpCode(HttpStatus.OK)
  async updateCartItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') itemId: string,
    @Body() dto: UpdateCartItemDto
  ) {
    const customerId = req.user.sub;

    const cart = await this.cartService.updateCartItem(
      customerId,
      parseInt(itemId),
      dto
    );

    return {
      success: true,
      message: 'Cart item updated successfully',
      data: cart,
    };
  }

  /**
   * Remove item from cart
   * DELETE /customers/cart/items/:id
   */
  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  async removeCartItem(@Req() req: AuthenticatedRequest, @Param('id') itemId: string) {
    const customerId = req.user.sub;

    const cart = await this.cartService.removeCartItem(customerId, parseInt(itemId));

    return {
      success: true,
      message: 'Item removed from cart successfully',
      data: cart,
    };
  }

  /**
   * Clear cart for a specific outlet
   * DELETE /customers/cart?outletId=123
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearCart(@Req() req: AuthenticatedRequest, @Query('outletId') outletId: string) {
    const customerId = req.user.sub;

    if (!outletId) {
      return {
        success: false,
        message: 'outletId is required',
      };
    }

    const result = await this.cartService.clearCart(customerId, parseInt(outletId));

    return result;
  }
}
