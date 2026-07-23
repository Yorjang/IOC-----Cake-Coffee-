import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class ComboItemDto {
  @IsUUID('4')
  childProductId: string;

  @IsUUID('4')
  @IsOptional()
  childVariantId?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsBoolean()
  @IsOptional()
  isOptional?: boolean;
}

export class CreateComboDto {
  @IsUUID('4')
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ComboItemDto)
  items: ComboItemDto[];
}

export class UpdateComboDto extends CreateComboDto {}
