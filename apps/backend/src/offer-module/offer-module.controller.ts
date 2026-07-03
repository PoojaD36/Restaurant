import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OfferModuleService } from './offer-module.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Controller('offer-module')
export class OfferModuleController {
  constructor(private readonly offerModuleService: OfferModuleService) {}

  @Post()
  create(@Body() createOfferDto: CreateOfferDto) {
    return this.offerModuleService.create(createOfferDto);
  }

  @Get()
  findAll() {
    return this.offerModuleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offerModuleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOfferDto: UpdateOfferDto) {
    return this.offerModuleService.update(+id, updateOfferDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.offerModuleService.remove(+id);
  }
}
