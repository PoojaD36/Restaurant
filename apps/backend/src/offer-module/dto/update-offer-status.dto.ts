import { IsEnum, IsNotEmpty } from 'class-validator';
import { OfferStatus } from './create-offer.dto';

export class UpdateOfferStatusDto {
  @IsEnum(OfferStatus)
  @IsNotEmpty()
  status!: OfferStatus;
}
