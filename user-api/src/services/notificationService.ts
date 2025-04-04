import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

interface NotificationParams {
  userId: string;
  type: string;
  title: string;
  content: string;
}

export class NotificationService {
  private static emailConfig: EmailConfig = {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.SMTP_FROM || 'noreply@example.com',
  };

  private static transporter = nodemailer.createTransport(this.emailConfig);

  // 发送邮件通知
  static async sendEmail(to: string, subject: string, content: string) {
    try {
      await this.transporter.sendMail({
        from: this.emailConfig.from,
        to,
        subject,
        html: content,
      });
      return true;
    } catch (error) {
      console.error('发送邮件失败:', error);
      return false;
    }
  }

  // 发送安全告警邮件
  static async sendSecurityAlertEmail(
    to: string,
    alertType: string,
    details: string,
    severity: string
  ) {
    const subject = `[安全告警] ${alertType} - ${severity}`;
    const content = `
      <h2>安全告警通知</h2>
      <p><strong>告警类型:</strong> ${alertType}</p>
      <p><strong>严重程度:</strong> ${severity}</p>
      <p><strong>详细信息:</strong></p>
      <pre>${details}</pre>
      <p><strong>时间:</strong> ${new Date().toLocaleString()}</p>
      <p>请及时处理此告警。</p>
    `;

    return this.sendEmail(to, subject, content);
  }

  // 发送系统通知邮件
  static async sendSystemNotificationEmail(
    to: string,
    title: string,
    message: string
  ) {
    const subject = `[系统通知] ${title}`;
    const content = `
      <h2>${title}</h2>
      <p>${message}</p>
      <p><strong>时间:</strong> ${new Date().toLocaleString()}</p>
    `;

    return this.sendEmail(to, subject, content);
  }

  // 发送验证码邮件
  static async sendVerificationCodeEmail(to: string, code: string) {
    const subject = '验证码';
    const content = `
      <h2>验证码</h2>
      <p>您的验证码是: <strong>${code}</strong></p>
      <p>验证码有效期为5分钟。</p>
      <p>如果这不是您的操作，请忽略此邮件。</p>
    `;

    return this.sendEmail(to, subject, content);
  }

  // 发送密码重置邮件
  static async sendPasswordResetEmail(to: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = '密码重置';
    const content = `
      <h2>密码重置</h2>
      <p>您请求重置密码，请点击下面的链接进行重置：</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>此链接有效期为1小时。</p>
      <p>如果这不是您的操作，请忽略此邮件。</p>
    `;

    return this.sendEmail(to, subject, content);
  }

  // 创建系统通知
  static async createNotification(params: NotificationParams) {
    try {
      const { userId, type, title, content } = params;
      
      // 创建通知记录
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message: content,
          read: false,
        },
      });

      // 获取用户邮箱
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      // 如果用户有邮箱，发送邮件通知
      if (user?.email) {
        await this.sendSystemNotificationEmail(user.email, title, content);
      }

      return notification;
    } catch (error) {
      console.error('创建通知失败:', error);
      throw new Error('创建通知失败，请重试');
    }
  }
} 