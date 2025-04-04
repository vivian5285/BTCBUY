import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import storeRoutes from './routes/store.routes';
import depositRoutes from './routes/deposit.routes';
import walletRoutes from './routes/wallet';
import groupBuyRoutes from './routes/groupBuy.routes';
import groupRoutes from './routes/group';
import productRoutes from './routes/productRoutes';
import { startChainMonitor } from './services/chainMonitor';
import { startGroupStatusCheck } from './cron/checkGroupStatus';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/deposit', depositRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/group-buys', groupBuyRoutes);
app.use('/api/group', groupRoutes);
app.use('/api/products', productRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the User API' });
});

// Start server
app.listen(port, () => {
  console.log(`User API is running on port ${port}`);
  // 启动链上监听服务
  startChainMonitor();
  // 启动拼团状态检查
  startGroupStatusCheck();
});

// 优雅关闭
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
}); 