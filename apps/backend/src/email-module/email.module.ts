import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { join } from 'path';

// Register Handlebars helpers
const hbsHelpers = {
  eq: (a: unknown, b: unknown) => a === b,
  or: (...args: unknown[]) => {
    // Remove the last argument (options) and check if any are truthy
    const options = args.pop();
    return args.some(Boolean);
  },
};

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('SMTP_HOST'),
          port: config.get('SMTP_PORT'),
          secure: config.get('SMTP_SECURE') === 'true',
          auth: {
            user: config.get('SMTP_USER'),
            pass: config.get('SMTP_PASSWORD'),
          },
        },
        defaults: {
          from: config.get('SMTP_FROM'),
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(hbsHelpers),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
