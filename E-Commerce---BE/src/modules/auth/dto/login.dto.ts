import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
    @IsEmail({}, { message: 'Email không đúng định dạng' })
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    @Matches(/^(0|84|\+84)[35789][0-9]{8}$/, { message: 'Số điện thoại Việt Nam không hợp lệ' })
    phone?: string;

    @IsString()
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, { message: 'Mật khẩu phải chứa cả chữ cái và chữ số' })
    password: string;
}
