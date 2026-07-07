import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        message: string;
        email: string;
        requiresVerification: boolean;
        user?: undefined;
        accessToken?: undefined;
    } | {
        message: string;
        user: {
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
        };
        accessToken: string;
        email?: undefined;
        requiresVerification?: undefined;
    }>;
    verifyEmail(token: string): Promise<{
        message: string;
        accessToken: string;
        user: {
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
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        message: string;
        accessToken: string;
        refreshToken: string;
        user: {
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
        };
    }>;
    refresh(refreshDto: RefreshDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
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
        };
    }>;
}
