import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
