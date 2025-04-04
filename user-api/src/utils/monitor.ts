import axios from 'axios';
import logger from './logger';

interface AlertConfig {
  webhook: string;
  threshold: {
    cpu: number;
    memory: number;
    disk: number;
    responseTime: number;
  };
}

class MonitorService {
  private config: AlertConfig;
  private lastAlertTime: { [key: string]: number } = {};
  private alertCooldown = 5 * 60 * 1000; // 5分钟冷却时间

  constructor(config: AlertConfig) {
    this.config = config;
  }

  // 检查系统资源使用情况
  async checkSystemResources() {
    try {
      const cpuUsage = process.cpuUsage();
      const memoryUsage = process.memoryUsage();
      const diskUsage = await this.getDiskUsage();

      // CPU使用率超过阈值
      if (cpuUsage.user + cpuUsage.system > this.config.threshold.cpu) {
        await this.sendAlert('CPU使用率过高', {
          cpu: cpuUsage,
          memory: memoryUsage,
          disk: diskUsage,
        });
      }

      // 内存使用率超过阈值
      if (memoryUsage.heapUsed / memoryUsage.heapTotal > this.config.threshold.memory) {
        await this.sendAlert('内存使用率过高', {
          cpu: cpuUsage,
          memory: memoryUsage,
          disk: diskUsage,
        });
      }

      // 磁盘使用率超过阈值
      if (diskUsage > this.config.threshold.disk) {
        await this.sendAlert('磁盘使用率过高', {
          cpu: cpuUsage,
          memory: memoryUsage,
          disk: diskUsage,
        });
      }
    } catch (error) {
      logger.error('系统资源检查失败', error);
    }
  }

  // 监控API响应时间
  async monitorApiResponseTime(req: any, res: any, next: any) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      // 响应时间超过阈值
      if (duration > this.config.threshold.responseTime) {
        this.sendAlert('API响应时间过长', {
          path: req.path,
          method: req.method,
          duration,
        });
      }
    });
    
    next();
  }

  // 监控错误率
  async monitorErrorRate(errorCount: number, totalRequests: number) {
    const errorRate = errorCount / totalRequests;
    
    if (errorRate > 0.1) { // 错误率超过10%
      await this.sendAlert('API错误率过高', {
        errorCount,
        totalRequests,
        errorRate,
      });
    }
  }

  // 发送告警
  private async sendAlert(title: string, data: any) {
    const now = Date.now();
    const alertKey = `${title}-${JSON.stringify(data)}`;
    
    // 检查是否在冷却时间内
    if (this.lastAlertTime[alertKey] && now - this.lastAlertTime[alertKey] < this.alertCooldown) {
      return;
    }
    
    try {
      await axios.post(this.config.webhook, {
        title,
        data,
        timestamp: new Date().toISOString(),
      });
      
      this.lastAlertTime[alertKey] = now;
      logger.info(`告警已发送: ${title}`, data);
    } catch (error) {
      logger.error('告警发送失败', error);
    }
  }

  // 获取磁盘使用率
  private async getDiskUsage(): Promise<number> {
    // 这里需要根据实际操作系统实现
    // 示例实现
    return 0.5; // 返回0-1之间的值
  }
}

// 创建监控服务实例
export const monitorService = new MonitorService({
  webhook: process.env.ALERT_WEBHOOK || 'http://localhost:3000/alerts',
  threshold: {
    cpu: 80, // 80%
    memory: 80, // 80%
    disk: 80, // 80%
    responseTime: 1000, // 1秒
  },
}); 