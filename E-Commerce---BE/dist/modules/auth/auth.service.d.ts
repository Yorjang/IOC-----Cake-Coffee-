import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
export declare class AuthService {
    private readonly usersService;
    private readonly mailService;
    private readonly configService;
    private readonly logger;
    private readonly blacklistedTokens;
    constructor(usersService: UsersService, mailService: MailService, configService: ConfigService);
    private getJwtSecret;
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
            avatarUrl: string;
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
            avatarUrl: string;
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
            avatarUrl: string;
            phone: string;
            role: import("../users/entities/user.entity").UserRole;
            branchId: string;
            isActive: boolean;
            emailVerifiedAt: Date;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    logout(refreshToken: string): Promise<{
        message: string;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            fullName: string;
            email: string;
            avatarUrl: string;
            phone: string;
            role: import("../users/entities/user.entity").UserRole;
            branchId: string;
            isActive: boolean;
            emailVerifiedAt: Date;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    generateJwt(user: User): string;
    generateAccessToken(user: User): string;
    generateRefreshToken(user: User): string;
    private sanitizeUser;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(token: string, resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
