import { Injectable } from '@nestjs/common';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Injectable()
export class OfferModuleService {
  create(createOfferDto: CreateOfferDto) {
    return 'This action adds a new offerModule';
  }

  findAll() {
    return `This action returns all offerModule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} offerModule`;
  }

  update(id: number, updateOfferDto: UpdateOfferDto) {
    return `This action updates a #${id} offerModule`;
  }

  remove(id: number) {
    return `This action removes a #${id} offerModule`;
  }
}
