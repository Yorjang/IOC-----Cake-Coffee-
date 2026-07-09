import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, IsUUID } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
    name: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsInt()
    @IsOptional()
    sortOrder?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateCategoryDto {
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
    imageUrl?: string;

    @IsInt()
    @IsOptional()
    sortOrder?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
