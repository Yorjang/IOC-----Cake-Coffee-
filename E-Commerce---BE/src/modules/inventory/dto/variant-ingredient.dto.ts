import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class CreateVariantIngredientDto {
  @IsUUID()
  ingredientId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantityRequired: number;

  @IsOptional()
  @IsString()
  unit?: string;
}

export class BulkSetVariantIngredientsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantIngredientDto)
  ingredients: CreateVariantIngredientDto[];
}

export class UpdateVariantIngredientDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantityRequired?: number;

  @IsOptional()
  @IsString()
  unit?: string;
}
