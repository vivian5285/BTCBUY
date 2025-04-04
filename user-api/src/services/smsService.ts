import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SMSConfig {
  apiKey: string;
  apiSecret: string;
  signName: string;
  templateCode: string;
  endpoint: string;
}

export class SMSService {
  private static config: SMSConfig = {
    apiKey: process.env.SMS_API_KEY || '',
    apiSecret: process.env.SMS_API_SECRET || '',
    signName: process.env.SMS_SIGN_NAME || 'BTCBuy',
    templateCode: process.env.SMS_TEMPLATE_CODE || '',
    endpoint: process.env.SMS_ENDPOINT || 'https://dysmsapi.aliyuncs.com',
  };

  // 发送短信
  static async sendSMS(phoneNumber: string, templateParam: Record<string, string>) {
    try {
      const params = {
        PhoneNumbers: phoneNumber,
        SignName: this.config.signName,
        TemplateCode: this.config.templateCode,
        TemplateParam: JSON.stringify(templateParam),
      };

      const response = await axios.post(this.config.endpoint, params, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.Code === 'OK';
    } catch (error) {
      console.error('发送短信失败:', error);
      return false;
    }
  }

  // 发送安全告警短信
  static async sendSecurityAlertSMS(
    phoneNumber: string,
    alertType: string,
    severity: string
  ) {
    const templateParam = {
      alertType,
      severity,
      time: new Date().toLocaleString(),
    };

    return this.sendSMS(phoneNumber, templateParam);
  }

  // 发送验证码短信
  static async sendVerificationCodeSMS(phoneNumber: string, code: string) {
    const templateParam = {
      code,
      time: '5分钟',
    };

    return this.sendSMS(phoneNumber, templateParam);
  }

  // 发送系统通知短信
  static async sendSystemNotificationSMS(
    phoneNumber: string,
    title: string,
    message: string
  ) {
    const templateParam = {
      title,
      message,
      time: new Date().toLocaleString(),
    };

    return this.sendSMS(phoneNumber, templateParam);
  }
} 