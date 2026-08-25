import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateLoyaltyTierDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minSpent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minProducts?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  bonusPointRate?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
