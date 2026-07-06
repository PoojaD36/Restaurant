import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OfferStatus, OfferScope } from '../dto/create-offer.dto';
import { OfferFilterDto } from '../dto/offer-filter.dto';
import { PaginationMeta } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interfaces/response.interface';

@Injectable()
export class OfferQueryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get offer by ID with full details
   */
  async getOfferById(id: number) {
    const offer = await this.prisma.offer.findFirst({
      where: { id, deletedAt: null },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        outlets: {
          include: {
            outlet: {
              select: {
                id: true,
                name: true,
                addressLine1: true,
                city: true,
              },
            },
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        menuItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                basePrice: true,
              },
            },
          },
        },
        _count: {
          select: {
            usages: true,
            outlets: true,
            categories: true,
            menuItems: true,
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return offer;
  }

  /**
   * Get offer by code
   */
  async getOfferByCode(code: string) {
    const offer = await this.prisma.offer.findFirst({
      where: {
        code: code.toUpperCase(),
        deletedAt: null,
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        outlets: true,
        categories: true,
        menuItems: true,
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return offer;
  }

  /**
   * Get all offers with filtering and pagination
   */
  async getOffers(filter: OfferFilterDto): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10, type, status, scope, restaurantId, outletId, code, isVisible, requireCode, outletIds, search } = filter;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (scope) {
      where.scope = scope;
    }

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (code) {
      where.code = { contains: code, mode: 'insensitive' };
    }

    if (isVisible !== undefined) {
      where.isVisible = isVisible;
    }

    if (requireCode !== undefined) {
      where.requireCode = requireCode;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by outlet if specified
    if (outletId) {
      where.outlets = {
        some: {
          outletId,
        },
      };
    }

    // Filter by multiple outlets if specified
    if (outletIds && outletIds.length > 0) {
      where.outlets = {
        some: {
          outletId: { in: outletIds },
        },
      };
    }

    const [offers, total] = await Promise.all([
      this.prisma.offer.findMany({
        where,
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
            },
          },
          outlets: {
            include: {
              outlet: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            take: 5,
          },
          _count: {
            select: {
              usages: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { priority: 'desc' },
      }),
      this.prisma.offer.count({ where }),
    ]);

    const pagination = new PaginationMeta(total, page, limit);

    return {
      success: true,
      message: 'Offers retrieved successfully',
      data: offers,
      pagination,
    };
  }

  /**
   * Get active offers for a specific outlet
   */
  async getActiveOffersForOutlet(outletId: number) {
    const now = new Date();

    const offers = await this.prisma.offer.findMany({
      where: {
        deletedAt: null,
        status: OfferStatus.ACTIVE,
        isVisible: true,
        startDate: { lte: now },
        endDate: { gte: now },
        OR: [
          // Public offers
          { scope: OfferScope.PUBLIC },
          // Restaurant-specific offers (need to check restaurant relation)
          {
            scope: OfferScope.RESTAURANT,
            outlets: {
              some: { outletId },
            },
          },
          // Outlet-specific offers
          {
            scope: OfferScope.OUTLET,
            outlets: {
              some: { outletId },
            },
          },
        ],
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: true,
        menuItems: true,
      },
      orderBy: { priority: 'desc' },
    });

    return offers;
  }

  /**
   * Get offers for a restaurant (for restaurant admin)
   */
  async getRestaurantOffers(restaurantId: number, filter: OfferFilterDto) {
    const { page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      restaurantId,
    };

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.type) {
      where.type = filter.type;
    }

    const [offers, total] = await Promise.all([
      this.prisma.offer.findMany({
        where,
        include: {
          outlets: {
            include: {
              outlet: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          menuItems: {
            include: {
              menuItem: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              usages: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.offer.count({ where }),
    ]);

    const pagination = new PaginationMeta(total, page, limit);

    return {
      success: true,
      message: 'Restaurant offers retrieved successfully',
      data: offers,
      pagination,
    };
  }

  /**
   * Get offer statistics
   */
  async getOfferStats() {
    const [
      totalOffers,
      activeOffers,
      draftOffers,
      scheduledOffers,
      expiredOffers,
    ] = await Promise.all([
      this.prisma.offer.count({ where: { deletedAt: null } }),
      this.prisma.offer.count({
        where: { deletedAt: null, status: OfferStatus.ACTIVE },
      }),
      this.prisma.offer.count({
        where: { deletedAt: null, status: OfferStatus.DRAFT },
      }),
      this.prisma.offer.count({
        where: { deletedAt: null, status: OfferStatus.SCHEDULED },
      }),
      this.prisma.offer.count({
        where: { deletedAt: null, status: OfferStatus.EXPIRED },
      }),
    ]);

    return {
      totalOffers,
      activeOffers,
      draftOffers,
      scheduledOffers,
      expiredOffers,
      pausedOffers: totalOffers - activeOffers - draftOffers - scheduledOffers - expiredOffers,
    };
  }

  /**
   * Check if offer code exists
   */
  async checkCodeExists(code: string, excludeId?: number): Promise<boolean> {
    const where: any = {
      code: code.toUpperCase(),
      deletedAt: null,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.offer.count({ where });
    return count > 0;
  }

  /**
   * Get offers that are about to expire (within 7 days)
   */
  async getExpiringOffers() {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return await this.prisma.offer.findMany({
      where: {
        deletedAt: null,
        status: { in: [OfferStatus.ACTIVE, OfferStatus.SCHEDULED] },
        endDate: { lte: sevenDaysFromNow },
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { endDate: 'asc' },
    });
  }

  /**
   * Get offers that should be marked as expired
   */
  async getOffersToExpire() {
    const now = new Date();

    return await this.prisma.offer.findMany({
      where: {
        deletedAt: null,
        status: { in: [OfferStatus.ACTIVE, OfferStatus.SCHEDULED] },
        endDate: { lt: now },
      },
      select: { id: true },
    });
  }
}
