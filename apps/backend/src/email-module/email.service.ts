import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly defaultRecipient: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly config: ConfigService,
  ) {
    this.defaultRecipient = this.config.get('EMAIL_TO') || '';
  }

  /**
   * Send daily sales report email
   */
  async sendDailySalesReport(reportData: any): Promise<void> {
    try {
      const recipients = this.defaultRecipient.split(',').map((email) => email.trim());

      await this.mailerService.sendMail({
        to: recipients,
        subject: `📊 Daily Sales Report - ${reportData.date}`,
        template: 'daily-report',
        context: {
          ...reportData,
          subject: `Daily Sales Report - ${reportData.date}`,
          year: new Date().getFullYear(),
        },
      });

      this.logger.log(`Daily sales report sent to ${recipients.join(', ')}`);
    } catch (error) {
      this.logger.error('Failed to send daily sales report email', error);
      throw error;
    }
  }

  /**
   * Send order confirmation email to customer
   */
  async sendOrderConfirmation(
    customerEmail: string,
    customerName: string,
    orderData: any,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: customerEmail,
        subject: `🍔 Order Confirmed - Order #${orderData.id}`,
        template: 'order-confirmation',
        context: {
          customerName,
          order: orderData,
          subject: `Order Confirmed - Order #${orderData.id}`,
          year: new Date().getFullYear(),
        },
      });

      this.logger.log(`Order confirmation sent to ${customerEmail}`);
    } catch (error) {
      this.logger.error('Failed to send order confirmation email', error);
      throw error;
    }
  }

  /**
   * Send welcome email to new customer
   */
  async sendWelcomeEmail(
    customerEmail: string,
    customerName: string,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: customerEmail,
        subject: '🎉 Welcome to Foodie Restaurant!',
        template: 'welcome-email',
        context: {
          customerName,
          subject: 'Welcome to Foodie Restaurant!',
          year: new Date().getFullYear(),
        },
      });

      this.logger.log(`Welcome email sent to ${customerEmail}`);
    } catch (error) {
      this.logger.error('Failed to send welcome email', error);
      throw error;
    }
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdate(
    customerEmail: string,
    customerName: string,
    orderId: number,
    status: string,
    statusMessage: string,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: customerEmail,
        subject: `📍 Order Status Update - Order #${orderId}`,
        template: 'order-status-update',
        context: {
          customerName,
          orderId,
          status,
          statusMessage,
          subject: `Order Status Update - Order #${orderId}`,
          year: new Date().getFullYear(),
        },
      });

      this.logger.log(`Order status update sent to ${customerEmail}`);
    } catch (error) {
      this.logger.error('Failed to send order status update email', error);
      throw error;
    }
  }

  /**
   * Send test email (for configuration testing)
   */
  async sendTestEmail(): Promise<void> {
    try {
      const recipients = this.defaultRecipient.split(',').map((email) => email.trim());

      await this.mailerService.sendMail({
        to: recipients,
        subject: '🧪 Test Email - Foodie Restaurant',
        template: 'test-email',
        context: {
          subject: 'Test Email - Foodie Restaurant',
          year: new Date().getFullYear(),
          testName: 'Test User',
        },
      });

      this.logger.log(`Test email sent to ${recipients.join(', ')}`);
    } catch (error) {
      this.logger.error('Failed to send test email', error);
      throw error;
    }
  }
}
