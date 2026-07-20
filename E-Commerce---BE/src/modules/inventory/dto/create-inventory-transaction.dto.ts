import { IsUUID, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryTransactionType } from '../entities/inventory-transaction.entity';

export class CreateInventoryTransactionDto {
  @IsUUID()
  branchId: string;

  @IsEnum(InventoryTransactionType)
  transactionType: InventoryTransactionType;

  @IsOptional()
  @IsUUID()
  ingredientId?: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsOptional()
  @IsUUID()
  batchId?: string;

  @Type(() => Number)
  @IsNumber()
  quantityChange: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;
}
