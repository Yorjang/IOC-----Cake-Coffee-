import { UserRole } from '../entities/user.entity';
export declare class UpdateUserDto {
    fullName?: string;
    email?: string | null;
    phone?: string | null;
    role?: UserRole;
    isActive?: boolean;
}
