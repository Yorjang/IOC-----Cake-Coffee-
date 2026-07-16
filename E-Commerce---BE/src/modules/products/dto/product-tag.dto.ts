import { ArrayUnique, IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateProductTagDto {
    @IsString()
    @IsNotEmpty({ message: 'Tên tag không được để trống' })
    @MaxLength(100)
    name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    @IsOptional()
    slug?: string;
}

export class UpdateProductTagDto {
    @IsString()
    @IsNotEmpty({ message: 'Tên tag không được để trống' })
    @MaxLength(100)
    @IsOptional()
    name?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    @IsOptional()
    slug?: string;
}

export class ReplaceProductTagsDto {
    @IsArray()
    @ArrayUnique()
    @IsUUID('4', { each: true })
    tagIds: string[];
}
