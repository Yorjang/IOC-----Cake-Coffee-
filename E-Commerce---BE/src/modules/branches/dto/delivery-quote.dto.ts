import { Type } from 'class-transformer';
import { IsArray, IsInt, IsLatitude, IsLongitude, IsUUID, Min, ValidateNested } from 'class-validator';

export class DeliveryQuoteItemDto {
  @IsUUID()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class DeliveryQuoteDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryQuoteItemDto)
  items: DeliveryQuoteItemDto[];
}
