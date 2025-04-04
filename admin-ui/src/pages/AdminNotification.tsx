import React, { useState, useEffect } from 'react';
import { Table, Card, Button, message, Modal, Input, Typography, Tag, Space, DatePicker } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { layoutStyles } from '../../theme';
import { getAllNotifications, deleteNotification, deleteNotifications } from '../api/admin';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { confirm } = Modal;

const AdminNotification: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    fetchNotifications();
  }, [pagination.current]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getAllNotifications({
        page: pagination.current,
        limit: pagination.pageSize,
      });
      setNotifications(data.items);
      setPagination(prev => ({
        ...prev,
        total: data.total,
      }));
    } catch (error) {
      message.error('获取通知列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      message.success('删除成功');
      fetchNotifications();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRows.length === 0) {
      message.warning('请选择要删除的通知');
      return;
    }

    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除选中的 ${selectedRows.length} 条通知吗？`,
      onOk: async () => {
        try {
          await deleteNotifications(selectedRows.map(row => row.id));
          message.success('批量删除成功');
          setSelectedRows([]);
          fetchNotifications();
        } catch (error) {
          message.error('批量删除失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap = {
          withdrawal: { color: 'blue', text: '提现' },
          referral: { color: 'green', text: '推广' },
          order: { color: 'orange', text: '订单' },
        };
        const { color, text } = typeMap[type] || { color: 'default', text: type };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '内容',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: '状态',
      dataIndex: 'read',
      key: 'read',
      render: (read: boolean) => (
        <Tag color={read ? 'default' : 'blue'}>
          {read ? '已读' : '未读'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.id)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <div className={layoutStyles.container}>
      <Card className={layoutStyles.card}>
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>通知管理</Title>
          <Space>
            <Button
              danger
              onClick={handleBatchDelete}
              disabled={selectedRows.length === 0}
            >
              批量删除
            </Button>
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={notifications}
          rowKey="id"
          pagination={pagination}
          loading={loading}
          onChange={(pagination) => setPagination(pagination)}
          rowSelection={{
            selectedRowKeys: selectedRows.map(row => row.id),
            onChange: (_, selectedRows) => setSelectedRows(selectedRows),
          }}
        />
      </Card>
    </div>
  );
};

export default AdminNotification; 