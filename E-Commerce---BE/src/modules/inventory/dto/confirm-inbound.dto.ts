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
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConfirmInboundItemDto {
  @IsNotEmpty()
  @IsUUID()
  poItemId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  receivedQuantity: number;

  @IsOptional()
  @IsDateString()
  manufactureDate?: string;

  @IsNotEmpty()
  @IsDateString()
  expiryDate: string;

  @IsOptional()
  @IsString()
  batchCode?: string;
}

export class ConfirmInboundDto {
  @IsNotEmpty()
  @IsUUID()
  poId: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmInboundItemDto)
  items: ConfirmInboundItemDto[];
}
