import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { VariantStatus } from '../product-variant.entity';

export class CreateProductVariantDto {
    @IsString()
    @IsNotEmpty({ message: 'SKU không được để trống' })
    sku: string;

    @IsString()
    @IsNotEmpty({ message: 'Tên biến thể không được để trống' })
    variantName: string;

    @IsString()
    @IsOptional()
    size?: string;

    @IsString()
    @IsOptional()
    flavor?: string;

    @IsString()
    @IsOptional()
    topping?: string;

    @IsNumber({}, { message: 'Giá phải là dạng số' })
    @Min(0, { message: 'Giá không được âm' })
    price: number;

    @IsEnum(VariantStatus, { message: 'Trạng thái không hợp lệ' })
    @IsOptional()
    status?: VariantStatus;

    @IsString()
    @IsOptional()
    imageUrl?: string;
}

export class UpdateProductVariantDto {
    @IsString()
    @IsOptional()
    sku?: string;

    @IsString()
    @IsOptional()
    variantName?: string;

    @IsString()
    @IsOptional()
    size?: string;

    @IsString()
    @IsOptional()
    flavor?: string;

    @IsString()
    @IsOptional()
    topping?: string;

    @IsNumber({}, { message: 'Giá phải là dạng số' })
    @Min(0, { message: 'Giá không được âm' })
    @IsOptional()
    price?: number;

    @IsEnum(VariantStatus, { message: 'Trạng thái không hợp lệ' })
    @IsOptional()
    status?: VariantStatus;

    @IsString()
    @IsOptional()
    imageUrl?: string;
}
