import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../user.entity';

export class UpdateRoleDto {
  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(UserRole, { message: 'Invalid role value' })
  role: UserRole;
}
