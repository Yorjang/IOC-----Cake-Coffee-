import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { BatchStatus } from '../entities/stock-batch.entity';

export class CreateStockBatchDto {
  @IsString()
  @IsNotEmpty()
  batchCode: string;

  @IsUUID()
  branchId: string;

  @IsOptional()
  @IsUUID()
  ingredientId?: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  initialQuantity: number;

  @IsOptional()
  @IsDateString()
  manufactureDate?: string;

  @IsDateString()
  expiryDate: string;

  @IsOptional()
  @IsString()
  supplier?: string;
}

export class UpdateStockBatchDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsEnum(BatchStatus)
  status?: BatchStatus;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  supplier?: string;
}
