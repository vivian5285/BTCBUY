import React, { useState, useEffect } from 'react';
import { Table, Card, Button, message, Modal, Input, Typography, Tag, Select, DatePicker, Space } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getAllWithdrawals, processWithdrawal } from '../api/admin';

const { Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const WithdrawReview: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [txHash, setTxHash] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    status: undefined,
    userId: '',
    dateRange: null,
  });

  useEffect(() => {
    fetchWithdrawals();
  }, [filters, pagination.current]);

  const fetchWithdrawals = async (page = 1) => {
    try {
      setLoading(true);
      const data = await getAllWithdrawals({
        page,
        limit: pagination.pageSize,
        ...filters,
      });
      setWithdrawals(data.items);
      setPagination({
        ...pagination,
        current: page,
        total: data.total,
      });
    } catch (error) {
      message.error('获取提现记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (status: 'completed' | 'rejected') => {
    if (!selectedWithdrawal) return;

    try {
      setLoading(true);
      await processWithdrawal(selectedWithdrawal.id, status, txHash);
      message.success('处理成功');
      setIsModalVisible(false);
      fetchWithdrawals();
    } catch (error) {
      message.error('处理失败');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (withdrawal: any) => {
    setSelectedWithdrawal(withdrawal);
    setTxHash('');
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
    },
    {
      title: '提现金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount.toFixed(2)}`,
    },
    {
      title: '钱包地址',
      dataIndex: 'walletAddress',
      key: 'walletAddress',
    },
    {
      title: '链',
      dataIndex: 'chain',
      key: 'chain',
      render: (chain: string) => chain.toUpperCase(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          pending: { color: 'gold', text: '待审核' },
          completed: { color: 'green', text: '已完成' },
          rejected: { color: 'red', text: '已拒绝' },
        };
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '交易哈希',
      dataIndex: 'txHash',
      key: 'txHash',
      render: (txHash: string) => txHash || '-',
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => {
        if (record.status !== 'pending') return null;
        return (
          <Space>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => showModal(record)}
            >
              审核
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <Title level={4}>提现审核</Title>
        <Space className="mb-4" size="large">
          <Select
            style={{ width: 120 }}
            placeholder="状态筛选"
            allowClear
            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          >
            <Option value="pending">待审核</Option>
            <Option value="completed">已完成</Option>
            <Option value="rejected">已拒绝</Option>
          </Select>

          <Input
            placeholder="用户ID"
            prefix={<SearchOutlined />}
            allowClear
            onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
          />

          <RangePicker
            onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={withdrawals}
          rowKey="id"
          pagination={pagination}
          loading={loading}
          onChange={(pagination) => fetchWithdrawals(pagination.current)}
        />
      </Card>

      <Modal
        title="处理提现申请"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleProcess('rejected')}
          >
            拒绝
          </Button>,
          <Button
            key="complete"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleProcess('completed')}
            disabled={!txHash}
          >
            通过
          </Button>,
        ]}
      >
        <div className="mb-4">
          <p>提现金额: ¥{selectedWithdrawal?.amount.toFixed(2)}</p>
          <p>钱包地址: {selectedWithdrawal?.walletAddress}</p>
          <p>链: {selectedWithdrawal?.chain.toUpperCase()}</p>
        </div>
        <TextArea
          rows={4}
          placeholder="请输入交易哈希"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default WithdrawReview; 