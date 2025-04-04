import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, DatePicker, Spin, message } from 'antd';
import { Line } from '@ant-design/charts';
import axios from 'axios';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface CouponStats {
  totalCoupons: number;
  usedCoupons: number;
  expiredCoupons: number;
  activeCoupons: number;
  totalDiscount: number;
  usageByDay: {
    date: string;
    count: number;
    amount: number;
  }[];
}

const CouponStatistics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/merchant/coupon/statistics');
      setStats(response.data);
    } catch (error) {
      message.error('获取优惠券统计失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '使用次数',
      dataIndex: 'count',
      key: 'count'
    },
    {
      title: '优惠金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`
    }
  ];

  const config = {
    data: stats?.usageByDay || [],
    xField: 'date',
    yField: 'amount',
    seriesField: 'type',
    xAxis: {
      type: 'time',
      title: {
        text: '日期'
      }
    },
    yAxis: {
      title: {
        text: '优惠金额 (¥)'
      }
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: '优惠金额',
          value: `¥${datum.amount.toFixed(2)}`
        };
      }
    }
  };

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">优惠券统计</h2>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总优惠券数量"
              value={stats?.totalCoupons}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已使用优惠券"
              value={stats?.usedCoupons}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已过期优惠券"
              value={stats?.expiredCoupons}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="有效优惠券"
              value={stats?.activeCoupons}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="mt-6">
        <Statistic
          title="总优惠金额"
          value={stats?.totalDiscount}
          precision={2}
          prefix="¥"
          valueStyle={{ color: '#3f8600', fontSize: '24px' }}
        />
      </Card>

      <Card className="mt-6">
        <div className="mb-4">
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates) {
                setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs]);
              }
            }}
          />
        </div>
        <Line {...config} />
      </Card>

      <Card className="mt-6">
        <Table
          columns={columns}
          dataSource={stats?.usageByDay}
          rowKey="date"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default CouponStatistics; 