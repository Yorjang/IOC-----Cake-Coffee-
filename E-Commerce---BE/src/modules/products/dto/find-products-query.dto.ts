import { IsOptional, IsString, IsUUID } from 'class-validator';

export class FindProductsQueryDto {
    @IsOptional()
    @IsString()
    tag?: string;

    @IsOptional()
    @IsUUID('4')
    branchId?: string;
}
