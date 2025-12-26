import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { ResetPasswordEmail } from '@repo/email';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST') || 'smtp.ethereal.email',
      port: Number(this.configService.get('SMTP_PORT')) || 587,
      auth: {
        user: this.configService.get('SMTP_USER') || 'ethereal_user',
        pass: this.configService.get('SMTP_PASS') || 'ethereal_pass',
      },
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    // In a real staging/prod env w/o credentials, we might force logging.
    // But for now, let's try to send via Ethereal or configured SMTP.

    // Ethereal Only: Create test account if no credentials (on the fly logic if needed, 
    // but better to just fail or log if empty). 
    // For simplicity, let's assume we use the transporter.

    try {
      const emailHtml = await render(ResetPasswordEmail({
        userFirstname: 'User', // We can update signature to accept name
        resetPasswordLink: resetLink
      }));

      const info = await this.transporter.sendMail({
        from: '"Lumina Library" <noreply@lumina.library>',
        to: email,
        subject: 'Reset your password',
        html: emailHtml,
      });

      this.logger.log(`Password Reset Email sent: ${info.messageId}`);

      // If using Ethereal, log the preview URL
      if (nodemailer.getTestMessageUrl(info)) {
        this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      return true;
    } catch (error) {
      this.logger.error('Failed to send email', error);
      // Fallback to console log for dev reliability if SMTP fails
      this.logger.log(`[FALLBACK] Reset Link: ${resetLink}`);
      return false;
    }
  }
}

