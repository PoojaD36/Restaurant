import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CustomerModuleController } from './customer-module.controller';
import { CustomerModuleService } from './customer-module.service';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';
import { PrismaModule } from 'src/database/database.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'customer-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('CUSTOMER_JWT_SECRET') || 'restaurant-customer-secret-key-change-in-production',
        signOptions: {
          expiresIn: (configService.get<string>('CUSTOMER_JWT_EXPIRES_IN') || '7d') as any,
        },
      }),
    }),
  ],
  controllers: [CustomerModuleController],
  providers: [CustomerModuleService, CustomerJwtStrategy],
  exports: [CustomerModuleService, CustomerJwtStrategy, PassportModule, JwtModule],
})
export class CustomerModule {}
