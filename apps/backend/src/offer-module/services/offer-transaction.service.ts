import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { UpdateOfferDto } from '../dto/update-offer.dto';
import { OfferStatus, OfferScope } from '../dto/create-offer.dto';

@Injectable()
export class OfferTransactionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new offer with all junction table entries
   */
  async createOffer(dto: CreateOfferDto) {
    // Validate custom DTO validations
    await dto.validate();

    // Check if code already exists
    const existingCode = await this.prisma.offer.findFirst({
      where: { code: dto.code.toUpperCase(), deletedAt: null },
    });

    if (existingCode) {
      throw new ConflictException('Offer code already exists');
    }

    // Validate restaurant exists if RESTAURANT scope
    if (dto.scope === OfferScope.RESTAURANT && dto.restaurantId) {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: dto.restaurantId },
      });
      if (!restaurant) {
        throw new BadRequestException('Restaurant not found');
      }
    }

    // Validate outlets exist if OUTLET scope
    if (dto.scope === OfferScope.OUTLET && dto.outletIds && dto.outletIds.length > 0) {
      const outlets = await this.prisma.outlet.findMany({
        where: { id: { in: dto.outletIds } },
      });
      if (outlets.length !== dto.outletIds.length) {
        throw new BadRequestException('One or more outlets not found');
      }
    }

    // Validate menu items exist
    if (dto.menuItemIds && dto.menuItemIds.length > 0) {
      const menuItems = await this.prisma.menuItem.findMany({
        where: { id: { in: dto.menuItemIds } },
      });
      if (menuItems.length !== dto.menuItemIds.length) {
        throw new BadRequestException('One or more menu items not found');
      }
    }

    // Validate categories exist
    if (dto.categoryIds && dto.categoryIds.length > 0) {
      const categories = await this.prisma.menuCategory.findMany({
        where: { id: { in: dto.categoryIds } },
      });
      if (categories.length !== dto.categoryIds.length) {
        throw new BadRequestException('One or more categories not found');
      }
    }

    // Use transaction to create offer and all junction entries
    try {
      const offer = await this.prisma.$transaction(async (tx) => {
        // Create main offer
        const newOffer = await tx.offer.create({
          data: {
            name: dto.name,
            description: dto.description,
            code: dto.code.toUpperCase(),
            type: dto.type,
            status: dto.status,
            scope: dto.scope,
            restaurantId: dto.restaurantId,
            percentageValue: dto.percentageValue,
            fixedAmountValue: dto.fixedAmountValue,
            maxDiscountAmount: dto.maxDiscountAmount,
            minOrderAmount: dto.minOrderAmount,
            requireCode: dto.requireCode,
            isVisible: dto.isVisible,
            maxUses: dto.maxUses,
            maxUsesPerCustomer: dto.maxUsesPerCustomer,
            priority: dto.priority,
            startDate: dto.startDate,
            endDate: dto.endDate,
            validDays: dto.validDays as any,
            validTimeStart: dto.validTimeStart,
            validTimeEnd: dto.validTimeEnd,
            firstOrderOnly: dto.firstOrderOnly,
            combinationType: dto.combinationType,
          },
        });

        // Create outlet junctions
        if (dto.outletIds && dto.outletIds.length > 0) {
          await tx.offerOutlet.createMany({
            data: dto.outletIds.map((outletId) => ({
              offerId: newOffer.id,
              outletId,
            })),
            skipDuplicates: true,
          });
        }

        // Create category junctions
        if (dto.categoryIds && dto.categoryIds.length > 0) {
          await tx.offerCategory.createMany({
            data: dto.categoryIds.map((categoryId) => ({
              offerId: newOffer.id,
              categoryId,
            })),
            skipDuplicates: true,
          });
        }

        // Create menu item junctions
        if (dto.menuItemIds && dto.menuItemIds.length > 0) {
          await tx.offerMenuItem.createMany({
            data: dto.menuItemIds.map((menuItemId) => ({
              offerId: newOffer.id,
              menuItemId,
            })),
            skipDuplicates: true,
          });
        }

        return newOffer;
      });

      return {
        success: true,
        message: 'Offer created successfully',
        data: offer,
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create offer');
    }
  }

  /**
   * Update an existing offer
   */
  async updateOffer(id: number, dto: UpdateOfferDto) {
    // Validate custom DTO validations if present
    if (dto.validate) {
      await dto.validate();
    }

    // Check if offer exists
    const existing = await this.prisma.offer.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new BadRequestException('Offer not found');
    }

    // Check if code conflict with another offer
    if (dto.code && dto.code !== existing.code) {
      const codeConflict = await this.prisma.offer.findFirst({
        where: { code: dto.code.toUpperCase(), deletedAt: null, id: { not: id } },
      });

      if (codeConflict) {
        throw new ConflictException('Offer code already exists');
      }
    }

    // Validate scope changes
    if (dto.scope === OfferScope.RESTAURANT && !dto.restaurantId && !existing.restaurantId) {
      throw new BadRequestException('Restaurant ID is required for RESTAURANT scope');
    }

    if (dto.scope === OfferScope.OUTLET && (!dto.outletIds || dto.outletIds.length === 0)) {
      throw new BadRequestException('Outlet IDs are required for OUTLET scope');
    }

    // Use transaction to update offer and junction tables
    try {
      const offer = await this.prisma.$transaction(async (tx) => {
        // Prepare update data (only include provided fields)
        const updateData: any = {};
        if (dto.name !== undefined) updateData.name = dto.name;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.code) updateData.code = dto.code.toUpperCase();
        if (dto.type !== undefined) updateData.type = dto.type;
        if (dto.status !== undefined) updateData.status = dto.status;
        if (dto.scope !== undefined) updateData.scope = dto.scope;
        if (dto.restaurantId !== undefined) updateData.restaurantId = dto.restaurantId;
        if (dto.percentageValue !== undefined) updateData.percentageValue = dto.percentageValue;
        if (dto.fixedAmountValue !== undefined) updateData.fixedAmountValue = dto.fixedAmountValue;
        if (dto.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = dto.maxDiscountAmount;
        if (dto.minOrderAmount !== undefined) updateData.minOrderAmount = dto.minOrderAmount;
        if (dto.requireCode !== undefined) updateData.requireCode = dto.requireCode;
        if (dto.isVisible !== undefined) updateData.isVisible = dto.isVisible;
        if (dto.maxUses !== undefined) updateData.maxUses = dto.maxUses;
        if (dto.maxUsesPerCustomer !== undefined) updateData.maxUsesPerCustomer = dto.maxUsesPerCustomer;
        if (dto.priority !== undefined) updateData.priority = dto.priority;
        if (dto.startDate !== undefined) updateData.startDate = dto.startDate;
        if (dto.endDate !== undefined) updateData.endDate = dto.endDate;
        if (dto.validDays !== undefined) updateData.validDays = dto.validDays as any;
        if (dto.validTimeStart !== undefined) updateData.validTimeStart = dto.validTimeStart;
        if (dto.validTimeEnd !== undefined) updateData.validTimeEnd = dto.validTimeEnd;
        if (dto.firstOrderOnly !== undefined) updateData.firstOrderOnly = dto.firstOrderOnly;
        if (dto.combinationType !== undefined) updateData.combinationType = dto.combinationType;

        // Update main offer
        const updatedOffer = await tx.offer.update({
          where: { id },
          data: updateData,
        });

        // Update outlet junctions if provided
        if (dto.outletIds !== undefined) {
          // Delete existing
          await tx.offerOutlet.deleteMany({
            where: { offerId: id },
          });

          // Add new ones
          if (dto.outletIds.length > 0) {
            await tx.offerOutlet.createMany({
              data: dto.outletIds.map((outletId) => ({
                offerId: id,
                outletId,
              })),
              skipDuplicates: true,
            });
          }
        }

        // Update category junctions if provided
        if (dto.categoryIds !== undefined) {
          // Delete existing
          await tx.offerCategory.deleteMany({
            where: { offerId: id },
          });

          // Add new ones
          if (dto.categoryIds.length > 0) {
            await tx.offerCategory.createMany({
              data: dto.categoryIds.map((categoryId) => ({
                offerId: id,
                categoryId,
              })),
              skipDuplicates: true,
            });
          }
        }

        // Update menu item junctions if provided
        if (dto.menuItemIds !== undefined) {
          // Delete existing
          await tx.offerMenuItem.deleteMany({
            where: { offerId: id },
          });

          // Add new ones
          if (dto.menuItemIds.length > 0) {
            await tx.offerMenuItem.createMany({
              data: dto.menuItemIds.map((menuItemId) => ({
                offerId: id,
                menuItemId,
              })),
              skipDuplicates: true,
            });
          }
        }

        return updatedOffer;
      });

      return {
        success: true,
        message: 'Offer updated successfully',
        data: offer,
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update offer');
    }
  }

  /**
   * Soft delete an offer
   */
  async deleteOffer(id: number) {
    const existing = await this.prisma.offer.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new BadRequestException('Offer not found');
    }

    // Check if offer has been used
    const usageCount = await this.prisma.offerUsage.count({
      where: { offerId: id },
    });

    if (usageCount > 0) {
      throw new BadRequestException('Cannot delete offer that has been used. Consider expiring it instead.');
    }

    // Soft delete
    await this.prisma.offer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return {
      success: true,
      message: 'Offer deleted successfully',
    };
  }

  /**
   * Update offer status
   */
  async updateOfferStatus(id: number, status: OfferStatus) {
    const existing = await this.prisma.offer.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new BadRequestException('Offer not found');
    }

    // Validate status transitions
    const validTransitions: Record<OfferStatus, OfferStatus[]> = {
      [OfferStatus.DRAFT]: [OfferStatus.ACTIVE, OfferStatus.SCHEDULED],
      [OfferStatus.SCHEDULED]: [OfferStatus.ACTIVE, OfferStatus.PAUSED, OfferStatus.EXPIRED],
      [OfferStatus.ACTIVE]: [OfferStatus.PAUSED, OfferStatus.EXPIRED],
      [OfferStatus.PAUSED]: [OfferStatus.ACTIVE, OfferStatus.EXPIRED],
      [OfferStatus.EXPIRED]: [], // No transitions from expired
    };

    if (!validTransitions[existing.status]?.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${existing.status} to ${status}`,
      );
    }

    await this.prisma.offer.update({
      where: { id },
      data: { status },
    });

    return {
      success: true,
      message: `Offer status updated to ${status}`,
    };
  }

  /**
   * Mark expired offers (cron job)
   */
  async markExpiredOffers() {
    const now = new Date();

    const offersToExpire = await this.prisma.offer.findMany({
      where: {
        deletedAt: null,
        status: { in: [OfferStatus.ACTIVE, OfferStatus.SCHEDULED] },
        endDate: { lt: now },
      },
      select: { id: true },
    });

    if (offersToExpire.length === 0) {
      return { expired: 0 };
    }

    await this.prisma.offer.updateMany({
      where: {
        id: { in: offersToExpire.map((o) => o.id) },
      },
      data: { status: OfferStatus.EXPIRED },
    });

    return { expired: offersToExpire.length };
  }

  /**
   * Activate scheduled offers (cron job)
   */
  async activateScheduledOffers() {
    const now = new Date();

    const offersToActivate = await this.prisma.offer.findMany({
      where: {
        deletedAt: null,
        status: OfferStatus.SCHEDULED,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: { id: true },
    });

    if (offersToActivate.length === 0) {
      return { activated: 0 };
    }

    await this.prisma.offer.updateMany({
      where: {
        id: { in: offersToActivate.map((o) => o.id) },
      },
      data: { status: OfferStatus.ACTIVE },
    });

    return { activated: offersToActivate.length };
  }
}
