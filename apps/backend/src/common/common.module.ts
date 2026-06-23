import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { GeocodingService } from './geocoding.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [GeocodingService],
  exports: [GeocodingService],
})
export class CommonModule {}
