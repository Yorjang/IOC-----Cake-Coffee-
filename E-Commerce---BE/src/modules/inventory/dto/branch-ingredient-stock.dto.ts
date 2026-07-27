import { IsUUID, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBranchIngredientStockDto {
  @IsUUID()
  branchId: string;

  @IsUUID()
  ingredientId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStockLevel?: number;
}

export class UpdateBranchIngredientStockDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStockLevel?: number;
}
