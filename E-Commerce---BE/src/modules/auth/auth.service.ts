import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  private getJwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET') || 'super_secret_jwt_key_123_cake_coffee';
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
    const { passwordHash: _, ...result } = newUser;
    return {
      message: 'Registration successful.',
      user: result,
      accessToken: loginToken,
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
      throw new BadRequestException('Please verify your email or contact support to activate your account');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
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

  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, this.getJwtSecret()) as {
        sub: string;
      };

      const user = await this.usersService.findById(decoded.sub);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (!user.isActive) {
        throw new BadRequestException('User account is inactive');
      }

      const accessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

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
    return jwt.sign(
      { sub: user.id, email: user.email, phone: user.phone, role: user.role },
      this.getJwtSecret(),
      { expiresIn: '15m' },
    );
  }

  generateRefreshToken(user: User): string {
    return jwt.sign(
      { sub: user.id },
      this.getJwtSecret(),
      { expiresIn: '7d' },
    );
  }

  private sanitizeUser(user: User) {
    const { passwordHash: _, ...result } = user;
    return result;
  }
}
