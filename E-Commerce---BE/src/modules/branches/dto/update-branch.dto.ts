import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, Matches } from 'class-validator';
import { BranchStatus } from '../entities/branch.entity';

export class UpdateBranchDto {
  @IsString()
  @IsNotEmpty({ message: 'Branch name must not be empty' })
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty({ message: 'Branch address must not be empty' })
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(0|84|\+84)[0-9]{9,10}$/, { message: 'Phone number is invalid' })
  phone?: string | null;

  @IsEmail({}, { message: 'Email is invalid' })
  @IsOptional()
  email?: string | null;

  @IsNumberString({}, { message: 'Latitude must be numeric' })
  @IsOptional()
  latitude?: string | null;

  @IsNumberString({}, { message: 'Longitude must be numeric' })
  @IsOptional()
  longitude?: string | null;

  @IsEnum(BranchStatus, { message: 'Branch status is invalid' })
  @IsOptional()
  status?: BranchStatus;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
