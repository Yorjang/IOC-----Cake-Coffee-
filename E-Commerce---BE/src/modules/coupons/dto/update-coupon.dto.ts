import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { DiscountType } from '../coupon.entity';

export class UpdateCouponDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(DiscountType)
  @IsOptional()
  discountType?: DiscountType;

  @IsNumber()
  @Min(0, { message: 'Giá trị giảm giá phải lớn hơn hoặc bằng 0.' })
  @IsOptional()
  discountValue?: number;

  @IsNumber()
  @IsOptional()
  minOrderValue?: number;

  @IsNumber()
  @IsOptional()
  usageLimit?: number;

  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsUUID('4', { message: 'ID sản phẩm không hợp lệ.' })
  @IsOptional()
  productId?: string;

  @IsUUID('4', { message: 'ID danh mục không hợp lệ.' })
  @IsOptional()
  categoriesId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @Min(0, { message: 'Giảm giá tối đa phải lớn hơn hoặc bằng 0.' })
  @IsOptional()
  maxDiscount?: number;

  @IsString()
  @IsOptional()
  targetSize?: string;

  @IsUUID('4', { message: 'ID chi nhánh không hợp lệ.' })
  @IsOptional()
  branchId?: string;
}


