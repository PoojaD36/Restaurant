import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrderListener } from './listeners/order.listener';
import { CustomerListener } from './listeners/customer.listener';
import { OfferListener } from './listeners/offer.listener';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false,      // Disable wildcard events for performance
      delimiter: '.',       // Delimiter for namespace events
      newListener: false,   // Don't track new listeners
      maxListeners: 10,     // Maximum listeners per event
      verboseMemoryLeak: true, // Detect memory leaks in dev
    }),
    NotificationsModule,   // Import for NotificationsGateway used by OrderListener
  ],
  providers: [OrderListener, CustomerListener, OfferListener],
  exports: [EventEmitterModule],
})
export class EventsModule {}
