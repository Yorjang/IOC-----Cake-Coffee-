import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, Min, IsUUID, IsBoolean } from 'class-validator';
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

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

