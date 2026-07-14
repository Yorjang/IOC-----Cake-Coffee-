import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsDateString, Min } from 'class-validator';
import { DiscountType } from '../coupon.entity';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã voucher không được để trống.' })
  code: string;

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
  discountValue: number;

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
}
