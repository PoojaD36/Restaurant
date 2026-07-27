import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OrderCleanupScheduler } from './schedulers/order-cleanup.scheduler';
import { OfferLifecycleScheduler } from './schedulers/offer-lifecycle.scheduler';
import { DailySalesReportScheduler } from './schedulers/daily-sales-report.scheduler';
import { PrismaService } from '../database/prisma.service';
import { EventsModule } from '../events/events.module';
import { EmailModule } from '../email-module/email.module';

@Module({
  imports: [ScheduleModule.forRoot(), EventsModule, EmailModule],
  providers: [
    OrderCleanupScheduler,
    OfferLifecycleScheduler,
    DailySalesReportScheduler,
    PrismaService,
  ],
})
export class JobsModule {}
