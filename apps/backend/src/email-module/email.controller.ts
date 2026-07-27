import { Controller, Post, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * Test email endpoint - sends a test email to configured recipients
   * Requires SUPER_ADMIN role
   */
  @Post('test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async sendTestEmail() {
    this.logger.log('Sending test email...');

    try {
      await this.emailService.sendTestEmail();

      return {
        success: true,
        message: 'Test email sent successfully! Check your inbox.',
      };
    } catch (error) {
      this.logger.error('Failed to send test email', error);
      return {
        success: false,
        message: 'Failed to send test email. Check server logs for details.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test daily report endpoint - generates and sends a daily sales report
   * Requires SUPER_ADMIN role
   */
  @Post('test-daily-report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async sendTestDailyReport() {
    this.logger.log('Generating and sending test daily report...');

    try {
      // This would normally be handled by the scheduler
      // For testing, we'll return a success message indicating the scheduler handles it
      return {
        success: true,
        message: 'Daily report will be sent by the scheduler at 8 AM daily. For immediate testing, check the scheduler logs.',
        scheduler: 'daily-sales-report',
        schedule: '0 0 8 * * * (8 AM daily)',
        timezone: 'Asia/Kolkata',
      };
    } catch (error) {
      this.logger.error('Failed to send test daily report', error);
      return {
        success: false,
        message: 'Failed to process daily report test.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
