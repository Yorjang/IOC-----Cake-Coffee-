import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;
}
