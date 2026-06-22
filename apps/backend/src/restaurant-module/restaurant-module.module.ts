import { Module } from '@nestjs/common';
import { RestaurantModuleService } from './restaurant-module.service';
import { RestaurantModuleController } from './restaurant-module.controller';
import { PrismaModule } from '../database/database.module';

@Module({
  imports: [PrismaModule],
  controllers: [RestaurantModuleController],
  providers: [RestaurantModuleService],
  exports: [RestaurantModuleService],
})
export class RestaurantModule {}
