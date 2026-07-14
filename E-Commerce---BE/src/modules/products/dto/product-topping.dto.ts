import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';

export class ProductToppingDto {
    @IsString()
    @MinLength(1)
    @MaxLength(120)
    name: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsInt()
    @Min(0)
    @IsOptional()
    sortOrder?: number;
}

export class ReplaceProductToppingsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductToppingDto)
    toppings: ProductToppingDto[];
}
