import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OrderCleanupScheduler } from './schedulers/order-cleanup.scheduler';
import { PrismaService } from '../database/prisma.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [ScheduleModule.forRoot(), EventsModule],
  providers: [OrderCleanupScheduler, PrismaService],
})
export class JobsModule {}
