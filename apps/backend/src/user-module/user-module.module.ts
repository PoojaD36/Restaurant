import { Module } from '@nestjs/common';
import { UserModuleService } from './user-module.service';
import { UserModuleController } from './user-module.controller';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [UserModuleController],
  providers: [UserModuleService, PrismaService],
})
export class UserModuleModule {}
