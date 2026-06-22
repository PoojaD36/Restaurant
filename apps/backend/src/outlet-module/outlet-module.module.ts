import { Module } from '@nestjs/common';
import { OutletModuleService } from './outlet-module.service';
import { OutletModuleController } from './outlet-module.controller';
import { PublicOutletController } from './public-outlet.controller';
import { PrismaModule } from '../database/database.module';

@Module({
  imports: [PrismaModule],
  controllers: [OutletModuleController, PublicOutletController],
  providers: [OutletModuleService],
  exports: [OutletModuleService],
})
export class OutletModule {}
