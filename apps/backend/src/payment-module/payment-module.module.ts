import { Module } from '@nestjs/common';
import { PaymentModuleController } from './payment-module.controller';
import { PaymentModuleService } from './payment-module.service';
import { PrismaModule } from '../database/database.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PaymentModuleController],
  providers: [PaymentModuleService],
  exports: [PaymentModuleService],
})
export class PaymentModule {}
