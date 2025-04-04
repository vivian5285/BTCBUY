import { NotificationStorageService } from './notificationStorageService';
import { WebSocketService } from './websocketService';
import { EmailService } from './emailService';
import { SMSService } from './smsService';

export type NotificationChannel = 'EMAIL' | 'SMS' | 'SYSTEM' | 'WEBSOCKET';

export class UnifiedNotificationService {
  private static instance: UnifiedNotificationService;
  private emailService: EmailService;
  private smsService: SMSService;

  private constructor() {
    this.emailService = new EmailService();
    this.smsService = new SMSService();
  }

  public static getInstance(): UnifiedNotificationService {
    if (!UnifiedNotificationService.instance) {
      UnifiedNotificationService.instance = new UnifiedNotificationService();
    }
    return UnifiedNotificationService.instance;
  }

  // 发送安全提醒
  public async sendSecurityAlert(
    userId: string,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    const preferences = await NotificationStorageService.getNotificationPreferences(userId);
    
    // 创建系统通知
    await NotificationStorageService.createNotification({
      userId,
      type: 'SECURITY',
      title,
      message,
      data
    });

    // 根据用户偏好发送通知
    if (preferences.email) {
      await this.emailService.sendSecurityAlert(userId, title, message);
    }
    if (preferences.sms) {
      await this.smsService.sendSecurityAlert(userId, title, message);
    }
    if (preferences.websocket) {
      WebSocketService.sendNotification(userId, {
        type: 'SECURITY',
        title,
        message,
        data
      });
    }
  }

  // 发送系统通知
  public async sendSystemNotification(
    userId: string,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    const preferences = await NotificationStorageService.getNotificationPreferences(userId);
    
    // 创建系统通知
    await NotificationStorageService.createNotification({
      userId,
      type: 'SYSTEM',
      title,
      message,
      data
    });

    // 根据用户偏好发送通知
    if (preferences.email) {
      await this.emailService.sendSystemNotification(userId, title, message);
    }
    if (preferences.sms) {
      await this.smsService.sendSystemNotification(userId, title, message);
    }
    if (preferences.websocket) {
      WebSocketService.sendNotification(userId, {
        type: 'SYSTEM',
        title,
        message,
        data
      });
    }
  }

  // 发送验证码
  public async sendVerificationCode(
    userId: string,
    code: string,
    type: 'EMAIL' | 'SMS'
  ): Promise<void> {
    if (type === 'EMAIL') {
      await this.emailService.sendVerificationCode(userId, code);
    } else {
      await this.smsService.sendVerificationCode(userId, code);
    }
  }

  // 发送密码重置链接
  public async sendPasswordReset(
    userId: string,
    resetToken: string
  ): Promise<void> {
    await this.emailService.sendPasswordReset(userId, resetToken);
  }
} 