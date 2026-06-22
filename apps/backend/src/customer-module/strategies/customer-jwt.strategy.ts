import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CustomerJwtPayload } from '../interfaces/customer-jwt-payload.interface';

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('CUSTOMER_JWT_SECRET') || 'restaurant-customer-secret-key-change-in-production',
    });
  }

  async validate(payload: CustomerJwtPayload) {
    if (!payload.sub || !payload.phone) {
      throw new UnauthorizedException('Invalid customer token payload');
    }

    if (payload.type !== 'customer') {
      throw new UnauthorizedException('Invalid token type');
    }

    return {
      customerId: payload.sub,
      phone: payload.phone,
      email: payload.email,
      type: 'customer',
    };
  }
}
