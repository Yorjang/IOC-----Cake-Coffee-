import { IsBoolean, IsNumber, IsOptional, IsPhoneNumber, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export class CreateUserAddressDto {
  @IsString()
  @Length(2, 150)
  recipientName: string;

  @IsPhoneNumber('VN')
  phone: string;

  @IsString()
  @Length(5, 500)
  address: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
