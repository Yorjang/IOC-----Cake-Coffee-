import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty({ message: 'Họ và tên không được để trống' })
    @MinLength(2, { message: 'Họ và tên phải có ít nhất 2 ký tự' })
    @Matches(/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠƯưăâêôơư\s]+$/, { message: 'Họ và tên chỉ được chứa chữ cái và khoảng trắng' })
    fullName: string;

    @IsEmail({}, { message: 'Email không đúng định dạng' })
    @IsOptional()
    @Matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/, { message: 'Email đăng ký phải là tài khoản Gmail (@gmail.com)' })
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

