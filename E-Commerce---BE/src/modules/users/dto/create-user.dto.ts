import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MinLength } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @IsEmail({}, { message: 'Email is invalid' })
  @IsOptional()
  email?: string | null;

  @IsString()
  @IsOptional()
  @Matches(/^(0|84|\+84)[35789][0-9]{8}$/, { message: 'Phone number is invalid' })
  phone?: string | null;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsEnum(UserRole, { message: 'Invalid role value' })
  role: UserRole;

  @IsUUID('4', { message: 'Branch id is invalid' })
  @IsOptional()
  branchId?: string | null;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
