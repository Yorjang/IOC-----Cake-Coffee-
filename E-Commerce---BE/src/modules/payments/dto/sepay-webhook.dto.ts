import { IsNumber, IsString, IsOptional } from 'class-validator';

export class SepayWebhookDto {
  @IsNumber()
  id: number;

  @IsString()
  gateway: string;

  @IsString()
  transactionDate: string;

  @IsString()
  accountNumber: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  content: string;

  @IsString()
  transferType: string;

  @IsNumber()
  transferAmount: number;

  @IsString()
  @IsOptional()
  referenceCode?: string;
}
