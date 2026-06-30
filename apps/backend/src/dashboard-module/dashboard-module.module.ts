import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard-module.controller';
import { DashboardService } from './dashboard-module.service';
import { PrismaModule } from 'src/database/database.module';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
