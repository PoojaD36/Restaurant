import { Module } from '@nestjs/common';
import { MenuModuleService } from './menu-module.service';
import { MenuModuleController, PublicMenuController } from './menu-module.controller';
import { PrismaModule } from '../database/database.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [MenuModuleController, PublicMenuController],
  providers: [MenuModuleService],
  exports: [MenuModuleService],
})
export class MenuModule {}
