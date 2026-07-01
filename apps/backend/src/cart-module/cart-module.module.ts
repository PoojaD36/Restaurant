import { Module } from '@nestjs/common';
import { CartModuleController } from './cart-module.controller';
import { CartModuleService } from './cart-module.service';
import { PrismaModule } from '../database/database.module';
import { CustomerModule } from '../customer-module/customer-module.module';

@Module({
  imports: [PrismaModule, CustomerModule],
  controllers: [CartModuleController],
  providers: [CartModuleService],
  exports: [CartModuleService],
})
export class CartModule {}
