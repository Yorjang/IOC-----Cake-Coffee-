import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleLoginDto {
  @IsNotEmpty()
  @IsString()
  idToken: string;

  @IsBoolean()
  @IsOptional()
  remember?: boolean;
}
