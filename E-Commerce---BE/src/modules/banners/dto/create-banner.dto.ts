import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsDateString, IsUUID } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsNotEmpty({ message: 'Vui lòng chọn hình ảnh banner.' })
  imageUrl: string;

  @IsString()
  @IsOptional()
  linkUrl?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsString()
  @IsOptional()
  position?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsUUID('4')
  @IsOptional()
  branchId?: string;

  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
