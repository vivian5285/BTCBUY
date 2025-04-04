# BTC 交易平台

一个完整的 BTC 交易平台，包含用户端和管理端。

## 项目结构

```
.
├── admin-ui/          # 管理后台前端
├── admin-api/         # 管理后台 API
├── user-ui/           # 用户端前端
├── user-api/          # 用户端 API
├── docs/              # 项目文档
├── nginx/             # Nginx 配置
├── scripts/           # 部署脚本
├── .env              # 环境变量配置
├── .env.production   # 生产环境变量配置
└── docker-compose.yml # Docker 编排配置
```

## 技术栈

### 前端
- React 18
- TypeScript
- Ant Design
- Tailwind CSS
- Vite
- Socket.IO Client
- RainbowKit
- Wagmi
- Viem

### 后端
- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- Redis
- Socket.IO
- JWT
- Winston

### 部署
- Docker
- Docker Compose
- Nginx
- GitHub Actions

## 环境要求

- Node.js >= 18
- Docker >= 20.10
- Docker Compose >= 2.0
- PostgreSQL >= 14
- Redis >= 6.0

## 快速开始

1. 克隆项目
```bash
git clone https://github.com/your-username/btcbuy.git
cd btcbuy
```

2. 配置环境变量
```bash
# 开发环境
cp .env.example .env
# 编辑 .env 文件，配置必要的环境变量

# 生产环境
cp .env.production .env
# 编辑 .env 文件，配置生产环境变量
```

3. 安装依赖
```bash
# 安装所有服务的依赖
npm install

# 或者分别安装各个服务的依赖
cd admin-ui && npm install
cd admin-api && npm install
cd user-ui && npm install
cd user-api && npm install
```

4. 启动服务
```bash
# 使用 Docker Compose 启动所有服务
npm run docker:up

# 或者分别启动各个服务
cd admin-ui && npm run dev
cd admin-api && npm run dev
cd user-ui && npm run dev
cd user-api && npm run dev
```

5. 访问服务
- 管理后台: http://localhost:3000
- 用户端: http://localhost:3001
- API 文档: http://localhost:3002/api-docs

## 开发指南

### 管理后台开发
```bash
cd admin-ui
npm install
npm run dev
```

### 管理 API 开发
```bash
cd admin-api
npm install
npm run dev
```

### 用户端开发
```bash
cd user-ui
npm install
npm run dev
```

### 用户 API 开发
```bash
cd user-api
npm install
npm run dev
```

## 部署

### 使用 Docker Compose 部署
```bash
# 构建镜像
npm run docker:build

# 启动服务
npm run docker:up

# 查看日志
npm run docker:logs

# 停止服务
npm run docker:down
```

### 手动部署
1. 构建前端
```bash
cd admin-ui && npm run build
cd user-ui && npm run build
```

2. 构建后端
```bash
cd admin-api && npm run build
cd user-api && npm run build
```

3. 启动服务
```bash
cd admin-api && npm run start
cd user-api && npm run start
```

## 数据库管理

```bash
# 生成 Prisma Client
npm run db:generate

# 执行数据库迁移
npm run db:migrate

# 填充测试数据
npm run db:seed
```

## 测试

```bash
# 运行所有测试
npm test

# 运行特定服务的测试
cd admin-ui && npm test
cd admin-api && npm test
cd user-ui && npm test
cd user-api && npm test
```

## 文档

详细文档请参考 `docs` 目录：
- [架构设计](docs/architecture.md)
- [API 文档](docs/api.md)
- [部署指南](docs/deployment.md)
- [开发指南](docs/development.md)
- [数据库设计](docs/database.md)
- [安全指南](docs/security.md)

## 监控和日志

- 使用 Winston 进行日志管理
- 使用 Prometheus 和 Grafana 进行监控
- 使用 Sentry 进行错误追踪

## 安全措施

- 使用 JWT 进行身份认证
- 实现 Rate Limiting
- 使用 HTTPS
- 实现 CORS 策略
- 数据加密存储
- 定期安全审计

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情 