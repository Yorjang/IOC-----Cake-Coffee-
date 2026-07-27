import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderStatus } from '../entities/purchase-order.entity';

export class CreatePurchaseOrderItemDto {
  @IsOptional()
  @IsUUID()
  ingredientId?: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.001)
  orderedQuantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}

export class CreatePurchaseOrderDto {
  @IsNotEmpty()
  @IsString()
  poCode: string;

  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsDateString()
  expectedDelivery?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}

export class QueryPurchaseOrderDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;

  @IsOptional()
  @IsString()
  poCode?: string;
}
