import { IsInt, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AdminAdjustPointsDto {
  @IsNotEmpty({ message: 'User ID không được để trống' })
  @IsUUID('4', { message: 'User ID phải là dạng UUID' })
  userId: string;

  @IsNotEmpty({ message: 'Số điểm không được để trống' })
  @IsInt({ message: 'Số điểm phải là số nguyên' })
  points: number;

  @IsNotEmpty({ message: 'Lý do điều chỉnh không được để trống' })
  @IsString({ message: 'Lý do phải là chuỗi ký tự' })
  reason: string;
}
