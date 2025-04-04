# BTCBuy 用户端API服务

用户端API服务提供用户相关的所有接口，包括用户管理、商品浏览、订单处理等功能。

## 目录结构

```
user-api/
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

### 1. 用户管理
- 用户注册
- 用户登录
- 个人信息管理
- 密码修改
- 邮箱验证

### 2. 商品系统
- 商品列表
- 商品详情
- 商品搜索
- 商品分类
- 商品收藏

### 3. 订单系统
- 购物车管理
- 订单创建
- 订单支付
- 订单查询
- 物流跟踪

### 4. 直播系统
- 直播列表
- 直播详情
- 直播互动
- 福袋抽奖
- 直播数据

### 5. 团购系统
- 团购列表
- 团购详情
- 发起团购
- 参与团购
- 团购管理

### 6. 佣金系统
- 分销关系
- 佣金计算
- 佣金提现
- 佣金记录

### 7. 通知系统
- 系统通知
- 订单通知
- 直播通知
- 通知设置

## API文档

### 基础信息
- 基础URL: `http://localhost:3000/api`
- 认证方式: Bearer Token
- 响应格式: JSON

### 认证相关
```
POST /auth/register     # 用户注册
POST /auth/login       # 用户登录
POST /auth/logout      # 用户登出
GET  /auth/profile     # 获取用户信息
PUT  /auth/profile     # 更新用户信息
```

### 商品相关
```
GET  /products         # 获取商品列表
GET  /products/:id     # 获取商品详情
GET  /products/search  # 搜索商品
GET  /categories       # 获取商品分类
POST /favorites       # 添加收藏
DELETE /favorites/:id # 取消收藏
```

### 订单相关
```
POST /orders          # 创建订单
GET  /orders          # 获取订单列表
GET  /orders/:id      # 获取订单详情
POST /orders/:id/pay  # 支付订单
GET  /cart           # 获取购物车
POST /cart           # 添加购物车
PUT  /cart/:id       # 更新购物车
DELETE /cart/:id     # 删除购物车
```

### 直播相关
```
GET  /lives          # 获取直播列表
GET  /lives/:id      # 获取直播详情
POST /lives/:id/join # 加入直播
POST /lives/:id/like # 点赞直播
GET  /lives/:id/gift # 获取礼物列表
POST /lives/:id/gift # 发送礼物
```

### 团购相关
```
GET  /groups         # 获取团购列表
GET  /groups/:id     # 获取团购详情
POST /groups         # 发起团购
POST /groups/:id/join # 参与团购
GET  /groups/my      # 我的团购
```

### 佣金相关
```
GET  /commissions    # 获取佣金列表
GET  /commissions/stats # 获取佣金统计
POST /commissions/withdraw # 申请提现
GET  /referral/info  # 获取推荐信息
GET  /referral/link  # 获取推荐链接
```

### 通知相关
```
GET  /notifications  # 获取通知列表
PUT  /notifications/:id/read # 标记通知已读
PUT  /notifications/read-all # 标记所有通知已读
DELETE /notifications/:id   # 删除通知
GET  /notifications/preferences # 获取通知设置
PUT  /notifications/preferences # 更新通知设置
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
docker build -t btcbuy-user-api .
docker run -p 3000:3000 btcbuy-user-api
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
PORT=3000
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