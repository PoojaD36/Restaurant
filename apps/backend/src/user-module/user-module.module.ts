import { Module } from '@nestjs/common';
import { UserModuleService } from './user-module.service';
import { UserModuleController } from './user-module.controller';
import { PrismaModule } from '../database/database.module';
import { ConfigService } from '@nestjs/config/dist/config.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserModuleController],
  providers: [UserModuleService, ConfigService],
  exports: [UserModuleService],
})
export class UserModule {}
