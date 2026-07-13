import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, Matches } from 'class-validator';
import { BranchStatus } from '../branch.entity';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty({ message: 'Branch name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Branch address is required' })
  address: string;

  @IsString()
  @IsOptional()
  @Matches(/^(0|84|\+84)[0-9]{9,10}$/, { message: 'Phone number is invalid' })
  phone?: string;

  @IsEmail({}, { message: 'Email is invalid' })
  @IsOptional()
  email?: string;

  @IsNumberString({}, { message: 'Latitude must be numeric' })
  @IsOptional()
  latitude?: string;

  @IsNumberString({}, { message: 'Longitude must be numeric' })
  @IsOptional()
  longitude?: string;

  @IsEnum(BranchStatus, { message: 'Branch status is invalid' })
  @IsNotEmpty({ message: 'Branch status is required' })
  status: BranchStatus;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
