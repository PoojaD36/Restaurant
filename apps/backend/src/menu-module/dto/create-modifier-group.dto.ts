import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateModifierGroupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(['SINGLE', 'MULTIPLE'])
  type!: 'SINGLE' | 'MULTIPLE';

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  minSelect?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSelect?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
