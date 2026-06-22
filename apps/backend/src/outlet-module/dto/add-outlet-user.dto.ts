import { IsInt, IsNotEmpty } from 'class-validator';

export class AddOutletUserDto {
  @IsInt()
  @IsNotEmpty()
  userId!: number;
}
