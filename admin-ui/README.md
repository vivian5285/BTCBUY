# BTCBuy 管理端界面

管理端界面提供后台管理功能，包括商户管理、订单管理、用户管理等功能。

## 目录结构

```
admin-ui/
├── src/
│   ├── components/    # 公共组件
│   ├── pages/        # 页面组件
│   ├── api/          # API接口
│   ├── types/        # 类型定义
│   ├── utils/        # 工具函数
│   └── theme/        # 主题配置
├── public/           # 静态资源
├── Dockerfile        # Docker配置
└── package.json      # 项目配置
```

## 主要功能模块

### 1. 仪表盘
- 数据概览
- 实时统计
- 趋势图表
- 异常监控

### 2. 商户管理
- 商户列表
- 商户审核
- 商户详情
- 商户统计
- 商户黑名单

### 3. 订单管理
- 订单列表
- 订单详情
- 订单处理
- 订单统计
- 退款处理

### 4. 用户管理
- 用户列表
- 用户详情
- 用户封禁
- 用户统计
- 用户行为分析

### 5. 商品管理
- 商品审核
- 商品列表
- 商品分类
- 商品统计
- 商品下架

### 6. 直播管理
- 直播审核
- 直播列表
- 直播数据
- 直播统计
- 违规处理

### 7. 佣金管理
- 佣金规则
- 佣金审核
- 佣金统计
- 提现管理
- 佣金报表

### 8. 系统管理
- 系统配置
- 安全设置
- 日志管理
- 通知管理
- 数据备份

### 9. 安全管理
- 安全监控
- 安全配置
- 告警规则
- 黑名单管理
- 操作日志

## 技术栈

- React 18
- TypeScript
- Ant Design
- TailwindCSS
- Vite
- Socket.IO Client
- Axios
- ECharts

## 开发指南

### 环境要求
- Node.js >= 18
- npm >= 8

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

### 预览
```bash
npm run preview
```

## 部署

### Docker部署
```bash
docker build -t btcbuy-admin-ui .
docker run -p 80:80 btcbuy-admin-ui
```

### 环境变量配置
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
```

## 路由说明

### 基础路由
```
/                   # 仪表盘
/merchants          # 商户管理
/orders             # 订单管理
/users              # 用户管理
/products           # 商品管理
/lives              # 直播管理
/commission         # 佣金管理
/system             # 系统管理
/security           # 安全管理
```

### 安全管理路由
```
/security/dashboard  # 安全监控
/security/config     # 安全配置
/security/alert-rules # 告警规则
```

## 组件说明

### 公共组件
- `Layout`: 页面布局组件
- `Sidebar`: 侧边栏组件
- `Header`: 头部组件
- `NotificationBell`: 通知铃铛组件
- `DataTable`: 数据表格组件
- `ChartCard`: 图表卡片组件

### 业务组件
- `MerchantList`: 商户列表组件
- `OrderList`: 订单列表组件
- `UserList`: 用户列表组件
- `ProductList`: 商品列表组件
- `LiveList`: 直播列表组件
- `CommissionList`: 佣金列表组件

## 状态管理

使用React Context进行状态管理，主要包括：
- 用户认证状态
- 系统配置状态
- 通知状态
- 主题状态

## 主题定制

支持自定义主题，包括：
- 主色调
- 字体
- 圆角
- 阴影
- 间距

## 数据可视化

使用ECharts实现数据可视化，包括：
- 销售趋势图
- 用户增长图
- 订单统计图
- 佣金分布图
- 实时监控图

## 安全措施

- 权限控制
- 操作审计
- 敏感信息加密
- 请求限流
- 输入验证

## 测试

### 单元测试
```bash
npm test
```

### 覆盖率报告
```bash
npm run test:coverage
```

### E2E测试
```bash
npm run test:e2e
```

## 性能优化

- 路由懒加载
- 组件按需加载
- 数据缓存
- 虚拟滚动
- 图片优化

## 监控告警

- 系统监控
- 性能监控
- 错误监控
- 用户行为监控
- 安全事件监控 