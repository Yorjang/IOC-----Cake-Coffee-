import { IsNumber, IsOptional, Min, IsString } from 'class-validator';

export class UpdateInventoryDto {
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Số lượng tồn kho không được âm.' })
  quantity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Số lượng tối thiểu không được âm.' })
  minQuantity?: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
