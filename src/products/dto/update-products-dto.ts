import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateProductsDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;
}
