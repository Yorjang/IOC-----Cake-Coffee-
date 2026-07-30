import { IsUUID, IsInt, Min, Max, IsString, IsOptional } from 'class-validator';

export class CreateOrderReviewDto {
  @IsUUID()
  orderId: string;

  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  comment: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
