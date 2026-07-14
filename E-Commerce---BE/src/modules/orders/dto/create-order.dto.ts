import { IsUUID, IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsUUID()
  productId: string;

  @IsUUID()
  variantId: string;

  @IsString()
  productName: string;

  @IsString()
  variantName: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  totalPrice: number;
}

export class CreateOrderDto {
  @IsUUID()
  branchId: string;

  @IsNumber()
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @IsNumber()
  @IsOptional()
  shippingFee?: number;

  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @IsString()
  paymentMethod: string;

  @IsString()
  fulfillmentType: string;

  @IsString()
  @IsOptional()
  shippingAddressStreet?: string;

  @IsString()
  @IsOptional()
  shippingAddressWard?: string;

  @IsString()
  @IsOptional()
  shippingAddressDistrict?: string;

  @IsString()
  @IsOptional()
  shippingAddressProvince?: string;

  @IsString()
  @IsOptional()
  shippingAddressPhone?: string;

  @IsString()
  @IsOptional()
  shippingRecipientName?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  couponCode?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
