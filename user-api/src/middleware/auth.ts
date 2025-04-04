import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { User } from '../models';

const prisma = new PrismaClient();

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 创建速率限制器
const loginRateLimiter = new RateLimiterMemory({
  points: 5, // 5次尝试
  duration: 60 * 60, // 1小时
});

interface JwtPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// 验证JWT令牌
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // 检查用户是否存在且状态正常
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: '用户不存在或已被禁用' });
    }

    // 检查令牌是否在黑名单中
    const isBlacklisted = await prisma.tokenBlacklist.findUnique({
      where: { token },
    });

    if (isBlacklisted) {
      return res.status(401).json({ error: '令牌已失效' });
    }

    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
};

// 角色验证中间件
export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }

    next();
  };
};

// 登录速率限制中间件
export const loginRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = req.ip;
    await loginRateLimiter.consume(ip);
    next();
  } catch (error) {
    return res.status(429).json({ error: '登录尝试次数过多，请稍后再试' });
  }
};

// 会话验证中间件
export const validateSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    // 检查会话是否有效
    const session = await prisma.session.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      return res.status(401).json({ error: '会话已过期' });
    }

    // 更新会话最后活动时间
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivity: new Date() },
    });

    next();
  } catch (error) {
    return res.status(401).json({ error: '会话验证失败' });
  }
};

// 设备指纹验证中间件
export const validateDeviceFingerprint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deviceFingerprint = req.headers['x-device-fingerprint'];
    
    if (!deviceFingerprint) {
      return res.status(400).json({ error: '缺少设备指纹' });
    }

    // 检查设备是否在黑名单中
    const isDeviceBlacklisted = await prisma.deviceBlacklist.findUnique({
      where: { fingerprint: deviceFingerprint as string },
    });

    if (isDeviceBlacklisted) {
      return res.status(403).json({ error: '设备已被禁用' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: '设备验证失败' });
  }
};

// 敏感操作验证中间件
export const validateSensitiveOperation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sensitiveOperations = ['withdrawal', 'password_change', 'email_change'];
    const operation = req.path.split('/')[1];

    if (sensitiveOperations.includes(operation)) {
      // 检查是否需要二次验证
      const requiresVerification = await prisma.sensitiveOperation.findFirst({
        where: {
          userId: req.user?.id,
          operation,
          verified: false,
        },
      });

      if (requiresVerification) {
        return res.status(403).json({ 
          error: '需要二次验证',
          requiresVerification: true,
          operation 
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: '敏感操作验证失败' });
  }
};

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: '未授权' });
  }
}; 