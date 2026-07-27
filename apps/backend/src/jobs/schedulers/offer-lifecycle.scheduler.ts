import { Cron } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OfferStatus } from '../../database/generated/prisma/enums';

@Injectable()
export class OfferLifecycleScheduler {
  private readonly logger = new Logger(OfferLifecycleScheduler.name);

  constructor(private prisma: PrismaService) {}

  @Cron('0 0 * * * *') // Top of every hour
  async manageOfferLifecycle() {
    this.logger.log('⏰ Checking offer lifecycle...');

    try {
      const now = new Date();

      // Operation 1: Expire past-due ACTIVE offers
      const expiredOffers = await this.prisma.offer.findMany({
        where: {
          status: OfferStatus.ACTIVE,
          endDate: { lt: now },
        },
        select: {
          id: true,
          name: true,
          code: true,
          endDate: true,
        },
      });

      if (expiredOffers.length > 0) {
        await this.prisma.offer.updateMany({
          where: { id: { in: expiredOffers.map((o) => o.id) } },
          data: { status: OfferStatus.EXPIRED },
        });
        this.logger.log(`✅ Expired ${expiredOffers.length} offers past their end date`);
      } else {
        this.logger.log('No offers to expire (end date)');
      }

      // Operation 2: Activate due SCHEDULED offers
      const dueOffers = await this.prisma.offer.findMany({
        where: {
          status: OfferStatus.SCHEDULED,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        select: {
          id: true,
          name: true,
          code: true,
          startDate: true,
        },
      });

      if (dueOffers.length > 0) {
        await this.prisma.offer.updateMany({
          where: { id: { in: dueOffers.map((o) => o.id) } },
          data: { status: OfferStatus.ACTIVE },
        });
        this.logger.log(`✅ Activated ${dueOffers.length} scheduled offers`);
      } else {
        this.logger.log('No scheduled offers to activate');
      }

      // Operation 3: Expire exhausted offers (usage limit reached)
      // Fetch all ACTIVE offers with maxUses set, then filter in-memory
      // (Prisma doesn't support field comparisons in where clauses)
      const potentialExhaustedOffers = await this.prisma.offer.findMany({
        where: {
          status: OfferStatus.ACTIVE,
          maxUses: { not: null },
        },
        select: {
          id: true,
          name: true,
          code: true,
          currentUses: true,
          maxUses: true,
        },
      });

      const exhaustedOffers = potentialExhaustedOffers.filter(
        (offer) => offer.currentUses >= offer.maxUses!,
      );

      if (exhaustedOffers.length > 0) {
        await this.prisma.offer.updateMany({
          where: { id: { in: exhaustedOffers.map((o) => o.id) } },
          data: { status: OfferStatus.EXPIRED },
        });
        this.logger.log(
          `✅ Expired ${exhaustedOffers.length} offers that reached usage limit`,
        );
      } else {
        this.logger.log('No offers to expire (usage limit)');
      }

      this.logger.log('Offer lifecycle check complete');
    } catch (error) {
      this.logger.error('Failed to manage offer lifecycle', error);
    }
  }
}
