import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @IsString({ message: 'Password must be a string' })
    @IsNotEmpty({ message: 'Password must not be empty' })
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;
}
export class ResetPasswordWithTokenDto extends ResetPasswordDto {
    @IsString({ message: 'Token must be a string' })
    @IsNotEmpty({ message: 'Token must not be empty' })
    token: string;
}
