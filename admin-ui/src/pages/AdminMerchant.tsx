import React, { useState, useEffect } from 'react';
import { Table, Card, Button, message, Modal, Input, Typography, Tag, Space, DatePicker } from 'antd';
import { CheckOutlined, CloseOutlined, DownloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { layoutStyles } from '../theme';
import { getMerchants, approveMerchant, rejectMerchant, exportMerchantData } from '../api/admin';
import { Merchant, MerchantResponse } from '../types/merchant';
import type { TablePaginationConfig } from 'antd/es/table';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { confirm } = Modal;

const AdminMerchant: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchMerchants();
  }, [pagination.current]);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const response = await getMerchants({
        page: pagination.current,
        limit: pagination.pageSize,
      });
      setMerchants(response.data.items);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
      }));
    } catch (error) {
      message.error('获取商户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveMerchant(id);
      message.success('审核通过成功');
      fetchMerchants();
    } catch (error) {
      message.error('审核通过失败');
    }
  };

  const handleReject = (id: string) => {
    let reason = '';
    confirm({
      title: '拒绝原因',
      icon: <ExclamationCircleOutlined />,
      content: (
        <Input.TextArea
          rows={4}
          placeholder="请输入拒绝原因"
          onChange={(e) => (reason = e.target.value)}
        />
      ),
      onOk: async () => {
        if (!reason) {
          message.warning('请输入拒绝原因');
          return;
        }
        try {
          await rejectMerchant(id, reason);
          message.success('审核拒绝成功');
          fetchMerchants();
        } catch (error) {
          message.error('审核拒绝失败');
        }
      },
    });
  };

  const handleExport = async () => {
    try {
      const blob = await exportMerchantData();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `merchants-${new Date().toISOString()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('导出失败');
    }
  };

  const columns = [
    {
      title: '商户ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '商户名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '联系人',
      dataIndex: 'contact',
      key: 'contact',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: Merchant['status']) => {
        const statusMap = {
          pending: { color: 'orange', text: '待审核' },
          approved: { color: 'green', text: '已通过' },
          rejected: { color: 'red', text: '已拒绝' },
        };
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
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
      render: (_: unknown, record: Merchant) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button
                type="text"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
              >
                通过
              </Button>
              <Button
                type="text"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleReject(record.id)}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={layoutStyles.container}>
      <Card className={layoutStyles.card}>
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>商户管理</Title>
          <Space>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出数据
            </Button>
          </Space>
        </div>
        <Table<Merchant>
          columns={columns}
          dataSource={merchants}
          rowKey="id"
          pagination={pagination}
          loading={loading}
          onChange={(pagination) => setPagination(pagination)}
        />
      </Card>
    </div>
  );
};

export default AdminMerchant; 