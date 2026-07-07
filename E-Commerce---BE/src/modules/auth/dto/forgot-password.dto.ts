import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
    @IsEmail({}, { message: 'Invalid email address format' })
    @IsNotEmpty({ message: 'Email address must not be empty' })
    email: string;
}
