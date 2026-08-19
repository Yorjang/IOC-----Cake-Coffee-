import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { DataSource } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly blacklistedTokens = new Set<string>();

  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    // Create revoked_tokens table if not exists (for BUG-001)
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS revoked_tokens (
        token TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Load existing revoked tokens into memory for fast lookup
    try {
      const rows = await this.dataSource.query(`SELECT token FROM revoked_tokens`);
      for (const row of rows) {
        this.blacklistedTokens.add(row.token);
      }
    } catch (err) {
      this.logger.error('Failed to load revoked tokens', err);
    }
  }

  private getJwtSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) throw new InternalServerErrorException('JWT_SECRET environment variable is not configured!');
    return secret;
  }

  async register(registerDto: RegisterDto) {
    const saltOrRounds = 10;
    const passwordHash = await bcrypt.hash(registerDto.password, saltOrRounds);

    const newUser = await this.usersService.create({
      ...registerDto,
      password: passwordHash,
    });

    if (newUser.email) {
      try {
        // Generate a verification token valid for 24h
        const token = jwt.sign(
          { userId: newUser.id, email: newUser.email, purpose: 'email-verification' },
          this.getJwtSecret(),
          { expiresIn: '24h' },
        );

        // Send verification email
        await this.mailService.sendVerificationEmail(newUser.email, token);

        return {
          message: 'Registration successful. A verification email has been sent to your inbox.',
          email: newUser.email,
          requiresVerification: true,
        };
      } catch (error: any) {
        this.logger.error(`Error during registration email process: ${error.message}`);
        throw new BadRequestException(`User created, but failed to send verification email: ${error.message}`);
      }
    }

    // If phone-only registration, they are active immediately
    const loginToken = this.generateJwt(newUser);
    const refreshToken = this.generateRefreshToken(newUser);
    const { passwordHash: _, ...result } = newUser;
    return {
      message: 'Registration successful.',
      user: result,
      accessToken: loginToken,
      refreshToken,
    };
  }

  async verifyEmail(token: string) {
    try {
      const decoded = jwt.verify(token, this.getJwtSecret()) as {
        userId: string;
        email: string;
        purpose: string;
      };

      if (decoded.purpose !== 'email-verification') {
        throw new BadRequestException('Invalid token purpose');
      }

      // Check user status
      const user = await this.usersService.findByEmail(decoded.email);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.isActive && user.emailVerifiedAt) {
        return {
          message: 'Email already verified.',
          accessToken: this.generateJwt(user),
          user: this.sanitizeUser(user),
        };
      }

      // Update user to active
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
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new BadRequestException('Verification token has expired. Please register again.');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new BadRequestException('Invalid verification token.');
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const { email, phone, password } = loginDto;

    if (!email && !phone) {
      throw new BadRequestException('Email or phone must be provided');
    }

    let user: User | null = null;
    if (email) {
      user = await this.usersService.findByEmail(email);
    } else if (phone) {
      user = await this.usersService.findByPhone(phone);
    }

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new BadRequestException('Tài khoản chưa được kích hoạt. Vui lòng mở hộp thư Gmail để bấm xác nhận tài khoản trước khi đăng nhập.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user, !!loginDto.remember);

    return {
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async googleLogin(idToken: string, remember = false) {
    try {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (!response.ok) {
          throw new BadRequestException('Mã xác thực Google không hợp lệ hoặc đã hết hạn.');
        }
        const payload = (await response.json()) as {
          email: string;
          name?: string;
          aud: string;
        };

        const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        if (googleClientId && googleClientId !== 'your-google-client-id.apps.googleusercontent.com' && payload.aud !== googleClientId) {
          throw new BadRequestException('Mã client ID của Google không trùng khớp.');
        }

      const email = payload.email;
      const fullName = payload.name || 'Người dùng Google';

      if (!email) {
        throw new BadRequestException('Không thể lấy thông tin email từ Google.');
      }

      let user = await this.usersService.findByEmail(email);
      if (!user) {
        const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
        const saltOrRounds = 10;
        const passwordHash = await bcrypt.hash(randomPassword, saltOrRounds);

        user = await this.usersService.create({
          fullName,
          email,
          phone: undefined as any,
          password: passwordHash,
        });

        user = await this.usersService.update(user.id, {
          isActive: true,
          emailVerifiedAt: new Date(),
        });
      }

      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user, remember);

      return {
        message: 'Đăng nhập Google thành công.',
        accessToken,
        refreshToken,
        user: this.sanitizeUser(user),
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Xác thực Google thất bại: ${error.message}`);
    }
  }

  async logout(refreshToken: string) {
    if (this.blacklistedTokens.has(refreshToken)) {
      return { message: 'Đăng xuất thành công.' };
    }
    try {
      jwt.verify(refreshToken, this.getJwtSecret());
      this.blacklistedTokens.add(refreshToken);
      this.dataSource.query(`INSERT INTO revoked_tokens (token) VALUES ($1) ON CONFLICT DO NOTHING`, [refreshToken])
        .catch(err => this.logger.error('Failed to persist revoked token', err));
      return { message: 'Đăng xuất thành công.' };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new BadRequestException('Mã token đã hết hạn.');
      }
      throw new BadRequestException('Mã token không hợp lệ.');
    }
  }

  async refresh(refreshToken: string) {
    if (this.blacklistedTokens.has(refreshToken)) {
      throw new BadRequestException('Mã token đã bị vô hiệu hóa hoặc người dùng đã đăng xuất.');
    }
    try {
      const decoded = jwt.verify(refreshToken, this.getJwtSecret()) as {
        sub: string;
        pwdSign?: string;
        remember?: boolean;
      };

      const user = await this.usersService.findById(decoded.sub);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (!user.isActive) {
        throw new BadRequestException('User account is inactive');
      }

      if (decoded.pwdSign) {
        const currentPwdSign = crypto.createHash('sha256').update(user.passwordHash).digest('hex');
        if (decoded.pwdSign !== currentPwdSign) {
          throw new BadRequestException('Phiên đăng nhập đã hết hạn do thay đổi mật khẩu. Vui lòng đăng nhập lại.');
        }
      }

      const accessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user, !!decoded.remember);

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new BadRequestException('Refresh token has expired. Please login again.');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new BadRequestException('Invalid refresh token.');
      }
      throw error;
    }
  }

  generateJwt(user: User): string {
    return this.generateAccessToken(user);
  }

  generateAccessToken(user: User): string {
    const pwdSign = crypto.createHash('sha256').update(user.passwordHash).digest('hex');
    return jwt.sign(
      { sub: user.id, email: user.email, phone: user.phone, role: user.role, pwdSign },
      this.getJwtSecret(),
      { expiresIn: '1d' },
    );
  }

  generateRefreshToken(user: User, remember = false): string {
    const pwdSign = crypto.createHash('sha256').update(user.passwordHash).digest('hex');
    return jwt.sign(
      { sub: user.id, pwdSign, remember },
      this.getJwtSecret(),
      { expiresIn: remember ? '1d' : '10m' },
    );
  }

  private sanitizeUser(user: User) {
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.isActive) {
      // Return successful response to prevent user enumeration attacks
      return {
        message: 'Nếu địa chỉ email tồn tại trên hệ thống, một liên kết đặt lại mật khẩu đã được gửi qua email.',
      };
    }

    // Generate a reset token valid for 15 minutes
    // The secret is global JWT_SECRET plus the user's passwordHash.
    // That way, once they reset their password, the token immediately becomes invalid (single-use token).
    const secret = this.getJwtSecret() + user.passwordHash;
    const token = jwt.sign(
      { sub: user.id, email: user.email, purpose: 'password-reset' },
      secret,
      { expiresIn: '15m' },
    );

    try {
      await this.mailService.sendResetPasswordEmail(user.email, token);
      return {
        message: 'Nếu địa chỉ email tồn tại trên hệ thống, một liên kết đặt lại mật khẩu đã được gửi qua email.',
      };
    } catch (error: any) {
      this.logger.error(`Error sending password reset email to ${email}: ${error.message}`);
      throw new BadRequestException(`Failed to send password reset email: ${error.message}`);
    }
  }

  async resetPassword(token: string, resetPasswordDto: ResetPasswordDto) {
    const { password } = resetPasswordDto;

    let decoded: any;
    try {
      // Decode without verification first to get the sub (userId)
      decoded = jwt.decode(token);
    } catch (error) {
      throw new BadRequestException('Invalid password reset token format.');
    }

    if (!decoded || !decoded.sub || decoded.purpose !== 'password-reset') {
      throw new BadRequestException('Invalid password reset token.');
    }

    const user = await this.usersService.findById(decoded.sub);
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (!user.isActive) {
      throw new BadRequestException('Tài khoản của bạn chưa được kích hoạt hoặc đã bị khóa.');
    }

    // Verify the token with the correct secret (which contains user's current passwordHash)
    try {
      const secret = this.getJwtSecret() + user.passwordHash;
      jwt.verify(token, secret);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new BadRequestException('Password reset token has expired.');
      }
      throw new BadRequestException('Invalid or already used password reset token.');
    }

    // Update password
    const saltOrRounds = 10;
    const newPasswordHash = await bcrypt.hash(password, saltOrRounds);

    await this.usersService.update(user.id, {
      passwordHash: newPasswordHash,
    });

    return {
      message: 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập lại.',
    };
  }
}
