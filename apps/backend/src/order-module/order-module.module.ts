import { Module } from '@nestjs/common';
import { OrderModuleController } from './order-module.controller';
import { OrderModuleService } from './order-module.service';
import { PrismaModule } from '../database/database.module';
import { CommonModule } from '../common/common.module';
import { CustomerModule } from '../customer-module/customer-module.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    CustomerModule,
  ],
  controllers: [OrderModuleController],
  providers: [OrderModuleService],
  exports: [OrderModuleService],
})
export class OrderModule {}
