import { OnEvent } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { OfferAppliedEvent } from '../interfaces/event-payloads.interface';

@Injectable()
export class OfferListener {
  private readonly logger = new Logger(OfferListener.name);

  constructor(private prisma: PrismaService) {}

  @OnEvent('offer.applied')
  async handleOfferApplied(payload: OfferAppliedEvent) {
    this.logger.log(
      `🎁 Offer applied: ${payload.code} for order ${payload.orderId}`,
    );

    try {
      // 1. Log usage in OfferUsage table
      await this.prisma.offerUsage.create({
        data: {
          offerId: payload.offerId,
          customerId: payload.customerId,
          orderId: payload.orderId,
          discountAmount: payload.discountAmount,
        },
      });

      // 2. Increment usage count if applicable
      // Note: This is already handled in OfferCalculationService's applyOffer method
      // But we can add additional logging or analytics here

      // 3. TODO: Track in analytics
      // await this.analyticsService.trackOfferUsed(payload);

      this.logger.log(`Offer applied event processed`);
    } catch (error) {
      this.logger.error('Failed to process offer.applied event', error);
    }
  }
}