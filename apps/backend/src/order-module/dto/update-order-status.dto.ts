import { IsNotEmpty, IsEnum, IsNumber } from 'class-validator';
import { OrderStatus } from 'src/database/generated/prisma/enums';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status!: OrderStatus;
}
