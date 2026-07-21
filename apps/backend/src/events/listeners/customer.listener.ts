import { OnEvent } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import type {
  CustomerRegisteredEvent,
  AddressAddedEvent,
} from '../interfaces/event-payloads.interface';

@Injectable()
export class CustomerListener {
  private readonly logger = new Logger(CustomerListener.name);

  @OnEvent('customer.registered')
  async handleCustomerRegistered(payload: CustomerRegisteredEvent) {
    this.logger.log(`👤 New customer registered: ${payload.customerId}`);

    try {
      // TODO: Send welcome email
      // await this.emailService.sendWelcomeEmail({
      //   email: payload.email,
      //   name: payload.name,
      // });

      // TODO: Initialize customer analytics
      // await this.analyticsService.initCustomerStats(payload.customerId);

      this.logger.log(`Customer registered event processed`);
    } catch (error) {
      this.logger.error('Failed to process customer.registered event', error);
    }
  }

  @OnEvent('customer.address.added')
  async handleAddressAdded(payload: AddressAddedEvent) {
    this.logger.log(`📍 Address added for customer: ${payload.customerId}`);

    try {
      // TODO: Geocode address if needed (though this is already done in CustomerModule)
      // TODO: Update customer stats
      this.logger.log(`Address added event processed`);
    } catch (error) {
      this.logger.error('Failed to process customer.address.added event', error);
    }
  }
}