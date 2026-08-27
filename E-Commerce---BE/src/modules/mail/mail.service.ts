import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  private getClientUrl(): string {
    const clientUrl = this.configService.get<string>('CLIENT_URL')?.trim();
    if (!clientUrl) {
      throw new InternalServerErrorException(
        'CLIENT_URL environment variable is not configured. Set it to the public application domain.',
      );
    }

    try {
      const parsedUrl = new URL(clientUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Unsupported URL protocol');
      }

      if (
        this.configService.get<string>('NODE_ENV') === 'production' &&
        ['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname)
      ) {
        throw new Error('Localhost URL is not allowed in production');
      }
    } catch {
      throw new InternalServerErrorException(
        'CLIENT_URL must be a valid public HTTP(S) application URL.',
      );
    }

    return clientUrl;
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const clientUrl = this.getClientUrl();
    const verificationUrl = new URL('/auth/verify-email', clientUrl);
    verificationUrl.searchParams.set('token', token);

    const mailOptions = {
      from: `"Cake & Coffee Shop" <${this.configService.get<string>('SMTP_USER')}>`,
      to,
      subject: 'Verify Your Email Address - Cake & Coffee Shop',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4A3E3D; text-align: center;">Welcome to Cake & Coffee!</h2>
          <p>Hi there,</p>
          <p>Thank you for registering. Please click the button below to verify your email address and activate your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl.toString()}" style="background-color: #D4A373; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
          </div>
          <br>
          <p>Best regards,<br>Cake & Coffee Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent successfully to ${to}`);
    } catch (error: any) {
      this.logger.error(`Failed to send verification email to ${to}: ${error.message}`);
      throw new InternalServerErrorException(`Email delivery failed: ${error.message}. Please check your SMTP configuration in .env.`);
    }
  }

  async sendResetPasswordEmail(to: string, token: string): Promise<void> {
    const clientUrl = this.getClientUrl();
    const resetUrl = new URL('/reset-password', clientUrl);
    resetUrl.searchParams.set('token', token);

    const mailOptions = {
      from: `"Cake & Coffee Shop" <${this.configService.get<string>('SMTP_USER')}>`,
      to,
      subject: 'Reset Your Password - Cake & Coffee Shop',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4A3E3D; text-align: center;">Reset Your Password</h2>
          <p>Hi there,</p>
          <p>We received a request to reset your password for your Cake & Coffee Shop account. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl.toString()}" style="background-color: #D4A373; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>This password reset link will expire in 15 minutes.</p>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Or copy and paste this link in your browser:</p>
          <p><a href="${resetUrl.toString()}">${resetUrl.toString()}</a></p>
          <br>
          <p>Best regards,<br>Cake & Coffee Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent successfully to ${to}`);
    } catch (error: any) {
      this.logger.error(`Failed to send password reset email to ${to}: ${error.message}`);
      throw new InternalServerErrorException(`Email delivery failed: ${error.message}. Please check your SMTP configuration in .env.`);
    }
  }
}
