import { Module } from '@nestjs/common';
import { OfferModuleController } from './offer-module.controller';
import { OfferModuleService } from './offer-module.service';
import { OfferValidationService } from './services/offer-validation.service';
import { OfferCalculationService } from './services/offer-calculation.service';
import { OfferUsageService } from './services/offer-usage.service';
import { OfferQueryService } from './services/offer-query.service';
import { OfferTransactionService } from './services/offer-transaction.service';
import { AdminOfferController } from './controllers/admin-offer.controller';
import { CustomerOfferController } from './controllers/customer-offer.controller';
import { PrismaModule } from '../database/database.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    OfferModuleController,
    AdminOfferController,
    CustomerOfferController,
  ],
  providers: [
    OfferModuleService,
    OfferValidationService,
    OfferCalculationService,
    OfferUsageService,
    OfferQueryService,
    OfferTransactionService,
  ],
  exports: [
    OfferValidationService,
    OfferCalculationService,
    OfferUsageService,
    OfferQueryService,
    OfferTransactionService,
  ],
})
export class OfferModuleModule {}
