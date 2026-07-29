import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { ProductType } from '../product.entity';
import { CreateProductVariantDto } from './product-variant.dto';

export class CreateProductDto {
    @IsUUID('4', { message: 'ID danh mục phải là định dạng UUID' })
    @IsNotEmpty({ message: 'Danh mục không được để trống' })
    categoryId: string;

    @IsString()
    @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
    name: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    ingredientsInfo?: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsEnum(ProductType, { message: 'Loại sản phẩm không hợp lệ' })
    @IsNotEmpty({ message: 'Loại sản phẩm không được để trống' })
    productType: ProductType;

    @IsBoolean()
    @IsOptional()
    requiresNote?: boolean;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateProductVariantDto)
    variants?: CreateProductVariantDto[];

    @IsUUID('4')
    @IsOptional()
    branchId?: string;
}

export class UpdateProductDto {
    @IsUUID('4', { message: 'ID danh mục phải là định dạng UUID' })
    @IsOptional()
    categoryId?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    ingredientsInfo?: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsEnum(ProductType, { message: 'Loại sản phẩm không hợp lệ' })
    @IsOptional()
    productType?: ProductType;

    @IsBoolean()
    @IsOptional()
    requiresNote?: boolean;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsUUID('4')
    @IsOptional()
    branchId?: string;
}
