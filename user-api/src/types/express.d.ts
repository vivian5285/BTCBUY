declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      role: 'user' | 'merchant' | 'admin';
      iat: number;
      exp: number;
    };
  }
} 