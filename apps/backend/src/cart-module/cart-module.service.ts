import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart-item.dto';

@Injectable()
export class CartModuleService {
  private readonly logger = new Logger(CartModuleService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get customer's cart for a specific outlet
   * @param customerId Customer ID
   * @param outletId Outlet ID
   * @returns Cart with items
   */
  async getCustomerCart(customerId: number, outletId: number) {
    let cart = await this.prisma.customerCart.findUnique({
      where: {
        customerId_outletId: {
          customerId,
          outletId,
        },
      },
      include: {
        items: true,
      },
    });

    // If cart doesn't exist, return empty cart
    if (!cart) {
      return {
        id: null,
        outletId,
        outletName: null,
        outletAddress: null,
        items: [],
        subtotal: 0,
      };
    }

    // Calculate subtotal
    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

    return {
      id: cart.id,
      outletId: cart.outletId,
      outletName: cart.outletName,
      outletAddress: cart.outletAddress,
      items: cart.items.map((item) => ({
        ...item,
        price: Number(item.price),
      })),
      subtotal: Math.round(subtotal * 100) / 100,
    };
  }

  /**
   * Add or update item in customer's cart
   * @param customerId Customer ID
   * @param dto Cart item data
   * @returns Updated cart
   */
  async addOrUpdateCartItem(customerId: number, dto: AddCartItemDto) {
    const { outletId, menuItemId, name, price, quantity, modifiers, outletName, outletAddress } = dto;

    // Check if item with same modifiers exists in cart
    const cart = await this.prisma.customerCart.findUnique({
      where: {
        customerId_outletId: {
          customerId,
          outletId,
        },
      },
      include: {
        items: true,
      },
    });

    // Convert modifiers to JSON string for comparison
    const modifiersJson = JSON.stringify(modifiers);

    // Find existing item with same menuItemId and modifiers
    const existingItem = cart?.items.find(
      (item) => item.menuItemId === menuItemId && JSON.stringify(item.modifiers) === modifiersJson
    );

    if (existingItem) {
      // Update quantity of existing item
      const updatedItem = await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
      });

      this.logger.log(`Updated cart item ${existingItem.id}, new quantity: ${updatedItem.quantity}`);
    } else {
      // Create new cart if it doesn't exist
      if (!cart) {
        await this.prisma.customerCart.create({
          data: {
            customerId,
            outletId,
            outletName: outletName || 'Unknown Outlet',
            outletAddress: outletAddress || null,
          },
        });

        this.logger.log(`Created new cart for customer ${customerId} at outlet ${outletId}`);
      }

      // Get or create cart (in case we just created it)
      const targetCart = await this.prisma.customerCart.findUnique({
        where: {
          customerId_outletId: {
            customerId,
            outletId,
          },
        },
      });

      if (!targetCart) {
        throw new BadRequestException('Failed to create cart');
      }

      // Create new cart item
      await this.prisma.cartItem.create({
        data: {
          cartId: targetCart.id,
          menuItemId,
          name,
          price,
          quantity,
          modifiers: modifiersJson,
        },
      });

      this.logger.log(`Added new item to cart ${targetCart.id}: ${name} x${quantity}`);
    }

    // Return updated cart
    return this.getCustomerCart(customerId, outletId);
  }

  /**
   * Update cart item quantity
   * @param customerId Customer ID
   * @param itemId Cart item ID
   * @param quantity New quantity
   * @returns Updated cart
   */
  async updateCartItem(customerId: number, itemId: number, dto: UpdateCartItemDto) {
    const { quantity } = dto;

    if (quantity <= 0) {
      return this.removeCartItem(customerId, itemId);
    }

    // Verify item belongs to customer's cart
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
      },
    });

    if (!item || item.cart.customerId !== customerId) {
      throw new NotFoundException('Cart item not found');
    }

    const outletId = item.cart.outletId;

    // Update item
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    this.logger.log(`Updated cart item ${itemId} quantity to ${quantity}`);

    return this.getCustomerCart(customerId, outletId);
  }

  /**
   * Remove item from cart
   * @param customerId Customer ID
   * @param itemId Cart item ID
   * @returns Updated cart
   */
  async removeCartItem(customerId: number, itemId: number) {
    // Verify item belongs to customer's cart
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
      },
    });

    if (!item || item.cart.customerId !== customerId) {
      throw new NotFoundException('Cart item not found');
    }

    const outletId = item.cart.outletId;

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    this.logger.log(`Removed cart item ${itemId}`);

    return this.getCustomerCart(customerId, outletId);
  }

  /**
   * Clear cart for a specific outlet
   * @param customerId Customer ID
   * @param outletId Outlet ID
   */
  async clearCart(customerId: number, outletId: number) {
    const cart = await this.prisma.customerCart.findUnique({
      where: {
        customerId_outletId: {
          customerId,
          outletId,
        },
      },
    });

    if (!cart) {
      return { success: true, message: 'Cart is already empty' };
    }

    // Delete all items in the cart
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    this.logger.log(`Cleared cart ${cart.id} for customer ${customerId}`);

    return { success: true, message: 'Cart cleared successfully' };
  }

  /**
   * Get all carts for a customer (across all outlets)
   * @param customerId Customer ID
   * @returns All customer carts
   */
  async getAllCustomerCarts(customerId: number) {
    const carts = await this.prisma.customerCart.findMany({
      where: { customerId },
      include: {
        items: true,
      },
    });

    return carts.map((cart) => ({
      id: cart.id,
      outletId: cart.outletId,
      outletName: cart.outletName,
      outletAddress: cart.outletAddress,
      items: cart.items.map((item) => ({
        ...item,
        price: Number(item.price),
      })),
      subtotal: cart.items.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
      ),
    }));
  }
}
