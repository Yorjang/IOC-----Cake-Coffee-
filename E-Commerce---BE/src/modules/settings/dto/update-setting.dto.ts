import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateSettingDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsOptional()
  value?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class BulkUpdateSettingsDto {
  settings: UpdateSettingDto[];
}
