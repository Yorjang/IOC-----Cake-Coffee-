"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const mail_service_1 = require("../mail/mail.service");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
let AuthService = AuthService_1 = class AuthService {
    constructor(usersService, mailService, configService) {
        this.usersService = usersService;
        this.mailService = mailService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthService_1.name);
        this.blacklistedTokens = new Set();
    }
    getJwtSecret() {
        return this.configService.get('JWT_SECRET') || 'super_secret_jwt_key_123_cake_coffee';
    }
    async register(registerDto) {
        const saltOrRounds = 10;
        const passwordHash = await bcrypt.hash(registerDto.password, saltOrRounds);
        const newUser = await this.usersService.create({
            ...registerDto,
            password: passwordHash,
        });
        if (newUser.email) {
            try {
                const token = jwt.sign({ userId: newUser.id, email: newUser.email, purpose: 'email-verification' }, this.getJwtSecret(), { expiresIn: '24h' });
                await this.mailService.sendVerificationEmail(newUser.email, token);
                return {
                    message: 'Registration successful. A verification email has been sent to your inbox.',
                    email: newUser.email,
                    requiresVerification: true,
                };
            }
            catch (error) {
                this.logger.error(`Error during registration email process: ${error.message}`);
                throw new common_1.BadRequestException(`User created, but failed to send verification email: ${error.message}`);
            }
        }
        const loginToken = this.generateJwt(newUser);
        const { passwordHash: _, ...result } = newUser;
        return {
            message: 'Registration successful.',
            user: result,
            accessToken: loginToken,
        };
    }
    async verifyEmail(token) {
        try {
            const decoded = jwt.verify(token, this.getJwtSecret());
            if (decoded.purpose !== 'email-verification') {
                throw new common_1.BadRequestException('Invalid token purpose');
            }
            const user = await this.usersService.findByEmail(decoded.email);
            if (!user) {
                throw new common_1.BadRequestException('User not found');
            }
            if (user.isActive && user.emailVerifiedAt) {
                return {
                    message: 'Email already verified.',
                    accessToken: this.generateJwt(user),
                    user: this.sanitizeUser(user),
                };
            }
            const updatedUser = await this.usersService.update(user.id, {
                isActive: true,
                emailVerifiedAt: new Date(),
            });
            const accessToken = this.generateJwt(updatedUser);
            return {
                message: 'Email verified successfully. Your account is now active.',
                accessToken,
                user: this.sanitizeUser(updatedUser),
            };
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new common_1.BadRequestException('Verification token has expired. Please register again.');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new common_1.BadRequestException('Invalid verification token.');
            }
            throw error;
        }
    }
    async login(loginDto) {
        const { email, phone, password } = loginDto;
        if (!email && !phone) {
            throw new common_1.BadRequestException('Email or phone must be provided');
        }
        let user = null;
        if (email) {
            user = await this.usersService.findByEmail(email);
        }
        else if (phone) {
            user = await this.usersService.findByPhone(phone);
        }
        if (!user) {
            throw new common_1.BadRequestException('Invalid credentials');
        }
        if (!user.isActive) {
            throw new common_1.BadRequestException('Please verify your email or contact support to activate your account');
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.BadRequestException('Invalid credentials');
        }
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        return {
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: this.sanitizeUser(user),
        };
    }
    async logout(refreshToken) {
        if (this.blacklistedTokens.has(refreshToken)) {
            return { message: 'Đăng xuất thành công.' };
        }
        try {
            jwt.verify(refreshToken, this.getJwtSecret());
            this.blacklistedTokens.add(refreshToken);
            return { message: 'Đăng xuất thành công.' };
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new common_1.BadRequestException('Mã token đã hết hạn.');
            }
            throw new common_1.BadRequestException('Mã token không hợp lệ.');
        }
    }
    async refresh(refreshToken) {
        if (this.blacklistedTokens.has(refreshToken)) {
            throw new common_1.BadRequestException('Mã token đã bị vô hiệu hóa hoặc người dùng đã đăng xuất.');
        }
        try {
            const decoded = jwt.verify(refreshToken, this.getJwtSecret());
            const user = await this.usersService.findById(decoded.sub);
            if (!user) {
                throw new common_1.BadRequestException('User not found');
            }
            if (!user.isActive) {
                throw new common_1.BadRequestException('User account is inactive');
            }
            const accessToken = this.generateAccessToken(user);
            const newRefreshToken = this.generateRefreshToken(user);
            return {
                accessToken,
                refreshToken: newRefreshToken,
                user: this.sanitizeUser(user),
            };
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new common_1.BadRequestException('Refresh token has expired. Please login again.');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new common_1.BadRequestException('Invalid refresh token.');
            }
            throw error;
        }
    }
    generateJwt(user) {
        return this.generateAccessToken(user);
    }
    generateAccessToken(user) {
        return jwt.sign({ sub: user.id, email: user.email, phone: user.phone, role: user.role }, this.getJwtSecret(), { expiresIn: '15m' });
    }
    generateRefreshToken(user) {
        return jwt.sign({ sub: user.id }, this.getJwtSecret(), { expiresIn: '7d' });
    }
    sanitizeUser(user) {
        const { passwordHash: _, ...result } = user;
        return result;
    }
    async forgotPassword(forgotPasswordDto) {
        const { email } = forgotPasswordDto;
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return {
                message: 'Nếu địa chỉ email tồn tại trên hệ thống, một liên kết đặt lại mật khẩu đã được gửi qua email.',
            };
        }
        const secret = this.getJwtSecret() + user.passwordHash;
        const token = jwt.sign({ sub: user.id, email: user.email, purpose: 'password-reset' }, secret, { expiresIn: '15m' });
        try {
            await this.mailService.sendResetPasswordEmail(user.email, token);
            return {
                message: 'Nếu địa chỉ email tồn tại trên hệ thống, một liên kết đặt lại mật khẩu đã được gửi qua email.',
            };
        }
        catch (error) {
            this.logger.error(`Error sending password reset email to ${email}: ${error.message}`);
            throw new common_1.BadRequestException(`Failed to send password reset email: ${error.message}`);
        }
    }
    async resetPassword(token, resetPasswordDto) {
        const { password } = resetPasswordDto;
        let decoded;
        try {
            decoded = jwt.decode(token);
        }
        catch (error) {
            throw new common_1.BadRequestException('Invalid password reset token format.');
        }
        if (!decoded || !decoded.sub || decoded.purpose !== 'password-reset') {
            throw new common_1.BadRequestException('Invalid password reset token.');
        }
        const user = await this.usersService.findById(decoded.sub);
        if (!user) {
            throw new common_1.BadRequestException('User not found.');
        }
        try {
            const secret = this.getJwtSecret() + user.passwordHash;
            jwt.verify(token, secret);
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new common_1.BadRequestException('Password reset token has expired.');
            }
            throw new common_1.BadRequestException('Invalid or already used password reset token.');
        }
        const saltOrRounds = 10;
        const newPasswordHash = await bcrypt.hash(password, saltOrRounds);
        await this.usersService.update(user.id, {
            passwordHash: newPasswordHash,
        });
        return {
            message: 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập lại.',
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        mail_service_1.MailService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map