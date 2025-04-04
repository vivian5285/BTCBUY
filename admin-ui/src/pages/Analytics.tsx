import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, DatePicker, message } from 'antd';
import { analyticsService } from '../services/analyticsService';
import { AnalyticsResponse } from '../types/analytics';
import { Line } from '@ant-design/charts';

const { RangePicker } = DatePicker;

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [startDate, endDate] = dateRange || [];
      const response = await analyticsService.getSalesData(startDate, endDate);
      setData(response);
    } catch (error) {
      message.error('获取数据分析数据失败');
    } finally {
      setLoading(false);
    }
  };

  const salesDataConfig = {
    data: data?.salesData || [],
    xField: 'date',
    yField: 'totalSales',
    point: {
      size: 5,
      shape: 'diamond',
    },
    label: {
      style: {
        fill: '#aaa',
      },
    },
  };

  const columns = [
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '总销量',
      dataIndex: 'totalSales',
      key: 'totalSales',
    },
    {
      title: '总订单数',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
    },
    {
      title: '总收入',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
    },
    {
      title: '平均评分',
      dataIndex: 'averageRating',
      key: 'averageRating',
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card>
            <RangePicker onChange={(dates) => setDateRange(dates)} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总销售额"
              value={data?.summary.totalRevenue}
              prefix="¥"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总订单数"
              value={data?.summary.totalOrders}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均订单金额"
              value={data?.summary.averageOrderValue}
              prefix="¥"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃用户数"
              value={data?.summary.activeUsers}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card title="销售趋势">
            <Line {...salesDataConfig} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card title="产品分析">
            <Table
              columns={columns}
              dataSource={data?.productAnalytics}
              rowKey="productId"
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics; 