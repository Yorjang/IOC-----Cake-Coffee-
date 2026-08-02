import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsEnum,
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
  @IsNumber({}, { message: 'Số lượng phải là số' })
  @Min(0.001, { message: 'Số lượng phải lớn hơn 0' })
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
