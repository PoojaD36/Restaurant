import { IsNotEmpty, IsInt } from 'class-validator';

export class AssignDeliveryAgentDto {
  @IsNotEmpty()
  @IsInt()
  deliveryAgentId!: number;
}