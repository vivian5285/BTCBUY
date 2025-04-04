# BTCBuy 管理端API服务

管理端API服务提供后台管理相关的所有接口，包括商户管理、订单管理、用户管理等功能。

## 目录结构

```
admin-api/
├── src/
│   ├── controllers/    # 控制器
│   ├── routes/        # 路由
│   ├── services/      # 服务层
│   ├── middleware/    # 中间件
│   └── utils/         # 工具函数
├── prisma/            # 数据库模型
├── Dockerfile         # Docker配置
└── package.json       # 项目配置
```

## 主要功能模块

### 1. 商户管理
- 商户审核
- 商户列表
- 商户详情
- 商户统计
- 商户黑名单

### 2. 订单管理
- 订单列表
- 订单详情
- 订单处理
- 订单统计
- 退款处理

### 3. 用户管理
- 用户列表
- 用户详情
- 用户封禁
- 用户统计
- 用户行为分析

### 4. 商品管理
- 商品审核
- 商品列表
- 商品分类
- 商品统计
- 商品下架

### 5. 直播管理
- 直播审核
- 直播列表
- 直播数据
- 直播统计
- 违规处理

### 6. 佣金管理
- 佣金规则
- 佣金审核
- 佣金统计
- 提现管理
- 佣金报表

### 7. 系统管理
- 系统配置
- 安全设置
- 日志管理
- 通知管理
- 数据备份

## API文档

### 基础信息
- 基础URL: `http://localhost:3001/api`
- 认证方式: Bearer Token
- 响应格式: JSON

### 认证相关
```
POST /auth/login       # 管理员登录
POST /auth/logout      # 管理员登出
GET  /auth/profile     # 获取管理员信息
PUT  /auth/profile     # 更新管理员信息
PUT  /auth/password    # 修改密码
```

### 商户管理
```
GET  /merchants        # 获取商户列表
GET  /merchants/:id    # 获取商户详情
POST /merchants/:id/approve # 审核商户
POST /merchants/:id/reject  # 拒绝商户
GET  /merchants/stats  # 获取商户统计
PUT  /merchants/:id/status # 更新商户状态
```

### 订单管理
```
GET  /orders          # 获取订单列表
GET  /orders/:id      # 获取订单详情
PUT  /orders/:id/status # 更新订单状态
POST /orders/:id/refund # 处理退款
GET  /orders/stats    # 获取订单统计
```

### 用户管理
```
GET  /users           # 获取用户列表
GET  /users/:id       # 获取用户详情
PUT  /users/:id/status # 更新用户状态
GET  /users/stats     # 获取用户统计
GET  /users/behavior  # 获取用户行为分析
```

### 商品管理
```
GET  /products        # 获取商品列表
GET  /products/:id    # 获取商品详情
POST /products/:id/approve # 审核商品
POST /products/:id/reject  # 拒绝商品
PUT  /products/:id/status  # 更新商品状态
GET  /products/stats  # 获取商品统计
```

### 直播管理
```
GET  /lives           # 获取直播列表
GET  /lives/:id       # 获取直播详情
POST /lives/:id/approve # 审核直播
POST /lives/:id/reject  # 拒绝直播
PUT  /lives/:id/status  # 更新直播状态
GET  /lives/stats     # 获取直播统计
```

### 佣金管理
```
GET  /commissions     # 获取佣金列表
GET  /commissions/:id # 获取佣金详情
POST /commissions/:id/approve # 审核佣金
POST /commissions/:id/reject  # 拒绝佣金
GET  /commissions/stats # 获取佣金统计
PUT  /commissions/rules # 更新佣金规则
```

### 系统管理
```
GET  /system/config   # 获取系统配置
PUT  /system/config   # 更新系统配置
GET  /system/logs     # 获取系统日志
GET  /system/backup   # 获取备份列表
POST /system/backup   # 创建备份
```

## 开发指南

### 环境要求
- Node.js >= 18
- MongoDB >= 4.4
- Redis >= 6.0

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建
```bash
npm run build
```

### 启动服务
```bash
npm start
```

### 数据库迁移
```bash
npx prisma migrate dev
```

## 部署

### Docker部署
```bash
docker build -t btcbuy-admin-api .
docker run -p 3001:3001 btcbuy-admin-api
```

### 环境变量配置
```env
# 数据库配置
DATABASE_URL="mongodb://localhost:27017/btcbuy"

# JWT配置
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="24h"

# Redis配置
REDIS_URL="redis://localhost:6379"

# 服务配置
PORT=3001
NODE_ENV=development
```

## 测试

### 运行测试
```bash
npm test
```

### 运行测试覆盖率报告
```bash
npm run test:coverage
``` 