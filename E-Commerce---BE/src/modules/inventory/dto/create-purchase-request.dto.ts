import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  IsInt,
  Min,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseRequestStatus } from '../entities/purchase-request.entity';

export class CreatePurchaseRequestItemDto {
  @IsOptional()
  @IsUUID('4')
  ingredientId?: string;

  @IsOptional()
  @IsUUID('4')
  variantId?: string;

  @IsNotEmpty({ message: 'Số lượng yêu cầu không được để trống' })
  @IsInt({ message: 'Số lượng yêu cầu phải là số nguyên' })
  @Min(1, { message: 'Số lượng yêu cầu phải lớn hơn hoặc bằng 1' })
  requestedQuantity: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreatePurchaseRequestDto {
  @IsNotEmpty({ message: 'Chi nhánh không được để trống' })
  @IsUUID('4', { message: 'Mã chi nhánh không hợp lệ' })
  branchId: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  deliveryTimeframe?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày nhận hàng không hợp lệ' })
  preferredDeliveryDate?: string;

  @IsNotEmpty({ message: 'Danh sách món cần đặt không được để trống' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseRequestItemDto)
  items: CreatePurchaseRequestItemDto[];
}

export class QueryPurchaseRequestDto {
  @IsOptional()
  @IsUUID('4')
  branchId?: string;

  @IsOptional()
  @IsEnum(PurchaseRequestStatus)
  status?: PurchaseRequestStatus;
}
