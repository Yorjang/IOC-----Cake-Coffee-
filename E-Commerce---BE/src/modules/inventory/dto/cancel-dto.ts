import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CancelReasonDto {
  @IsNotEmpty({ message: 'Lý do hủy không được để trống' })
  @IsString({ message: 'Lý do hủy phải là chuỗi ký tự' })
  @Length(3, 500, { message: 'Lý do hủy phải từ 3 đến 500 ký tự' })
  cancelReason: string;
}
