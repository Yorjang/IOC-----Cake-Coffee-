import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsOptional,
  IsDateString,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConfirmInboundItemDto {
  @IsNotEmpty()
  @IsUUID('4')
  poItemId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  receivedQuantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQuantity?: number;

  @IsOptional()
  @IsString()
  rejectReason?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsDateString()
  manufactureDate?: string;

  @IsNotEmpty()
  @IsDateString()
  expiryDate: string;

  @IsOptional()
  @IsString()
  batchCode?: string;

  @IsOptional()
  @IsBoolean()
  isIngredient?: boolean;

  @IsOptional()
  @IsString()
  unit?: string;
}

export class ConfirmInboundDto {
  @IsNotEmpty()
  @IsUUID('4')
  poId: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmInboundItemDto)
  items: ConfirmInboundItemDto[];
}
