import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';

export class ComboItemDto {
    @IsUUID('4')
    childProductId: string;

    @IsUUID('4')
    @IsOptional()
    childVariantId?: string;

    @Type(() => Number)
    @IsInt()
    @IsPositive()
    quantity: number;

    @IsBoolean()
    @IsOptional()
    isOptional?: boolean;
}

export class CreateComboDto {
    @IsUUID('4')
    categoryId: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    slug?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    sku: string;

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 0 })
    @Min(0)
    price: number;

    @IsArray()
    @ArrayMinSize(1, { message: 'Combo phải có ít nhất một sản phẩm thành phần' })
    @ValidateNested({ each: true })
    @Type(() => ComboItemDto)
    items: ComboItemDto[];
}

export class UpdateComboDto {
    @IsUUID('4')
    @IsOptional()
    categoryId?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    @IsOptional()
    name?: string;

    @IsString()
    @MaxLength(255)
    @IsOptional()
    slug?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    @IsOptional()
    sku?: string;

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 0 })
    @Min(0)
    @IsOptional()
    price?: number;

    @IsArray()
    @ArrayMinSize(1, { message: 'Combo phải có ít nhất một sản phẩm thành phần' })
    @ValidateNested({ each: true })
    @Type(() => ComboItemDto)
    @IsOptional()
    items?: ComboItemDto[];
}
