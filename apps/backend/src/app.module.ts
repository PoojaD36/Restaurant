import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user-module/user-module.module';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './database/database.module';
import { UserModuleController } from './user-module/user-module.controller';
import { UserModuleService } from './user-module/user-module.service';

@Module({
  imports: [
    UserModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
  ],
  controllers: [AppController, UserModuleController],
  providers: [AppService, UserModuleService],
})
export class AppModule {}
