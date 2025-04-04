import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// 通用API限制
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制100次请求
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
});

// 登录接口限制
export const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 限制5次尝试
  message: '登录尝试次数过多，请1小时后再试',
  standardHeaders: true,
  legacyHeaders: false,
});

// 提现接口限制
export const withdrawalLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24小时
  max: 3, // 限制3次提现请求
  message: '提现请求次数过多，请24小时后再试',
  standardHeaders: true,
  legacyHeaders: false,
});

// 验证码接口限制
export const captchaLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 3, // 限制3次请求
  message: '验证码请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
});

// 内容创建限制
export const contentCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 限制10次内容创建
  message: '内容创建次数过多，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
});

// 评论限制
export const commentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5, // 限制5次评论
  message: '评论过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
});

// 文件上传限制
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 20, // 限制20次上传
  message: '上传次数过多，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
});

// IP黑名单检查中间件
export const ipBlacklistCheck = async (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  
  // TODO: 从数据库或缓存中检查IP是否在黑名单中
  // 这里需要实现IP黑名单检查逻辑
  
  next();
};

// 敏感操作验证中间件
export const sensitiveOperationCheck = async (req: Request, res: Response, next: NextFunction) => {
  const sensitiveOperations = ['withdrawal', 'password_change', 'email_change'];
  
  if (sensitiveOperations.includes(req.path)) {
    // TODO: 实现敏感操作验证逻辑
    // 例如: 要求用户重新输入密码、发送验证码等
  }
  
  next();
}; 