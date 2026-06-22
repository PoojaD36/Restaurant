import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user-module/user-module.module';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './database/database.module';
import { UserModuleController } from './user-module/user-module.controller';
import { UserModuleService } from './user-module/user-module.service';
import { RestaurantModule } from './restaurant-module/restaurant-module.module';
import { OutletModule } from './outlet-module/outlet-module.module';
import { CustomerModule } from './customer-module/customer-module.module';

@Module({
  imports: [
    UserModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    RestaurantModule,
    OutletModule,
    CustomerModule,
  ],
  controllers: [AppController, UserModuleController],
  providers: [AppService, UserModuleService],
})
export class AppModule {}
