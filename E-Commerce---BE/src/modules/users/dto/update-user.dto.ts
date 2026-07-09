import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name must not be empty' })
  @IsOptional()
  fullName?: string;

  @IsEmail({}, { message: 'Email is invalid' })
  @IsOptional()
  email?: string | null;

  @IsString()
  @IsOptional()
  @Matches(/^(0|84|\+84)[35789][0-9]{8}$/, { message: 'Phone number is invalid' })
  phone?: string | null;

  @IsEnum(UserRole, { message: 'Invalid role value' })
  @IsOptional()
  role?: UserRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
