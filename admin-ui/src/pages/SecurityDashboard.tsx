import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  DatePicker,
  Space,
  Button,
  message
} from 'antd';
import { useRequest } from 'ahooks';
import { api } from '../api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const { RangePicker } = DatePicker;

interface SecurityMetrics {
  totalLoginAttempts: number;
  failedLoginAttempts: number;
  blockedIPs: number;
  blockedDevices: number;
  activeSessions: number;
  pendingVerifications: number;
}

interface SecurityEvent {
  id: string;
  type: string;
  timestamp: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'resolved' | 'ignored';
}

const SecurityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  // 获取安全指标
  const { run: fetchMetrics } = useRequest(
    () => api.get('/admin/security/metrics'),
    {
      onSuccess: (res) => setMetrics(res.data),
      onError: () => message.error('获取安全指标失败')
    }
  );

  // 获取安全事件
  const { run: fetchEvents } = useRequest(
    () => api.get('/admin/security/events'),
    {
      onSuccess: (res) => setEvents(res.data),
      onError: () => message.error('获取安全事件失败')
    }
  );

  // 获取图表数据
  const { run: fetchChartData } = useRequest(
    () => api.get('/admin/security/chart-data', {
      params: {
        startDate: dateRange?.[0].toISOString(),
        endDate: dateRange?.[1].toISOString()
      }
    }),
    {
      onSuccess: (res) => setChartData(res.data),
      onError: () => message.error('获取图表数据失败')
    }
  );

  useEffect(() => {
    fetchMetrics();
    fetchEvents();
    fetchChartData();
  }, [dateRange]);

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setDateRange([dates[0].toDate(), dates[1].toDate()]);
    } else {
      setDateRange(null);
    }
  };

  const handleEventStatusChange = async (eventId: string, status: string) => {
    try {
      await api.put(`/admin/security/events/${eventId}/status`, { status });
      message.success('更新事件状态成功');
      fetchEvents();
    } catch (error) {
      message.error('更新事件状态失败');
    }
  };

  const eventColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => new Date(timestamp).toLocaleString()
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details'
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const colors = {
          low: 'green',
          medium: 'orange',
          high: 'red',
          critical: 'purple'
        };
        return <Tag color={colors[severity as keyof typeof colors]}>{severity}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          pending: 'orange',
          resolved: 'green',
          ignored: 'gray'
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SecurityEvent) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                onClick={() => handleEventStatusChange(record.id, 'resolved')}
              >
                标记为已解决
              </Button>
              <Button
                type="link"
                danger
                onClick={() => handleEventStatusChange(record.id, 'ignored')}
              >
                忽略
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <RangePicker onChange={handleDateRangeChange} />
      </Space>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总登录尝试"
              value={metrics?.totalLoginAttempts}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="失败登录尝试"
              value={metrics?.failedLoginAttempts}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已封禁IP"
              value={metrics?.blockedIPs}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已封禁设备"
              value={metrics?.blockedDevices}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃会话"
              value={metrics?.activeSessions}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待验证操作"
              value={metrics?.pendingVerifications}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <h3>安全事件趋势</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="failedLogins"
              stroke="#ff4d4f"
              name="失败登录"
            />
            <Line
              type="monotone"
              dataKey="blockedIPs"
              stroke="#faad14"
              name="封禁IP"
            />
            <Line
              type="monotone"
              dataKey="securityEvents"
              stroke="#1890ff"
              name="安全事件"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <h3>最近安全事件</h3>
        <Table
          columns={eventColumns}
          dataSource={events}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default SecurityDashboard; 