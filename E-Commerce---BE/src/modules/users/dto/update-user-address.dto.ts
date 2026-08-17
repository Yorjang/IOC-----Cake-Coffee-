import { IsBoolean, IsNumber, IsOptional, IsPhoneNumber, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export class UpdateUserAddressDto {
  @IsOptional() @IsString() @Length(2, 150) recipientName?: string;
  @IsOptional() @IsPhoneNumber('VN') phone?: string;
  @IsOptional() @IsString() @Length(5, 500) address?: string;
  @IsOptional() @IsNumber() @Min(-90) @Max(90) latitude?: number;
  @IsOptional() @IsNumber() @Min(-180) @Max(180) longitude?: number;
  @IsOptional() @IsString() @MaxLength(50) label?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}
