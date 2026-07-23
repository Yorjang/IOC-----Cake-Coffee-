import { IsEnum, IsOptional } from 'class-validator';

export enum VnpayBankCode {
  VNPAYQR = 'VNPAYQR',
  VNBANK = 'VNBANK',
  INTCARD = 'INTCARD',
}

export enum VnpayLocale {
  VIETNAMESE = 'vn',
  ENGLISH = 'en',
}

export class CreateVnpayPaymentDto {
  @IsOptional()
  @IsEnum(VnpayBankCode)
  bankCode?: VnpayBankCode;

  @IsOptional()
  @IsEnum(VnpayLocale)
  locale: VnpayLocale = VnpayLocale.VIETNAMESE;
}
