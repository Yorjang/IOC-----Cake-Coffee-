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
  @IsUUID('4')
  ingredientId?: string;

  @IsOptional()
  @IsUUID('4')
  variantId?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsNotEmpty({ message: 'Số lượng đặt không được để trống' })
  @IsNumber()
  @Min(0.001, { message: 'Số lượng đặt phải lớn hơn 0' })
  orderedQuantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}

export class CreatePurchaseOrderDto {
  @IsNotEmpty({ message: 'Mã đơn hàng PO không được để trống' })
  @IsString()
  poCode: string;

  @IsOptional()
  @IsUUID('4')
  prId?: string;

  @IsNotEmpty({ message: 'Mã chi nhánh không được để trống' })
  @IsUUID('4')
  branchId: string;

  @IsOptional()
  @IsUUID('4')
  supplierId?: string;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsDateString()
  expectedDelivery?: string;

  @IsOptional()
  @IsString()
  deliveryTimeframe?: string;

  @IsOptional()
  @IsDateString()
  expiredAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty({ message: 'Danh sách sản phẩm nhập không được để trống' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}

export class QueryPurchaseOrderDto {
  @IsOptional()
  @IsUUID('4')
  branchId?: string;

  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;

  @IsOptional()
  @IsString()
  poCode?: string;
}
