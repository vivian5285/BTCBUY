import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth';

const prisma = new PrismaClient();

interface ConnectedClient {
  userId: string;
  socketId: string;
  reconnectAttempts: number;
  lastPing: number;
}

export class WebSocketService {
  private static io: Server;
  private static connectedClients: Map<string, ConnectedClient> = new Map();
  private static readonly MAX_RECONNECT_ATTEMPTS = 5;
  private static readonly PING_INTERVAL = Number(process.env.WS_PING_INTERVAL) || 25000;
  private static readonly PING_TIMEOUT = Number(process.env.WS_PING_TIMEOUT) || 5000;

  static initialize(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      },
      pingInterval: this.PING_INTERVAL,
      pingTimeout: this.PING_TIMEOUT
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('未提供认证令牌'));
        }

        const decoded = await verifyToken(token);
        socket.data.userId = decoded.userId;
        next();
      } catch (error) {
        next(new Error('认证失败'));
      }
    });

    this.io.on('connection', (socket) => {
      const userId = socket.data.userId;
      this.connectedClients.set(socket.id, {
        userId,
        socketId: socket.id,
        reconnectAttempts: 0,
        lastPing: Date.now()
      });

      // 处理ping
      socket.on('ping', () => {
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.lastPing = Date.now();
          socket.emit('pong');
        }
      });

      // 处理断开连接
      socket.on('disconnect', (reason) => {
        const client = this.connectedClients.get(socket.id);
        if (client) {
          if (reason === 'io server disconnect') {
            // 服务器主动断开连接
            this.connectedClients.delete(socket.id);
          } else if (client.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
            // 客户端断开连接，尝试重连
            client.reconnectAttempts++;
            setTimeout(() => {
              socket.connect();
            }, 1000 * client.reconnectAttempts);
          } else {
            // 超过最大重连次数
            this.connectedClients.delete(socket.id);
          }
        }
      });

      // 处理重连成功
      socket.on('reconnect', () => {
        const client = this.connectedClients.get(socket.id);
        if (client) {
          client.reconnectAttempts = 0;
          client.lastPing = Date.now();
        }
      });
    });

    // 定期检查客户端连接状态
    setInterval(() => {
      const now = Date.now();
      this.connectedClients.forEach((client, socketId) => {
        if (now - client.lastPing > this.PING_TIMEOUT) {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.disconnect(true);
          }
        }
      });
    }, this.PING_INTERVAL);
  }

  static sendNotification(userId: string, notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    const client = Array.from(this.connectedClients.values())
      .find(client => client.userId === userId);

    if (client) {
      this.io.to(client.socketId).emit('notification', notification);
    }
  }

  static broadcastNotification(notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    this.io.emit('notification', notification);
  }

  static sendOrderUpdate(merchantId: string, orderUpdate: {
    orderId: string;
    status: string;
    details: any;
  }) {
    const client = Array.from(this.connectedClients.values())
      .find(client => client.userId === merchantId);

    if (client) {
      this.io.to(client.socketId).emit('orderUpdate', orderUpdate);
    }
  }

  static sendSecurityAlert(alert: {
    type: string;
    severity: string;
    message: string;
    details: any;
  }) {
    // 发送给所有管理员
    const adminClients = Array.from(this.connectedClients.values())
      .filter(client => client.userId.startsWith('admin_'));

    adminClients.forEach(client => {
      this.io.to(client.socketId).emit('securityAlert', alert);
    });
  }
} 