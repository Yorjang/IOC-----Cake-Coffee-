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

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const appUrl = process.env.EXPO_APP_URL || 'http://localhost:8081';
    const verificationUrl = `${appUrl}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"Sweet Bean Coffee & Cake" <${this.configService.get<string>('SMTP_USER')}>`,
      to,
      subject: 'Xác nhận đăng ký tài khoản - Sweet Bean Coffee & Cake',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #E0E0E0; border-radius: 16px; background-color: #FFFDF9;">
          <h2 style="color: #3E2723; text-align: center; font-size: 22px;">☕ XÁC NHẬN TÀI KHOẢN SWEET BEAN</h2>
          <p style="color: #5D4037; font-size: 15px;">Xin chào <strong>${to}</strong>,</p>
          <p style="color: #5D4037; font-size: 14px; line-height: 1.6;">Cảm ơn bạn đã đăng ký tài khoản tại <strong>Sweet Bean Coffee & Cake</strong>. Để kích hoạt tài khoản và tiến hành đăng nhập, vui lòng bấm vào nút bên dưới để xác nhận địa chỉ Gmail của bạn:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #D84315; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block;">XÁC NHẬN TÀI KHOẢN GMAIL</a>
          </div>
          <hr style="border: none; border-top: 1px solid #EEEEEE; margin: 25px 0;">
          <p style="color: #A1887F; font-size: 12px; text-align: center;">Thư này được gửi tự động từ hệ thống Sweet Bean Coffee & Cake.</p>
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
    const appUrl = process.env.EXPO_APP_URL || 'http://localhost:8081';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"Sweet Bean Coffee & Cake" <${this.configService.get<string>('SMTP_USER')}>`,
      to,
      subject: 'Đặt lại mật khẩu - Sweet Bean Coffee & Cake',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #E0E0E0; border-radius: 16px; background-color: #FFFDF9;">
          <h2 style="color: #3E2723; text-align: center; font-size: 22px;">ĐẶT LẠI MẬT KHẨU TÀI KHOẢN</h2>
          <p style="color: #5D4037; font-size: 15px;">Xin chào <strong>${to}</strong>,</p>
          <p style="color: #5D4037; font-size: 14px; line-height: 1.6;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Sweet Bean Coffee & Cake của bạn. Vui lòng bấm vào nút bên dưới để thiết lập mật khẩu mới:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #D84315; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block;">ĐẶT LẠI MẬT KHẨU GMAIL</a>
          </div>
          <p style="color: #8D6E63; font-size: 13px;">Liên kết đặt lại mật khẩu này sẽ hết hạn trong vòng 15 phút.</p>
          <p style="color: #8D6E63; font-size: 13px;">Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.</p>
          <hr style="border: none; border-top: 1px solid #EEEEEE; margin: 25px 0;">
          <p style="color: #A1887F; font-size: 12px; text-align: center;">Thư này được gửi tự động từ hệ thống Sweet Bean Coffee & Cake.</p>
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
