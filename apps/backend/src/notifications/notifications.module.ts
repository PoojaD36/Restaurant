import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from 'src/database/database.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'restaurant-jwt-secret-key',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  providers: [NotificationsGateway],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}
