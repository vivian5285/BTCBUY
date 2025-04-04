import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createNotification } from '../controllers/notification';

const prisma = new PrismaClient();

// 自定义错误类
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// 错误处理中间件
export const errorHandler = async (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('错误详情:', err);

  // 如果是自定义错误
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
      status: 'error'
    });
  }

  // Prisma错误处理
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      message: '数据库操作错误',
      code: 'DB_ERROR',
      status: 'error'
    });
  }

  // JWT错误处理
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: '无效的认证令牌',
      code: 'INVALID_TOKEN',
      status: 'error'
    });
  }

  // 默认服务器错误
  return res.status(500).json({
    message: '服务器内部错误',
    code: 'INTERNAL_SERVER_ERROR',
    status: 'error'
  });
};

// 异步错误处理包装器
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404错误处理
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    message: '请求的资源不存在',
    code: 'NOT_FOUND',
    status: 'error'
  });
}; 