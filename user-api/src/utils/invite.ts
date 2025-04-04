import crypto from 'crypto';

export const generateInviteCode = (): string => {
  // 生成8位随机字符串
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}; 