import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateRoleDto {
  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(UserRole, { message: 'Invalid role value' })
  role: UserRole;
}
