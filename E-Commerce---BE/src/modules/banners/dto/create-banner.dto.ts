import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsDateString } from 'class-validator';

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

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
