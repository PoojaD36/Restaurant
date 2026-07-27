import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OrderCleanupScheduler } from './schedulers/order-cleanup.scheduler';
import { OfferLifecycleScheduler } from './schedulers/offer-lifecycle.scheduler';
import { PrismaService } from '../database/prisma.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [ScheduleModule.forRoot(), EventsModule],
  providers: [OrderCleanupScheduler, OfferLifecycleScheduler, PrismaService],
})
export class JobsModule {}
