import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AdjustmentRequestStatus } from '../entities/inventory-adjustment-request.entity';

export class QueryAdjustmentDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsEnum(AdjustmentRequestStatus)
  status?: AdjustmentRequestStatus;
}
