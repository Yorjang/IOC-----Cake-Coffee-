import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly usersService;
    constructor(usersService: UsersService);
    register(registerDto: RegisterDto): Promise<{
        id: string;
        fullName: string;
        email: string;
        phone: string;
        role: import("../users/entities/user.entity").UserRole;
        branchId: string;
        isActive: boolean;
        emailVerifiedAt: Date;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
