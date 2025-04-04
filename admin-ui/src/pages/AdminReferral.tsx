import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Tag, Space, DatePicker, Select, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getAllReferralCommissions } from '../api/admin';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const AdminReferral: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    dateRange: null,
    type: undefined,
    userId: '',
  });

  useEffect(() => {
    fetchCommissions();
  }, [filters, pagination.current]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const data = await getAllReferralCommissions({
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
      });
      setCommissions(data.items);
      setPagination(prev => ({
        ...prev,
        total: data.total,
      }));
    } catch (error) {
      console.error('获取佣金记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  const columns = [
    {
      title: '订单ID',
      dataIndex: ['order', 'orderNo'],
      key: 'orderNo',
    },
    {
      title: '来源用户',
      dataIndex: ['fromUser', 'email'],
      key: 'fromUser',
    },
    {
      title: '获得佣金用户',
      dataIndex: ['toUser', 'email'],
      key: 'toUser',
    },
    {
      title: '佣金金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '佣金类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={
          type === 'user_order' ? 'blue' :
          type === 'merchant_order' ? 'green' :
          'purple'
        }>
          {type === 'user_order' ? '用户订单' :
           type === 'merchant_order' ? '商家订单' :
           '带货订单'}
        </Tag>
      ),
    },
    {
      title: '推荐级别',
      dataIndex: 'level',
      key: 'level',
      render: (level: number) => (
        <Tag color={level === 1 ? 'blue' : 'purple'}>
          {level === 1 ? '一级推荐' : '二级推荐'}
        </Tag>
      ),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <Title level={2}>分佣记录管理</Title>
        
        <Space className="mb-4" size="large">
          <RangePicker
            onChange={(dates) => {
              setFilters(prev => ({
                ...prev,
                dateRange: dates,
              }));
            }}
          />
          
          <Select
            style={{ width: 120 }}
            placeholder="佣金类型"
            allowClear
            onChange={(value) => {
              setFilters(prev => ({
                ...prev,
                type: value,
              }));
            }}
          >
            <Select.Option value="user_order">用户订单</Select.Option>
            <Select.Option value="merchant_order">商家订单</Select.Option>
            <Select.Option value="creator_order">带货订单</Select.Option>
          </Select>

          <Input
            placeholder="用户ID/邮箱"
            prefix={<SearchOutlined />}
            allowClear
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                userId: e.target.value,
              }));
            }}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={commissions}
          rowKey="id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default AdminReferral; 