import { Module } from '@nestjs/common';
import { OfferModuleService } from './offer-module.service';
import { OfferModuleController } from './offer-module.controller';

@Module({
  controllers: [OfferModuleController],
  providers: [OfferModuleService],
})
export class OfferModuleModule {}
