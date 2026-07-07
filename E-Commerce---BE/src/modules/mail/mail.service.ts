import { Injectable, Logger } from '@nestjs/common';
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

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const clientUrl = this.configService.get<string>('CLIENT_URL') || 'http://localhost:3000';
    // Directly verification endpoint (which is hosted on the same server)
    const verificationUrl = `${clientUrl}/auth/verify-email?token=${token}`;

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
            <a href="${verificationUrl}" style="background-color: #D4A373; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
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
      throw new Error(`Email delivery failed: ${error.message}. Please check your SMTP configuration in .env.`);
    }
  }
}
