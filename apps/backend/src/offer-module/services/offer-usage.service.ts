import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OFFOR_ERROR_MESSAGES } from '../constants/offer.constants';

@Injectable()
export class OfferUsageService {
  constructor(private prisma: PrismaService) {}

  /**
   * Record offer usage when an offer is applied to an order
   */
  async recordOfferUsage(
    offerId: number,
    customerId: number,
    orderId: number,
    discountAmount: number,
  ): Promise<void> {
    try {
      // Check if usage already exists (shouldn't happen, but safety check)
      const existing = await this.prisma.offerUsage.findUnique({
        where: {
          offerId_customerId_orderId: {
            offerId,
            customerId,
            orderId,
          },
        },
      });

      if (existing) {
        throw new BadRequestException('Offer usage already recorded for this order');
      }

      // Create offer usage record
      await this.prisma.offerUsage.create({
        data: {
          offerId,
          customerId,
          orderId,
          discountAmount,
        },
      });

      // Increment current uses on offer
      await this.prisma.offer.update({
        where: { id: offerId },
        data: {
          currentUses: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to record offer usage');
    }
  }

  /**
   * Get customer's usage count for a specific offer
   */
  async getCustomerUsageCount(offerId: number, customerId: number): Promise<number> {
    return await this.prisma.offerUsage.count({
      where: {
        offerId,
        customerId,
      },
    });
  }

  /**
   * Check if customer can still use this offer
   */
  async canCustomerUseOffer(offerId: number, customerId: number): Promise<boolean> {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId, deletedAt: null },
    });

    if (!offer) {
      return false;
    }

    // Check global max uses
    if (offer.maxUses && offer.currentUses >= offer.maxUses) {
      return false;
    }

    // Check customer-specific limit
    if (offer.maxUsesPerCustomer > 0) {
      const usageCount = await this.getCustomerUsageCount(offerId, customerId);
      if (usageCount >= offer.maxUsesPerCustomer) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all offer usages for a customer
   */
  async getCustomerOfferUsages(customerId: number) {
    return await this.prisma.offerUsage.findMany({
      where: { customerId },
      include: {
        offer: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
        order: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get offer usage statistics
   */
  async getOfferUsageStats(offerId: number) {
    const totalUsage = await this.prisma.offerUsage.count({
      where: { offerId },
    });

    const uniqueCustomers = await this.prisma.offerUsage.groupBy({
      by: ['customerId'],
      where: { offerId },
    });

    const totalDiscount = await this.prisma.offerUsage.aggregate({
      where: { offerId },
      _sum: {
        discountAmount: true,
      },
    });

    const recentUsages = await this.prisma.offerUsage.findMany({
      where: { offerId },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        order: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return {
      totalUsage,
      uniqueCustomers: uniqueCustomers.length,
      totalDiscount: totalDiscount._sum.discountAmount || 0,
      recentUsages,
    };
  }

  /**
   * Revert offer usage (when order is cancelled)
   */
  async revertOfferUsage(offerId: number, customerId: number, orderId: number): Promise<void> {
    // Check if usage exists
    const usage = await this.prisma.offerUsage.findUnique({
      where: {
        offerId_customerId_orderId: {
          offerId,
          customerId,
          orderId,
        },
      },
    });

    if (!usage) {
      return; // Usage doesn't exist, nothing to revert
    }

    // Delete the usage record
    await this.prisma.offerUsage.delete({
      where: {
        offerId_customerId_orderId: {
          offerId,
          customerId,
          orderId,
        },
      },
    });

    // Decrement current uses on offer
    await this.prisma.offer.update({
      where: { id: offerId },
      data: {
        currentUses: {
          decrement: 1,
        },
      },
    });
  }

  /**
   * Get customers who used a specific offer (for marketing)
   */
  async getOfferCustomers(offerId: number, limit: number = 50) {
    const usages = await this.prisma.offerUsage.findMany({
      where: { offerId },
      distinct: ['customerId'],
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return usages.map((usage) => usage.customer);
  }

  /**
   * Get most used offers
   */
  async getMostUsedOffers(limit: number = 10) {
    const offerUsages = await this.prisma.offerUsage.groupBy({
      by: ['offerId'],
      _count: {
        offerId: true,
      },
      _sum: {
        discountAmount: true,
      },
      orderBy: {
        _count: {
          offerId: 'desc',
        },
      },
      take: limit,
    });

    const offerIds = offerUsages.map((ou) => ou.offerId);

    const offers = await this.prisma.offer.findMany({
      where: {
        id: { in: offerIds },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        status: true,
      },
    });

    return offerUsages.map((ou) => {
      const offer = offers.find((o) => o.id === ou.offerId);
      return {
        ...offer,
        usageCount: ou._count.offerId,
        totalDiscount: ou._sum.discountAmount || 0,
      };
    });
  }
}
