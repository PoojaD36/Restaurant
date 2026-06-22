import { IsInt, IsNotEmpty } from 'class-validator';

export class AddRestaurantUserDto {
  @IsInt()
  @IsNotEmpty()
  userId!: number;
}
