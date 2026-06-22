import { Module } from '@nestjs/common';
import { OutletModuleService } from './outlet-module.service';
import { OutletModuleController } from './outlet-module.controller';
import { PrismaModule } from '../database/database.module';

@Module({
  imports: [PrismaModule],
  controllers: [OutletModuleController],
  providers: [OutletModuleService],
  exports: [OutletModuleService],
})
export class OutletModule {}
