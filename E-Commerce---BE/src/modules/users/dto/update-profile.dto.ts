import { IsOptional, IsString, IsNotEmpty, Matches } from 'class-validator';

export class UpdateProfileDto {
    @IsString()
    @IsNotEmpty({ message: 'Họ tên không được để trống' })
    @IsOptional()
    fullName?: string;

    @IsString()
    @IsOptional()
    avatar?: string;

    @IsString()
    @IsOptional()
    @Matches(/^(0|84|\+84)[35789][0-9]{8}$/, { message: 'Số điện thoại không hợp lệ' })
    phone?: string;
}
