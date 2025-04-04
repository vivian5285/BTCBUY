import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const instance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          // 权限不足
          console.error('权限不足');
          break;
        case 404:
          // 请求的资源不存在
          console.error('请求的资源不存在');
          break;
        case 500:
          // 服务器错误
          console.error('服务器错误');
          break;
        default:
          console.error('请求失败');
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  get: (url: string, config = {}) => instance.get(url, config),
  post: (url: string, data = {}, config = {}) => instance.post(url, data, config),
  put: (url: string, data = {}, config = {}) => instance.put(url, data, config),
  delete: (url: string, config = {}) => instance.delete(url, config)
};

// 安全相关的API类型定义
export interface SecurityMetrics {
  totalLoginAttempts: number;
  failedLoginAttempts: number;
  blockedIPs: number;
  blockedDevices: number;
  activeSessions: number;
  pendingVerifications: number;
}

export interface SecurityEvent {
  id: string;
  type: string;
  timestamp: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'resolved' | 'ignored';
}

export interface SecurityConfig {
  loginAttempts: number;
  lockoutDuration: number;
  passwordMinLength: number;
  passwordRequireSpecial: boolean;
  passwordRequireNumber: boolean;
  passwordRequireUppercase: boolean;
  sessionTimeout: number;
  ipWhitelist: string[];
  ipBlacklist: string[];
  twoFactorAuth: boolean;
  jwtExpiration: number;
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  type: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'inactive';
  actions: string[];
  createdAt: string;
  updatedAt: string;
}

// 安全相关的API请求函数
export const securityApi = {
  getMetrics: () => api.get<SecurityMetrics>('/admin/security/metrics'),
  getEvents: () => api.get<SecurityEvent[]>('/admin/security/events'),
  getChartData: (params: { startDate: string; endDate: string }) =>
    api.get('/admin/security/chart-data', { params }),
  getConfig: () => api.get<SecurityConfig>('/admin/security/config'),
  updateConfig: (data: SecurityConfig) =>
    api.put('/admin/security/config', data),
  getAlertRules: () => api.get<AlertRule[]>('/admin/security/alert-rules'),
  createAlertRule: (data: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post('/admin/security/alert-rules', data),
  updateAlertRule: (id: string, data: Partial<AlertRule>) =>
    api.put(`/admin/security/alert-rules/${id}`, data),
  deleteAlertRule: (id: string) =>
    api.delete(`/admin/security/alert-rules/${id}`),
  updateEventStatus: (id: string, status: string) =>
    api.put(`/admin/security/events/${id}/status`, { status })
}; 