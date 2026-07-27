import { IsOptional, IsUUID } from 'class-validator';

export class FindCombosQueryDto {
  @IsOptional()
  @IsUUID('4')
  branchId?: string;
}
